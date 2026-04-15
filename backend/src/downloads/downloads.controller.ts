import { Controller, Get, Param, Query, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { DownloadsService } from './downloads.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class DownloadsController {
  constructor(private downloadsService: DownloadsService) {}

  @Get('datasets/:datasetId/download')
  async download(
    @Param('datasetId') datasetId: string,
    @Query('versionId') versionId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.downloadsService.download(
      datasetId,
      user.id,
      versionId,
      req.ip,
      req.headers['user-agent'],
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.csv);
  }

  @Get('users/me/downloads')
  getMyDownloads(@CurrentUser() user: any) {
    return this.downloadsService.getMyDownloads(user.id);
  }
}
