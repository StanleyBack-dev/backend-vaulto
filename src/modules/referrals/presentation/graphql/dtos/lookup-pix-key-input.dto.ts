import { Field, InputType } from "@nestjs/graphql";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";

@InputType()
export class LookupPixKeyInputDto {
  @Field()
  @IsString()
  @IsNotEmpty({ message: "Informe a chave Pix." })
  pixKey!: string;

  @Field(() => PixKeyType)
  @IsEnum(PixKeyType, { message: "Tipo de chave Pix inválido." })
  pixKeyType!: PixKeyType;
}
