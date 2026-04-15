import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VersionsService {
  constructor(private prisma: PrismaService) {}

  async getMetadataVersions(datasetId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    return this.prisma.metadataVersion.findMany({
      where: { datasetId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async getDataVersions(datasetId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    return this.prisma.dataVersion.findMany({
      where: { datasetId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        fileName: true,
        fileSizeBytes: true,
        rowCount: true,
        columnNames: true,
        isLatest: true,
        changeNote: true,
        createdAt: true,
        createdById: true,
      },
    });
  }
}
