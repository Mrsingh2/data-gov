import { Controller, Get, Param } from '@nestjs/common';
import { VersionsService } from './versions.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('datasets/:datasetId/versions')
export class VersionsController {
  constructor(private versionsService: VersionsService) {}

  @Get('metadata')
  getMetadataVersions(@Param('datasetId') datasetId: string) {
    return this.versionsService.getMetadataVersions(datasetId);
  }

  @Get('data')
  getDataVersions(@Param('datasetId') datasetId: string) {
    return this.versionsService.getDataVersions(datasetId);
  }
}
