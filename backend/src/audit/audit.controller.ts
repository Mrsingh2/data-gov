import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('audit')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  getLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('userId') userId?: string,
    @Query('datasetId') datasetId?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getLogs(Number(page), Number(limit), {
      userId,
      datasetId,
      action,
    });
  }
}
