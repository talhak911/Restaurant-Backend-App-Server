import prisma from "../../prisma/client";
import { Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../middleware/middleware";
import { Order } from "../../prisma/generated/type-graphql";
import { MyContext } from "../types/types";

@Resolver()
@UseMiddleware(isAuth)
export class OrderResolver {
  @Mutation(() => Order)
  async placeOrder(@Ctx() ctx: MyContext): Promise<Order> {
    const userId = ctx.user?.id as string;

    // Fetch all cart items for the current customer
    const cartItems = await ctx.prisma.orderItemCart.findMany({
      where: { customerId: userId },
      include: { food: true },
    });

    if (cartItems.length === 0) {
      throw new Error("Cart is empty.");
    }

    // Calculate total price
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // Create the order with foods array
    const order = await ctx.prisma.order.create({
      data: {
        totalPrice,
        customer: { connect: { userId } },
        restaurant: {
          connect: {
            id: await this.getRestaurantIdFromFood(cartItems[0].foodId),
          },
        },
        foods: {
          food: cartItems.map((item) => (item)),
        },
        status: "PENDING",
      },
    });

    await ctx.prisma.orderItemCart.deleteMany({
      where: { customerId: userId },
    });

    return order;
  }



  
  // @Mutation(() => Order)
  // async fetchOrders(@Ctx() ctx: MyContext): Promise<Order> {
  //   const userId = ctx.user?.id as string;

  //   return order;
  // }




  private async getRestaurantIdFromFood(foodId: string): Promise<number> {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    return food?.restaurantId ?? 0;
  }
}