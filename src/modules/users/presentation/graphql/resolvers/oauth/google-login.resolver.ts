import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { Request, Response } from "express";
import { extractClientIp } from "@/common/utils/extract-client-ip.util";
import { RateLimit } from "@/common/rate-limit/rate-limit-tier.decorator";
import { RateLimitTier } from "@/common/rate-limit/rate-limit-tier.enum";
import { Public } from "@/common/decorators/public.decorator";
import type { IRequestInfo } from "@/common/decorators/request-info.decorator";
import { AuthCookieService } from "@/modules/auth/application/use-cases/auth-cookie.use-case";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { LoginWithGoogleUseCase } from "@/modules/users/application/use-cases/oauth/login-with-google.use-case";
import { LoginWithGoogleInputDto } from "@/modules/users/presentation/graphql/dtos/oauth/login-with-google-input.dto";

interface GraphqlContext {
  req: Request;
  res: Response;
}

@Resolver()
export class GoogleLoginResolver {
  constructor(
    private readonly loginWithGoogleUseCase: LoginWithGoogleUseCase,
    private readonly authCookieUseCase: AuthCookieService,
  ) {}

  @Public()
  @RateLimit(RateLimitTier.AUTH)
  @Mutation(() => AuthSessionResponseDto, { name: "loginWithGoogle" })
  async loginWithGoogle(
    @Args("input") input: LoginWithGoogleInputDto,
    @Context() context: GraphqlContext,
  ): Promise<AuthSessionResponseDto> {
    const { accessToken, refreshToken, response } =
      await this.loginWithGoogleUseCase.execute(
        input.idToken,
        this.extractRequestInfo(context.req),
        input.referralCode,
      );

    this.authCookieUseCase.setAuthCookies(
      context.res,
      accessToken,
      refreshToken,
    );

    return response;
  }

  private extractRequestInfo(request: Request): IRequestInfo {
    return {
      ipAddress: extractClientIp(request),
      userAgent: request.headers["user-agent"] ?? undefined,
    };
  }
}
