import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AvatarGender } from '@prisma/client';
import { AvatarService } from './avatar.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';

class CreateVoiceSessionDto {
  @IsUUID()
  consultationId!: string;

  @IsOptional()
  @IsEnum(AvatarGender)
  avatarGender?: AvatarGender;
}

@ApiTags('voice-sessions')
@Controller('voice-sessions')
@UseGuards(SessionGuard)
export class AvatarController {
  constructor(private readonly avatar: AvatarService) {}

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() body: CreateVoiceSessionDto) {
    return this.avatar.createVoiceSession(
      user.id,
      body.consultationId,
      body.avatarGender ?? 'FEMALE',
    );
  }

  @Post(':id/token')
  token(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.avatar.token(user.id, id);
  }

  @Post(':id/interrupt')
  interrupt(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.avatar.interrupt(user.id, id);
  }

  @Post(':id/end')
  end(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.avatar.end(user.id, id);
  }
}
