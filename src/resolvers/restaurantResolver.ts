import {
  Arg,
  Ctx,
  Info,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { isAuth } from "../middleware/middleware";
import {
  CreateOneFoodArgs,
  CreateOneFoodResolver,
  Food,
  FoodCategory,
  FoodCreateWithoutRestaurantInput,
  FoodUpdateWithoutCartsInput,
  RestaurantUpdateInput,
  UpdateOneFoodArgs,
  UpdateOneFoodResolver,
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
      await ctx.prisma.restaurant.findUniqueOrThrow({
        where: { id: userId },
      });

      const createoneFoodResolver = new CreateOneFoodResolver();
      const args = new CreateOneFoodArgs();
      args.data = { ...data, restaurant: { connect: { id: userId } } };
      await createoneFoodResolver.createOneFood(ctx, info, args);
      return true;
    } catch (error: any) {
      throw new Error("error in add food item " + error.message);
    }
  }
  @Mutation(() => String || Boolean)
  async updateFoodItem(
    @Info() info: GraphQLResolveInfo,
    @Arg("foodId") foodId: string,
    @Arg("data") data: FoodUpdateWithoutCartsInput,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      await ctx.prisma.food.findUniqueOrThrow({
        where: { id: foodId, restaurant: { id: userId } },
      });

      const updateOneFoodResolver = new UpdateOneFoodResolver();
      const args = new UpdateOneFoodArgs();
      args.where = { id: foodId };
      args.data = { ...data };
      updateOneFoodResolver.updateOneFood(ctx, info, args);

      return true;
    } catch (error: any) {
      throw new Error("error in update food item " + error.message);
    }
  }
  @Mutation(() => String || Boolean)
  async removeFoodItem(
    @Arg("foodId") foodId: string,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      const food = await ctx.prisma.food.findUniqueOrThrow({
        where: { id: foodId },
        include: { restaurant: true },
      });
      if (food.restaurant.id !== userId) {
        throw new Error("Not Authorized");
      }
      await ctx.prisma.food.delete({
        where: { id: foodId },
      });
      return true;
    } catch (error: any) {
      throw new Error("error in delete food item " + error.message);
    }
  }

  @Query(() => [Food])
  async fetchFoods(
    @Arg("category", { nullable: true }) category: FoodCategory,
    @Ctx() ctx: MyContext,
    @Arg("limit", () => Int, { defaultValue: 15 }) limit: number,
    @Arg("offset", () => Int, { defaultValue: 0 }) offset: number
  ): Promise<Food[]> {
    try {
      const filters = category ? { category } : {};
      const foods = await ctx.prisma.food.findMany({
        where: filters,
        take: limit,
        skip: offset,
      });
      return foods;
    } catch (error: any) {
      throw new Error("error in fetch foods " + error.message);
    }
  }
  @Query(() => Food)
  async fetchFood(
    @Arg("foodId") foodId: string,
    @Ctx() ctx: MyContext,
  ): Promise<Food | null> {
    try {
      const food = await ctx.prisma.food.findUniqueOrThrow({
        where: { id: foodId },
      });
      return food;
    } catch (error: any) {
      throw new Error("error in fetch food " + error.message); 
    }
  }

  @Query(() => [Food])
  async searchFoods(
    @Arg("name") name: string,
    @Ctx() ctx: MyContext
  ): Promise<Food[]> {
    try {
      const foods = await ctx.prisma.food.findMany({
        where: {
          name: {
            contains: name,
            mode: "insensitive",
          },
        },
      });
      return foods;
    } catch (error: any) {
      throw new Error("Error searching foods by name: " + error.message);
    }
  }

  @Query(() => [Food])
  async getBestSellers(
    @Ctx() ctx: MyContext,
    @Arg("limit", () => Int, { defaultValue: 8 }) limit: number
  ): Promise<Food[]> {
    try {
      const bestSellers = await ctx.prisma.food.findMany({
        orderBy: { orderCount: "desc" },
        take: limit,
      });

      return bestSellers;
    } catch (error: any) {
      throw new Error("Error fetching best sellers: " + error.message);
    }
  }

  @Query(() => [Food])
  async getSuggestion(
    @Ctx() ctx: MyContext,
    @Arg("limit", () => Int, { defaultValue: 8 }) limit: number
  ): Promise<Food[]> {
    try {
      const suggestedFoods = await ctx.prisma.food.findMany({
        orderBy: { averageRating: "desc" },
        take: limit,
      });

      return suggestedFoods;
    } catch (error: any) {
      throw new Error("Error fetching best sellers: " + error.message);
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
      await ctx.prisma.restaurant.findUniqueOrThrow({
        where: { id: userId },
      });

      const updateOneRestaurantResolver = new UpdateOneRestaurantResolver();
      const args = new UpdateOneRestaurantArgs();
      args.where = { id: userId };
      args.data = data;
      await updateOneRestaurantResolver.updateOneRestaurant(ctx, info, args);
      return true;
    } catch (error: any) {
      throw new Error("error in update restaurant " + error.message);
    }
  }
}
