import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-admin-key'] as string | undefined;
    const expected = this.config.get<string>('ADMIN_API_KEY') ?? 'change-me-admin-key';
    if (!key || key !== expected) {
      throw new ForbiddenException('Administrator access required');
    }
    return true;
  }
}
