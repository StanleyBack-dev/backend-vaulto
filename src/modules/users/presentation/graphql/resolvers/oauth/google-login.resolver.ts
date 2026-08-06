import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { Request, Response } from "express";
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
  @Mutation(() => AuthSessionResponseDto, { name: "loginWithGoogle" })
  async loginWithGoogle(
    @Args("input") input: LoginWithGoogleInputDto,
    @Context() context: GraphqlContext,
  ): Promise<AuthSessionResponseDto> {
    const { accessToken, refreshToken, response } =
      await this.loginWithGoogleUseCase.execute(
        input.idToken,
        this.extractRequestInfo(context.req),
      );

    this.authCookieUseCase.setAuthCookies(
      context.res,
      accessToken,
      refreshToken,
    );

    return response;
  }

  private extractRequestInfo(request: Request): IRequestInfo {
    const forwardedFor = request.headers["x-forwarded-for"];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (forwardedFor?.split(",")[0]?.trim() ?? request.socket.remoteAddress);

    return {
      ipAddress,
      userAgent: request.headers["user-agent"] ?? undefined,
    };
  }
}
