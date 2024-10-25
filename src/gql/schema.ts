import { ObjectType, Field, InputType } from "type-graphql";
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


@InputType()
export class ReviewsParam {
  @Field()
  foodId!: string;

  @Field()
  rating!: number;

  @Field({ nullable: true })
  comment?: string;
}