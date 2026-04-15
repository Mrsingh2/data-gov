import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

interface LogInput {
  userId?: string;
  datasetId?: string;
  action: AuditAction;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: LogInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId,
          datasetId: input.datasetId,
          action: input.action,
          metadata: input.metadata,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch {
      // Non-blocking: audit failures must not break normal flow
    }
  }

  async getLogs(page = 1, limit = 50, filters: any = {}) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.datasetId) where.datasetId = filters.datasetId;
    if (filters.action) where.action = filters.action;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }
}
