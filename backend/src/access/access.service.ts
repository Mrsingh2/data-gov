import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ReviewAccessRequestDto } from './dto/review-access-request.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AccessService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async requestAccess(userId: string, dto: CreateAccessRequestDto, ip?: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: dto.datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');

    if (dataset.ownerId === userId) {
      throw new ForbiddenException('You own this dataset');
    }

    if (dataset.accessClassification !== 'RESTRICTED') {
      throw new ForbiddenException('Dataset does not require access requests');
    }

    const existing = await this.prisma.accessRequest.findFirst({
      where: { userId, datasetId: dto.datasetId },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ConflictException('Access request already pending');
      }
      if (existing.status === 'APPROVED') {
        throw new ConflictException('Access already granted');
      }
      // Allow re-request if previously rejected
      return this.prisma.accessRequest.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING',
          message: dto.message,
          reviewNote: null,
          reviewedAt: null,
          reviewedBy: null,
        },
      });
    }

    const request = await this.prisma.accessRequest.create({
      data: {
        userId,
        datasetId: dto.datasetId,
        message: dto.message,
        status: 'PENDING',
      },
    });

    await this.auditService.log({
      userId,
      datasetId: dto.datasetId,
      action: AuditAction.ACCESS_REQUEST_CREATE,
      ipAddress: ip,
    });

    return request;
  }

  async getPendingRequests(ownerId: string) {
    return this.prisma.accessRequest.findMany({
      where: {
        status: 'PENDING',
        dataset: { ownerId },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        dataset: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRequests(userId: string) {
    return this.prisma.accessRequest.findMany({
      where: { userId },
      include: {
        dataset: { select: { id: true, title: true, accessClassification: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewRequest(
    requestId: string,
    ownerId: string,
    dto: ReviewAccessRequestDto,
    ip?: string,
  ) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { dataset: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.dataset.ownerId !== ownerId) {
      throw new ForbiddenException('Not your dataset');
    }
    if (request.status !== 'PENDING') {
      throw new ConflictException('Request already reviewed');
    }

    const updated = await this.prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote,
        reviewedAt: new Date(),
        reviewedBy: ownerId,
      },
    });

    if (dto.status === 'APPROVED') {
      await this.prisma.accessGrant.upsert({
        where: { userId_datasetId: { userId: request.userId, datasetId: request.datasetId } },
        create: {
          userId: request.userId,
          datasetId: request.datasetId,
          requestId: request.id,
          grantedBy: ownerId,
          isActive: true,
        },
        update: { isActive: true, grantedBy: ownerId },
      });
    }

    const action =
      dto.status === 'APPROVED'
        ? AuditAction.ACCESS_REQUEST_APPROVE
        : AuditAction.ACCESS_REQUEST_REJECT;

    await this.auditService.log({
      userId: ownerId,
      datasetId: request.datasetId,
      action,
      ipAddress: ip,
      metadata: { requestId, requestUserId: request.userId },
    });

    return updated;
  }
}
