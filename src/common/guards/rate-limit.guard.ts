import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
// import { rateLimitConfig } from '../../config/rate-limit.config';
// import { GqlExecutionContext } from '@nestjs/graphql';
// import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType<"http" | "graphql">();

    // let req: Record<string, unknown>;
    if (type === "http") {
      // req = context.switchToHttp().getRequest();
    } else if (type === "graphql") {
      // const gqlCtx = GqlExecutionContext.create(context);
      // const ctx = gqlCtx.getContext();
      // req = ctx.req as Record<string, unknown>;
    } else {
      return true;
    }

    // const config = rateLimitConfig(this.configService);
    // const moduleKey = Object.keys(config).find((k) =>
    //     className.includes(k),
    // );
    // const { ttl, limit } = moduleKey ? config[moduleKey] : config.default;
    // const identity = userId ? `user:${userId}` : `ip:${ip}`;
    // const key = `ratelimit:${type}:${className}:${routeKey}:${identity}`;

    return true;
  }
}
