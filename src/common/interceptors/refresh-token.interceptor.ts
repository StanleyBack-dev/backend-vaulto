import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { Observable, tap } from "rxjs";

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.getArgByIndex(2) as { res?: Record<string, unknown> };
    return next.handle().pipe(
      tap((data: unknown) => {
        const d = data as { refreshToken?: string };
        const res = ctx.res ? (ctx.res as unknown as Response) : undefined;
        if (d?.refreshToken && res) {
          res.cookie("refreshToken", d.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
        }
      }),
    );
  }
}
