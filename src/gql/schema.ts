import { ObjectType, Field, InputType } from "type-graphql";
import { Role, User } from "../../prisma/generated/type-graphql";

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

@InputType()
export class OAuthSignUpInputs {
  @Field()
  name!: string;
  @Field()
  password!: string;
  @Field()
  role!: Role;
  @Field()
  dateOfBirth!: string;
  @Field()
  phone!: string
  @Field({ nullable: true })
  picture?: string
}

