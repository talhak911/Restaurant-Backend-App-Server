import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { isAuth } from "../middleware/middleware";
import { MyContext } from "../types/types";
import {
  UpdateOneUserArgs,
  UpdateOneUserResolver,
  UserUpdateWithoutRestaurantInput,
} from "../../prisma/generated/type-graphql";
import { GraphQLResolveInfo } from "graphql/type";

@Resolver()
@UseMiddleware(isAuth)
export class CustomerResolver {
  @Mutation(() => Boolean || String)
  async addCustomerAddress(
    @Arg("address") address: string,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      await ctx.prisma.customer.findUniqueOrThrow({
        where: { id: userId },
      });

      await ctx.prisma.customer.update({
        where: { id: userId },
        data: {
          address: {
            push: address,
          },
        },
      });

      return true;
    } catch (error: any) {
      throw new Error("Error while adding address " + error.message);
    }
  }
  @Mutation(() => Boolean || String)
  async updateUser(
    @Arg("data") data: UserUpdateWithoutRestaurantInput,
    @Info() info: GraphQLResolveInfo,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      await ctx.prisma.customer.findUniqueOrThrow({
        where: { id: userId },
      });
      const updateOneUserResolver = new UpdateOneUserResolver();
      const args = new UpdateOneUserArgs();
      args.where = { id: userId };
      args.data = { ...data };
      await updateOneUserResolver.updateOneUser(ctx, info, args);

      return true;
    } catch (error: any) {
      throw new Error("Error while adding address " + error.message);
    }
  }
}
