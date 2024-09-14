import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "../types/types";
import prisma from "../../prisma/client";
import {
  CreateOneOrderItemCartArgs,
  CreateOneOrderItemCartResolver,
  OrderItemCart,
} from "../../prisma/generated/type-graphql";
import { GraphQLResolveInfo } from "graphql/type";
import { isAuth } from "../middleware/middleware";

@Resolver()
@UseMiddleware(isAuth)
export class CartResolver {
  @Mutation(() => Boolean)
  async addToCart(
    @Ctx() ctx: MyContext,
    @Arg("foodId") foodId: string,
    @Info() info: GraphQLResolveInfo,
    @Arg("quantity") quantity: number
  ): Promise<boolean> {
    if(ctx.user?.role==="RESTAURANT"){
      throw new Error("make customer account to place order")
    }
    const customerId = ctx?.user?.id as string;
    await prisma.food.findUniqueOrThrow({where:{id:foodId}})
    const orderItem = await prisma.orderItemCart.findFirst({
      where: { customerId, foodId },
    });

    if (orderItem) {
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
      const createOneOrderItemCartResolver =
        new CreateOneOrderItemCartResolver();
      const args = new CreateOneOrderItemCartArgs();
      args.data = {
        food: { connect: { id: foodId } },
        quantity,
        customer: { connect: { id: customerId } },
        totalPrice: await this.calculatePrice(foodId, quantity),
      };
      await createOneOrderItemCartResolver.createOneOrderItemCart(
        ctx,
        info,
        args
      );
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
  @Query(() => [OrderItemCart])
  async fetchCart(@Ctx() ctx: MyContext): Promise<OrderItemCart[]> {
    const customerId = ctx?.user?.id as string;

    const cart = await prisma.orderItemCart.findMany({
      where: { customerId },
    });

    if (!cart) {
      return [];
    }

    return cart;
  }

  private async calculatePrice(
    foodId: string,
    quantity: number
  ): Promise<number> {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    return food ? food.price * quantity : 0;
  }
}
