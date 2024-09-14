import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";

import { isAuth } from "../middleware/middleware";
import { MyContext } from "../types/types";

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
        where: { userId },
      });

      await ctx.prisma.customer.update({
        where: { userId },
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
}
