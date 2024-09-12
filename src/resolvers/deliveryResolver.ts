import {
  Arg,
  Ctx,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "../types/types";
import {
  Order,
  OrderStatus,
} from "../../prisma/generated/type-graphql";

import { isAuth } from "../middleware/middleware";

@Resolver()
@UseMiddleware(isAuth)
export class DeliveryResolver {
  @Mutation(() => Order)
  async assignDeliveryPerson(
    @Ctx() ctx: MyContext,
    @Arg("orderId") orderId: number,
    @Arg("deliveryPerson") deliveryPerson: string
  ): Promise<Order> {
    const order = await ctx.prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPerson,
        status: "ASSIGNED",
      },
    });

    return order;
  }

  @Mutation(() => Order)
  async updateDeliveryStatus(
    @Ctx() ctx: MyContext,
    @Arg("orderId") orderId: number,
    @Arg("status") status: OrderStatus,
    @Arg("deliveryTime", { nullable: true }) deliveryTime?: Date
  ): Promise<Order> {
    const order = await ctx.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        deliveryTime:
          status === "DELIVERED" ? deliveryTime || new Date() : null,
      },
    });

    return order;
  }
}
