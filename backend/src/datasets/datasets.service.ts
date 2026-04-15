import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { SearchDatasetDto } from './dto/search-dataset.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class DatasetsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateDatasetDto, ip?: string) {
    const dataset = await this.prisma.dataset.create({
      data: {
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
        visibility: dto.visibility || 'PUBLIC',
        accessClassification: dto.accessClassification || 'OPEN',
        ownerId: userId,
      },
    });

    // Record first metadata version
    await this.prisma.metadataVersion.create({
      data: {
        datasetId: dataset.id,
        versionNumber: 1,
        title: dataset.title,
        description: dataset.description,
        tags: dataset.tags,
        visibility: dataset.visibility,
        accessClassification: dataset.accessClassification,
        changeNote: 'Initial version',
        createdById: userId,
      },
    });

    await this.auditService.log({
      userId,
      datasetId: dataset.id,
      action: AuditAction.DATASET_CREATE,
      ipAddress: ip,
    });

    // Update user role to OWNER if not already
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: { set: 'OWNER' } },
    });

    return dataset;
  }

  async search(dto: SearchDatasetDto, currentUserId?: string) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Visibility: non-authenticated see only PUBLIC; authenticated see PUBLIC + their own PRIVATE
    if (!currentUserId) {
      where.visibility = 'PUBLIC';
    } else {
      where.OR = [
        { visibility: 'PUBLIC' },
        { ownerId: currentUserId },
        {
          visibility: 'PRIVATE',
          accessGrants: { some: { userId: currentUserId, isActive: true } },
        },
      ];
    }

    if (dto.accessClassification) {
      where.accessClassification = dto.accessClassification;
    }

    if (dto.q) {
      const searchOr = [
        { title: { contains: dto.q, mode: 'insensitive' as any } },
        { description: { contains: dto.q, mode: 'insensitive' as any } },
        { tags: { has: dto.q } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    if (dto.tags) {
      const tagList = dto.tags.split(',').map((t) => t.trim());
      where.tags = { hasSome: tagList };
    }

    if (dto.owner) {
      const owner = await this.prisma.user.findFirst({
        where: { email: { contains: dto.owner, mode: 'insensitive' } },
      });
      if (owner) where.ownerId = owner.id;
    }

    const [datasets, total] = await Promise.all([
      this.prisma.dataset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { dataVersions: true, accessRequests: true } },
        },
      }),
      this.prisma.dataset.count({ where }),
    ]);

    return { datasets, total, page, limit };
  }

  async findOne(id: string, currentUserId?: string, ip?: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        dataVersions: {
          where: { isLatest: true },
          select: {
            id: true,
            versionNumber: true,
            fileName: true,
            rowCount: true,
            columnNames: true,
            createdAt: true,
          },
        },
        columnRules: { where: { isActive: true } },
        _count: { select: { dataVersions: true, accessRequests: true } },
      },
    });

    if (!dataset) throw new NotFoundException('Dataset not found');

    // Visibility check
    if (dataset.visibility === 'PRIVATE') {
      if (!currentUserId) throw new ForbiddenException('Access denied');
      if (dataset.ownerId !== currentUserId) {
        const grant = await this.prisma.accessGrant.findFirst({
          where: { datasetId: id, userId: currentUserId, isActive: true },
        });
        if (!grant) throw new ForbiddenException('Access denied');
      }
    }

    // Increment view count (non-blocking)
    this.prisma.dataset.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    if (currentUserId) {
      await this.auditService.log({
        userId: currentUserId,
        datasetId: id,
        action: AuditAction.DATASET_VIEW,
        ipAddress: ip,
      });
    }

    // Attach access info for current user
    let userAccess: any = null;
    if (currentUserId) {
      const grant = await this.prisma.accessGrant.findFirst({
        where: { datasetId: id, userId: currentUserId, isActive: true },
      });
      const request = await this.prisma.accessRequest.findFirst({
        where: { datasetId: id, userId: currentUserId },
      });
      userAccess = {
        hasGrant: !!grant,
        requestStatus: request?.status || null,
        isOwner: dataset.ownerId === currentUserId,
      };
    }

    return { ...dataset, userAccess };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateDatasetDto,
    ip?: string,
  ) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    if (dataset.ownerId !== userId) throw new ForbiddenException('Not the owner');

    const updated = await this.prisma.dataset.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.visibility && { visibility: dto.visibility }),
        ...(dto.accessClassification && {
          accessClassification: dto.accessClassification,
        }),
      },
    });

    // Create new metadata version
    const lastVersion = await this.prisma.metadataVersion.count({
      where: { datasetId: id },
    });
    await this.prisma.metadataVersion.create({
      data: {
        datasetId: id,
        versionNumber: lastVersion + 1,
        title: updated.title,
        description: updated.description,
        tags: updated.tags,
        visibility: updated.visibility,
        accessClassification: updated.accessClassification,
        changeNote: dto.changeNote,
        createdById: userId,
      },
    });

    await this.auditService.log({
      userId,
      datasetId: id,
      action: AuditAction.DATASET_UPDATE,
      ipAddress: ip,
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    if (dataset.ownerId !== userId) throw new ForbiddenException('Not the owner');

    await this.prisma.dataset.delete({ where: { id } });
    return { message: 'Dataset deleted' };
  }

  async findMine(userId: string) {
    return this.prisma.dataset.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { dataVersions: true, accessRequests: true, downloads: true },
        },
      },
    });
  }
}
