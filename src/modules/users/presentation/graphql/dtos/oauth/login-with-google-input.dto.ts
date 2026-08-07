import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class LoginWithGoogleInputDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
