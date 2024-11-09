import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { MyContext } from "../types/types";
import { Order, OrderStatus } from "../../prisma/generated/type-graphql";
import { isAuth } from "../middleware/middleware";
import { sendOrderStatusNotification } from "../utils/notifications";

@Resolver()
@UseMiddleware(isAuth)
export class DeliveryResolver {
  @Mutation(() => Order)
  async assignDeliveryPerson(
    @Ctx() ctx: MyContext,
    @Arg("orderId") orderId: number,
    @Arg("deliveryPerson") deliveryPerson: string
  ): Promise<Order> {
    try {
      const userId = ctx.user?.id as string;
      await ctx.prisma.order.findUniqueOrThrow({
        where: { id: orderId, restaurantId: userId },
      });
      const order = await ctx.prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryPerson,
          status: "ASSIGNED",
        },
      });

      return order;
    } catch (error: any) {
      throw new Error("error in assign delivery person " + error.message);
    }
  }

  @Mutation(() => Order)
  async updateDeliveryStatus(
    @Ctx() ctx: MyContext,
    @Arg("orderId") orderId: number,
    @Arg("status") status: OrderStatus,
    @Arg("deliveryTime", { nullable: true }) deliveryTime?: Date
  ): Promise<Order> {
    const userId = ctx.user?.id as string;
    await ctx.prisma.order.findUniqueOrThrow({
      where: { id: orderId, restaurantId: userId },
    });
    const order = await ctx.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        deliveryTime:
          status === "DELIVERED" ? deliveryTime || new Date() : null,
      },
      include: { customer: true },
    });
    if (order.customer.wantsOrderNotifications) {
      sendOrderStatusNotification({ status, userId: order.customerId });
    }
    return order;
  }
}
