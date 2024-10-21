import { ObjectType, Field } from "type-graphql";
import { User } from "../../prisma/generated/type-graphql";

@ObjectType()
export class SignInResponse {
  @Field(() => User)
  user!: User;

  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;
}
