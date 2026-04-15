import { Module } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { DatasetsController } from './datasets.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [DatasetsService],
  controllers: [DatasetsController],
  exports: [DatasetsService],
})
export class DatasetsModule {}
