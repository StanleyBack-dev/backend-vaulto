import { Field, InputType } from "@nestjs/graphql";
import { IsEmail } from "class-validator";

@InputType()
export class SendReferralInviteInputDto {
  @Field()
  @IsEmail({}, { message: "Informe um email válido." })
  email!: string;
}
