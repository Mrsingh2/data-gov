import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  async getKpis() {
    const [
      totalPublicDatasets,
      totalViews,
      totalDownloads,
      totalUsers,
      recentDatasets,
    ] = await Promise.all([
      this.prisma.dataset.count({ where: { visibility: 'PUBLIC' } }),
      this.prisma.dataset.aggregate({
        where: { visibility: 'PUBLIC' },
        _sum: { viewCount: true },
      }),
      this.prisma.dataset.aggregate({
        where: { visibility: 'PUBLIC' },
        _sum: { downloadCount: true },
      }),
      this.prisma.user.count(),
      this.prisma.dataset.findMany({
        where: { visibility: 'PUBLIC' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          accessClassification: true,
          viewCount: true,
          downloadCount: true,
          createdAt: true,
          owner: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalPublicDatasets,
      totalViews: totalViews._sum.viewCount || 0,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      totalUsers,
      recentDatasets,
    };
  }
}
