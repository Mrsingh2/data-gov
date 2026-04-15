import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProtectionService } from '../protection/protection.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { IStorageService, STORAGE_SERVICE } from '../upload/storage/storage.interface';
import * as Papa from 'papaparse';

@Injectable()
export class DownloadsService {
  constructor(
    private prisma: PrismaService,
    private protectionService: ProtectionService,
    private auditService: AuditService,
    @Inject(STORAGE_SERVICE) private storage: IStorageService,
  ) {}

  async download(
    datasetId: string,
    userId: string,
    versionId?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ csv: string; fileName: string }> {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');

    // Visibility check
    if (dataset.visibility === 'PRIVATE' && dataset.ownerId !== userId) {
      const grant = await this.prisma.accessGrant.findFirst({
        where: { datasetId, userId, isActive: true },
      });
      if (!grant) throw new ForbiddenException('Access denied');
    }

    // Access classification check
    const hasFullAccess = await this.checkFullAccess(dataset, userId);

    // Get data version
    const dataVersion = versionId
      ? await this.prisma.dataVersion.findFirst({
          where: { id: versionId, datasetId },
        })
      : await this.prisma.dataVersion.findFirst({
          where: { datasetId, isLatest: true },
        });

    if (!dataVersion) throw new NotFoundException('No data uploaded yet');

    // Get column rules
    const columnRules = await this.protectionService.getColumnRules(datasetId);
    const columnStats = dataVersion.columnStats as Record<string, any>;

    // Fetch rows, filtering restricted rows if user lacks full access
    const rows = await this.prisma.dataRow.findMany({
      where: {
        dataVersionId: dataVersion.id,
        ...(hasFullAccess ? {} : { isRestricted: false }),
      },
      orderBy: { rowIndex: 'asc' },
    });

    // Apply column protection transforms
    const transformedRows = rows.map((r) =>
      this.protectionService.applyColumnRules(
        r.data as Record<string, any>,
        columnRules as any,
        columnStats,
      ),
    );

    // Record download
    await this.prisma.download.create({
      data: {
        userId,
        datasetId,
        dataVersionId: dataVersion.id,
        ipAddress: ip,
        userAgent,
      },
    });

    // Increment dataset download count
    await this.prisma.dataset.update({
      where: { id: datasetId },
      data: { downloadCount: { increment: 1 } },
    });

    await this.auditService.log({
      userId,
      datasetId,
      action: AuditAction.DATASET_DOWNLOAD,
      ipAddress: ip,
      metadata: { versionId: dataVersion.id, versionNumber: dataVersion.versionNumber },
    });

    const csv = Papa.unparse(transformedRows, {
      columns: dataVersion.columnNames,
    });

    return {
      csv,
      fileName: `${dataset.title.replace(/[^a-z0-9]/gi, '_')}_v${dataVersion.versionNumber}.csv`,
    };
  }

  async getMyDownloads(userId: string) {
    return this.prisma.download.findMany({
      where: { userId },
      orderBy: { downloadedAt: 'desc' },
      include: {
        dataset: { select: { id: true, title: true, visibility: true } },
        dataVersion: { select: { versionNumber: true, fileName: true } },
      },
    });
  }

  private async checkFullAccess(dataset: any, userId: string): Promise<boolean> {
    if (dataset.ownerId === userId) return true;
    if (dataset.accessClassification === 'OPEN') return true;
    if (dataset.accessClassification === 'REGISTERED') return true;
    const grant = await this.prisma.accessGrant.findFirst({
      where: { datasetId: dataset.id, userId, isActive: true },
    });
    return !!grant;
  }
}
