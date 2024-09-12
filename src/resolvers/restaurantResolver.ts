import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { isAuth } from "../middleware/middleware";
import {
  CreateOneFoodArgs,
  CreateOneFoodResolver,
  FoodCreateWithoutRestaurantInput,
  RestaurantUpdateInput,
  UpdateOneRestaurantArgs,
  UpdateOneRestaurantResolver,
} from "../../prisma/generated/type-graphql";
import { GraphQLResolveInfo } from "graphql";
import { MyContext } from "../types/types";

@Resolver()
@UseMiddleware(isAuth)
export class RestaurantResolver {
  @Mutation(() => Boolean || String)
  async addFoodItem(
    @Info() info: GraphQLResolveInfo,
    @Arg("data") data: FoodCreateWithoutRestaurantInput,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      const restaurant = await ctx.prisma.restaurant.findUnique({
        where: { userId },
      });
      if (!restaurant) {
        throw new Error("Something went wrong, no restaurant found");
      }

      const createoneFoodResolver = new CreateOneFoodResolver();
      const args = new CreateOneFoodArgs();
      args.data = { ...data, restaurant: { connect: { userId } } };
      const res = await createoneFoodResolver.createOneFood(ctx, info, args);
      console.log("FInal res is ", res);
      return true;
    } catch (error: any) {
      console.log(error);
      return error.message;
    }
  }

  @Mutation(() => String || Boolean)
  @UseMiddleware(isAuth)
  async updateRestaurant(
    @Arg("data") data: RestaurantUpdateInput,
    @Info() info: GraphQLResolveInfo,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      const updateOneRestaurantResolver = new UpdateOneRestaurantResolver();
      const args = new UpdateOneRestaurantArgs();
      args.where = { userId };
      args.data = data;
      const res = await updateOneRestaurantResolver.updateOneRestaurant(
        ctx,
        info,
        args
      );
      return true;
    } catch (error: any) {
      console.log("error while updating restaurant data ", error);
      return "something went wrong";
    }
  }
}
