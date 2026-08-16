import { Field, ObjectType } from "@nestjs/graphql";
import { AuthUserDto } from "./auth-user.dto";

@ObjectType()
export class AuthSessionResponseDto {
  @Field()
  authenticated!: boolean;

  @Field()
  mustChangePassword!: boolean;

  @Field()
  onboardingTourCompleted!: boolean;

  @Field()
  termsAccepted!: boolean;

  @Field(() => AuthUserDto)
  user!: AuthUserDto;
}
