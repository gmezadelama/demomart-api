import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header = (req.headers['x-admin-token'] ||
      req.headers['X-Admin-Token']) as string | undefined;
    const expected = process.env.ADMIN_TOKEN;
    if (!header || !expected || header !== expected) {
      throw new UnauthorizedException(
        'Admin token not provided ' + `${header || ' no-header'}`,
      );
    }
    return true;
  }
}
