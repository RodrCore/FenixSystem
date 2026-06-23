import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.permisos) {
      throw new ForbiddenException('No tienes permisos');
    }

    // Verificar si el usuario tiene al menos uno de los permisos requeridos
    const tienePermiso = requiredPermissions.some((permission) => {
      const [modulo, accion] = permission.split('.');
      return user.permisos[modulo]?.[accion] === true;
    });

    if (!tienePermiso) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    return true;
  }
}