import { Controller, Get, Param } from '@nestjs/common';
import { PreviewService } from './preview.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('datasets/:datasetId/preview')
export class PreviewController {
  constructor(private previewService: PreviewService) {}

  @Public()
  @Get()
  getPreview(@Param('datasetId') datasetId: string, @CurrentUser() user: any) {
    return this.previewService.getPreview(datasetId, user?.id);
  }

  @Get('sample')
  getSample(@Param('datasetId') datasetId: string, @CurrentUser() user: any) {
    return this.previewService.getSample(datasetId, user.id);
  }
}
