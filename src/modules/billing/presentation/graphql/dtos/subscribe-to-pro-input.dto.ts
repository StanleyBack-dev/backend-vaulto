import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class SubscribeToProInputDto {
  @Field()
  cpfCnpj!: string;
}
