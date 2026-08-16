import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@InputType()
export class LoginWithGoogleInputDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  // Only used the first time this Google account signs in (new user); an
  // invalid or missing code never blocks login.
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referralCode?: string;
}
