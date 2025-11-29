import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_ACCESS_KEY } from '../decorators/module-access.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModule = this.reflector.getAllAndOverride<string>(MODULE_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (!user) {
      return false;
    }

    // Admins have access to all modules
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // If allowedModules is null, undefined, or empty array, grant access (backward compatibility)
    // This means if no modules are explicitly restricted, allow access
    if (!user.allowedModules || user.allowedModules.length === 0) {
      return true;
    }

    // Check if user has access to the required module
    return user.allowedModules.includes(requiredModule);
  }
}


