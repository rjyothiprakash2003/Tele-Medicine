import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';

@ApiTags('medical-documents')
@Controller('medical-documents')
@UseGuards(SessionGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.documents.list(user.id);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string' },
        consultationId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: SessionUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: DocumentType = DocumentType.PRIOR_PRESCRIPTION,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.documents.upload(user.id, file, type, consultationId);
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { doc, buffer } = await this.documents.getFile(user.id, id);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.send(buffer);
  }

  @Delete(':id')
  remove(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.documents.remove(user.id, id);
  }
}
