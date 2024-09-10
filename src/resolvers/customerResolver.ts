import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import prisma from "../../prisma/client";
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
export class CustomerResolver {
  @Mutation(() => Boolean || String)
  async addAddress(
    @Arg("address") address: string,
    //   @Info() info: GraphQLResolveInfo,
    //   @Arg("data") data: FoodCreateWithoutRestaurantInput,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      const customer = await prisma.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      await prisma.customer.update({
        where: { userId },
        data: {
          address: {
            push: address, // Append the new address to the array
          },
        },
      });

      return true;
    } catch (error: any) {
      console.log(error);
      return error.message;
    }
  }

  
}
