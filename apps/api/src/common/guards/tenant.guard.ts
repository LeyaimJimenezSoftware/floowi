import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('No encontramos el estudio asociado a esta sesion.');
    }

    request.tenantId = tenantId;
    return true;
  }
}
