import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ConsultationsService } from './consultations.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ConsultationMode, AvatarGender } from '@prisma/client';
import { AiService } from '../ai/ai.service';

class StartConsultationDto {
  @IsEnum(ConsultationMode)
  mode!: ConsultationMode;

  @IsOptional()
  @IsEnum(AvatarGender)
  avatarGender?: AvatarGender;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  useMedicalProfile?: boolean;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}

class SendMessageDto {
  @IsString()
  @MaxLength(8000)
  content!: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;
}

@ApiTags('conversations')
@Controller()
@UseGuards(SessionGuard)
export class ConsultationsController {
  constructor(
    private readonly consultations: ConsultationsService,
    private readonly ai: AiService,
  ) {}

  @Post('conversations')
  start(@CurrentUser() user: SessionUser, @Body() body: StartConsultationDto) {
    return this.consultations.start(user.id, body);
  }

  @Get('conversations')
  list(@CurrentUser() user: SessionUser) {
    return this.consultations.list(user.id);
  }

  @Get('conversations/token/:tokenNumber')
  byToken(@CurrentUser() user: SessionUser, @Param('tokenNumber') tokenNumber: string) {
    return this.consultations.getByToken(user.id, tokenNumber);
  }

  @Get('conversations/:id')
  get(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.consultations.get(user.id, id);
  }

  @Post('conversations/:id/messages')
  message(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.consultations.sendMessage(user.id, id, body.content, body.requestId);
  }

  @Post('conversations/:id/messages/stream')
  async stream(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
    @Res() res: Response,
  ) {
    // Persist via normal path first for safety/emergency handling, then stream a copy of the reply.
    const result = await this.consultations.sendMessage(
      user.id,
      id,
      body.content,
      body.requestId,
    );
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (result.emergency) {
      res.write(`data: ${JSON.stringify({ type: 'emergency', ...result })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const message =
      result.message && typeof result.message === 'object' ? result.message : null;
    const content = message?.content ?? '';
    const chunks = content.match(/.{1,48}/gs) ?? [content];
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ type: 'delta', content: chunk })}\n\n`);
    }
    res.write(
      `data: ${JSON.stringify({ type: 'done', mock: this.ai.isMock(), messageId: message?.id })}\n\n`,
    );
    res.end();
  }

  @Post('conversations/:id/end')
  end(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.consultations.end(user.id, id);
  }
}
