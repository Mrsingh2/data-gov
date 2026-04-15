import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProtectionService } from '../protection/protection.service';

@Injectable()
export class PreviewService {
  constructor(
    private prisma: PrismaService,
    private protectionService: ProtectionService,
  ) {}

  async getPreview(datasetId: string, currentUserId?: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');

    if (dataset.visibility === 'PRIVATE') {
      if (!currentUserId) throw new ForbiddenException('Access denied');
      if (dataset.ownerId !== currentUserId) {
        const grant = await this.prisma.accessGrant.findFirst({
          where: { datasetId, userId: currentUserId, isActive: true },
        });
        if (!grant) throw new ForbiddenException('Access denied');
      }
    }

    const latestVersion = await this.prisma.dataVersion.findFirst({
      where: { datasetId, isLatest: true },
    });
    if (!latestVersion) return { rowCount: 0, columns: [] };

    const columnRules = await this.protectionService.getColumnRules(datasetId);
    const protectedColumns = new Set(columnRules.map((r) => r.columnName));

    const hasFullAccess =
      currentUserId &&
      (dataset.ownerId === currentUserId ||
        (await this.prisma.accessGrant.findFirst({
          where: { datasetId, userId: currentUserId, isActive: true },
        })));

    const statsRaw = latestVersion.columnStats as Record<string, any>;
    const columnNames = latestVersion.columnNames;

    const columns = columnNames.map((colName) => {
      const stat = statsRaw[colName] || {};
      const isProtected = protectedColumns.has(colName);

      // If column is protected and user lacks full access: hide detailed stats
      if (isProtected && !hasFullAccess) {
        return {
          name: colName,
          isProtected: true,
          nullCount: stat.nullCount ?? 0,
          uniqueCount: null, // hidden
          type: stat.type ?? 'unknown',
          min: null,
          max: null,
          mean: null,
          stdDev: null,
          topValues: [], // no value enumeration
          message: 'This column is protected. Request access to see detailed statistics.',
        };
      }

      return {
        name: colName,
        isProtected,
        nullCount: stat.nullCount ?? 0,
        uniqueCount: stat.uniqueCount ?? 0,
        type: stat.type ?? 'string',
        min: stat.min ?? null,
        max: stat.max ?? null,
        mean: stat.mean ?? null,
        stdDev: stat.stdDev ?? null,
        topValues: stat.topValues ?? [],
      };
    });

    return {
      datasetId,
      versionId: latestVersion.id,
      rowCount: latestVersion.rowCount,
      columns,
      hasFullAccess: !!hasFullAccess,
    };
  }

  async getSample(datasetId: string, currentUserId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset not found');

    const hasAccess = await this.checkAccess(dataset, currentUserId);
    if (!hasAccess) throw new ForbiddenException('Access denied. Request access first.');

    const latestVersion = await this.prisma.dataVersion.findFirst({
      where: { datasetId, isLatest: true },
    });
    if (!latestVersion) return { rows: [] };

    const columnRules = await this.protectionService.getColumnRules(datasetId);
    const stats = latestVersion.columnStats as Record<string, any>;

    const rows = await this.prisma.dataRow.findMany({
      where: { dataVersionId: latestVersion.id, isRestricted: false },
      take: 10,
      orderBy: { rowIndex: 'asc' },
    });

    const transformedRows = rows.map((r) =>
      this.protectionService.applyColumnRules(r.data as Record<string, any>, columnRules as any, stats),
    );

    return {
      versionId: latestVersion.id,
      columnNames: latestVersion.columnNames,
      rows: transformedRows,
    };
  }

  private async checkAccess(dataset: any, userId: string): Promise<boolean> {
    if (dataset.ownerId === userId) return true;
    if (dataset.accessClassification === 'OPEN') return true;
    if (dataset.accessClassification === 'REGISTERED') return true;
    const grant = await this.prisma.accessGrant.findFirst({
      where: { datasetId: dataset.id, userId, isActive: true },
    });
    return !!grant;
  }
}
