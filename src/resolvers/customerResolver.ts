import {
  Arg,
  Ctx,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { isAuth } from "../middleware/middleware";
import { MyContext } from "../types/types";

@Resolver()
@UseMiddleware(isAuth)
export class CustomerResolver {
  @Mutation(() => Boolean || String)
  async addAddress(
    @Arg("address") address: string,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      const customer = await ctx.prisma.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

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
      console.log(error);
      return error.message;
    }
  }
  
}
