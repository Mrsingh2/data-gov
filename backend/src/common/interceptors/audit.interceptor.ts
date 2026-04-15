import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditAction } from '@prisma/client';

export const AUDIT_ACTION_KEY = 'auditAction';
export const Audit = (action: AuditAction) =>
  (target: any, key?: any, descriptor?: any) => {
    Reflect.defineMetadata(AUDIT_ACTION_KEY, action, descriptor?.value || target);
    return descriptor;
  };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        // Audit writing handled directly in services for precision
      }),
    );
  }
}
