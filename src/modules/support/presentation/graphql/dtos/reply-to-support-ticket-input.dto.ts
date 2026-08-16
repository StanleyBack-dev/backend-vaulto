import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class ReplyToSupportTicketInputDto {
  @Field()
  idSupportMessage!: string;

  @Field()
  reply!: string;
}
