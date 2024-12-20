import prisma from "../../prisma/client";
import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/middleware";
import {
  FindManyOrderArgs,
  FindManyOrderResolver,
  Order,
  OrderStatus,
} from "../../prisma/generated/type-graphql";
import { MyContext } from "../types/types";
import { GraphQLResolveInfo } from "graphql/type";

@Resolver()
@UseMiddleware(isAuth)
export class OrderResolver {
  @Mutation(() => Order)
  async placeOrder(
    @Ctx() ctx: MyContext,
    @Arg("deliveryAddress") deliveryAddress: string
  ): Promise<Order> {
    const userId = ctx.user?.id as string;
    if (!deliveryAddress) {
      throw new Error("Delivery address is required");
    }
    const cartItems = await ctx.prisma.orderItemCart.findMany({
      where: { customerId: userId },
      include: { food: true },
    });

    if (cartItems.length === 0) {
      throw new Error("Cart is empty.");
    }

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    await Promise.all(
      cartItems.map(async (item) => {
        await ctx.prisma.food.update({
          where: { id: item.foodId },
          data: { orderCount: { increment: item.quantity } },
        });
      })
    );

    const order = await ctx.prisma.order.create({
      data: {
        deliveryAddress,
        totalPrice,
        customer: { connect: { id: userId } },
        restaurant: {
          connect: {
            id: await this.getRestaurantIdFromFood(cartItems[0].foodId),
          },
        },
        foods: cartItems.map((item) => item),

        status: "PENDING",
      },
    });

    await ctx.prisma.orderItemCart.deleteMany({
      where: { customerId: userId },
    });

    return order;
  }

  @Query(() => [Order])
  async fetchOrders(
    @Ctx() ctx: MyContext,
    @Arg("status", { nullable: true }) status: OrderStatus,
    @Info() info: GraphQLResolveInfo
  ): Promise<Order[]> {
    try {
      const userId = ctx.user?.id as string;
      const findManyOrderResolver = new FindManyOrderResolver();
      const args = new FindManyOrderArgs();
      args.where = {
        OR: [
          { customerId: { equals: userId } },
          { restaurantId: { equals: userId } },
        ],
      };
      if (status) {
        args.where = {
          status: { equals: status },
        };
      }
      args.orderBy = [
        {
          createdAt: "desc",
        },
      ];
      const orders = await findManyOrderResolver.orders(ctx, info, args);
      return orders;
    } catch (error: any) {
      throw new Error("error fetching orders " + error.message);
    }
  }

  @Mutation(() => String || Boolean)
  async cancelOrder(
    @Ctx() ctx: MyContext,
    @Arg("orderId") orderId: number
  ): Promise<string | boolean> {
    try {
      const userId = ctx.user?.id as string;
      const order = await ctx.prisma.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      if (order?.customerId !== userId) {
        throw new Error("You are not authorized to cancel this order");
      }
      if (!order) {
        throw new Error("order not found");
      }
      if (order?.status == "DELIVERED") {
        throw new Error("Order has been already delivered");
      }
      if (order?.status == "CANCELED") {
        throw new Error("Order has been canceled already");
      }
      if (order?.status !== "PENDING") {
        throw new Error("Order is being prepared you cannot cancel it now");
      }
      await ctx.prisma.order.update({
        where: { customerId: userId, id: orderId },
        data: {
          status: "CANCELED",
        },
      });

      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async getRestaurantIdFromFood(foodId: string): Promise<string> {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    return food?.restaurantId ?? "";
  }
}
