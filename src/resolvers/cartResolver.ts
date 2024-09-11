import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "../types/types";
import prisma from "../../prisma/client";
import {
  CreateOneOrderItemCartArgs,
  CreateOneOrderItemCartResolver,
} from "../../prisma/generated/type-graphql";
import { GraphQLResolveInfo } from "graphql/type";
import { isAuth } from "../middleware/middleware";

@Resolver()
@UseMiddleware(isAuth)
export class CartResolver {
  // Add or Update Cart Item
  @Mutation(() => Boolean)
  async addToCart(
    @Ctx() ctx: MyContext,
    @Arg("foodId") foodId: string,
    @Info() info: GraphQLResolveInfo,
    @Arg("quantity") quantity: number
  ): Promise<boolean> {
    const customerId = ctx?.user?.id as string;
    console.log("the user id is ", customerId);
    // assuming the user's ID is in the token
    // const restaurantId = await this.getRestaurantIdFromFood(foodId);

    // Find or create an Order with PENDING status for this customer
    // let order = await ctx.prisma.order.findFirst({
    //   where: { customerId, status: 'PENDING' },
    // });

    // if (!order && customerId) {
    //   // Create new order if it doesn't exist
    //   order = await prisma.order.create({
    //     data: { customerId, restaurantId, status: 'PENDING' },
    //   });
    // }

    // Check if the food item already exists in the cart (order items)
    const orderItem = await prisma.orderItemCart.findFirst({
      where: { customerId, foodId },
    });

    if (orderItem) {
      // Update quantity if item exists
      await prisma.orderItemCart.update({
        where: { id: orderItem.id },
        data: {
          quantity: orderItem.quantity + quantity,
          totalPrice:
            orderItem.totalPrice +
            (await this.calculatePrice(foodId, quantity)),
        },
      });
    } else {
      // Add new item to cart
      const createOneOrderItemCartResolver =
        new CreateOneOrderItemCartResolver();
      const args = new CreateOneOrderItemCartArgs();
      args.data = {
        food: { connect: { id: foodId } },
        quantity,
        customer: { connect: { userId: customerId } },
        totalPrice: await this.calculatePrice(foodId, quantity),
      };
      await createOneOrderItemCartResolver.createOneOrderItemCart(
        ctx,
        info,
        args
      );

      // await prisma.orderItemCart.create({
      //   data: {
      //     customerId,

      //     foodId,
      //     quantity,
      //     totalPrice: await this.calculatePrice(foodId, quantity),
      //   },
      // });
    }
    return true;
  }
  @Mutation(() => Boolean)
  async removeFromCart(
    @Ctx() ctx: MyContext,
    @Arg("foodId") foodId: string,
    @Info() info: GraphQLResolveInfo
  ): Promise<boolean> {
    const customerId = ctx?.user?.id as string;
    console.log("the user id is ", customerId);

    const orderItem = await prisma.orderItemCart.findFirst({
      where: { customerId, foodId },
    });

    if (!orderItem) {
      throw new Error("item not found in the cart");
    } else {
      await prisma.orderItemCart.delete({ where: { id: orderItem.id } });
    }

    return true;
  }

  private async getRestaurantIdFromFood(foodId: string): Promise<number> {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    return food?.restaurantId ?? 0;
  }

  private async calculatePrice(
    foodId: string,
    quantity: number
  ): Promise<number> {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    return food ? food.price * quantity : 0;
  }
}
