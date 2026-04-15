import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CsvParserService } from './csv-parser.service';
import { IStorageService, STORAGE_SERVICE } from './storage/storage.interface';
import { ProtectionService } from '../protection/protection.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private csvParser: CsvParserService,
    private protectionService: ProtectionService,
    private auditService: AuditService,
    @Inject(STORAGE_SERVICE) private storage: IStorageService,
  ) {}

  async uploadCsv(
    datasetId: string,
    userId: string,
    file: Express.Multer.File,
    changeNote?: string,
    ip?: string,
  ) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    if (dataset.ownerId !== userId) throw new ForbiddenException('Not the owner');

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    // Parse CSV
    const parsed = this.csvParser.parse(file.buffer);

    if (parsed.rows.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    // Mark previous versions as not latest
    await this.prisma.dataVersion.updateMany({
      where: { datasetId, isLatest: true },
      data: { isLatest: false },
    });

    const lastVersion = await this.prisma.dataVersion.count({ where: { datasetId } });

    // Store file
    const storageKey = `datasets/${datasetId}/${Date.now()}_${file.originalname}`;
    const storedKey = await this.storage.put(storageKey, file.buffer, file.originalname);

    // Get active row rules
    const rowRules = await this.protectionService.getRowRules(datasetId);

    // Create data version record
    const dataVersion = await this.prisma.dataVersion.create({
      data: {
        datasetId,
        versionNumber: lastVersion + 1,
        fileName: file.originalname,
        fileSizeBytes: file.size,
        rowCount: parsed.rows.length,
        columnNames: parsed.headers,
        columnStats: parsed.columnStats as any,
        storageKey: storedKey,
        changeNote,
        isLatest: true,
        createdById: userId,
      },
    });

    // Batch-insert rows (chunked to avoid memory issues)
    const CHUNK = 500;
    for (let i = 0; i < parsed.rows.length; i += CHUNK) {
      const chunk = parsed.rows.slice(i, i + CHUNK);
      await this.prisma.dataRow.createMany({
        data: chunk.map((row, j) => ({
          dataVersionId: dataVersion.id,
          rowIndex: i + j,
          data: row,
          isRestricted: this.protectionService.isRowRestricted(row, rowRules as any),
        })),
      });
    }

    await this.auditService.log({
      userId,
      datasetId,
      action: AuditAction.VERSION_CREATE,
      ipAddress: ip,
      metadata: { versionNumber: dataVersion.versionNumber, rowCount: parsed.rows.length },
    });

    return {
      versionId: dataVersion.id,
      versionNumber: dataVersion.versionNumber,
      rowCount: parsed.rows.length,
      columnNames: parsed.headers,
      schema: parsed.schema,
    };
  }
}
