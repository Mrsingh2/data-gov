import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('csv/:datasetId')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(
    @Param('datasetId') datasetId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('changeNote') changeNote: string,
    @Req() req: Request,
  ) {
    return this.uploadService.uploadCsv(datasetId, user.id, file, changeNote, req.ip);
  }
}
