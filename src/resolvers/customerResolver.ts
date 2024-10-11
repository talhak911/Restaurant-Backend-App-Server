import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { v4 as uuidv4 } from "uuid";
import { isAuth } from "../middleware/middleware";
import {
  CustomerAddress,
  CustomerAddressType,
  MyContext,
} from "../types/types";
import {
  UpdateOneUserArgs,
  UpdateOneUserResolver,
} from "../../prisma/generated/type-graphql";
import { GraphQLResolveInfo } from "graphql/type";

@Resolver()
@UseMiddleware(isAuth)
export class CustomerResolver {
  @Query(() => [CustomerAddress])
  async getCustomerAddress(@Ctx() ctx: MyContext): Promise<CustomerAddress[]> {
    try {
      const userId = ctx?.user?.id;
      const customer = await ctx.prisma.customer.findUniqueOrThrow({
        where: { id: userId },
        select: { address: true },
      });

      return customer.address as CustomerAddressType[];
    } catch (error: any) {
      throw new Error("Error while adding address: " + error.message);
    }
  }
  @Mutation(() => [CustomerAddress])
  async addCustomerAddress(
    @Arg("name") name: string,
    @Arg("address") address: string,
    @Ctx() ctx: MyContext
  ): Promise<CustomerAddress[]> {
    try {
      const userId = ctx?.user?.id;
      const newAddress = {
        id: uuidv4(),
        name,
        address,
      };

     const updatedCustomer = await ctx.prisma.customer.update({
        where: { id: userId },
        data: {
          address: {
            push: newAddress,
          },
        },
      });

      return updatedCustomer.address as CustomerAddressType[];
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new Error("Customer not found");
      }
      throw new Error("Error while adding address: " + error.message);
    }
  }

  @Mutation(() => Boolean || String)
  async deleteCustomerAddress(
    @Arg("addressId") addressId: string,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      const customer = await ctx.prisma.customer.findUniqueOrThrow({
        where: { id: userId },
      });

      const addresses = customer.address as Array<CustomerAddressType>;

      const addressExists = addresses.some((addr) => addr.id === addressId);
      if (!addressExists) {
        throw new Error("Address not found");
      }
      const updatedAddresses = addresses.filter(
        (addr) => addr.id !== addressId
      );
      await ctx.prisma.customer.update({
        where: { id: userId },
        data: {
          address: {
            set: updatedAddresses,
          },
        },
      });

      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  @Mutation(() => Boolean || String)
  async updateCustomer(
    @Arg("name", { nullable: true }) name: string,
    @Arg("phone", { nullable: true }) phone: string,
    @Info() info: GraphQLResolveInfo,
    @Ctx() ctx: MyContext
  ): Promise<boolean | string> {
    try {
      const userId = ctx?.user?.id;
      await ctx.prisma.customer.findUniqueOrThrow({
        where: { id: userId },
      });
      const updateOneUserResolver = new UpdateOneUserResolver();
      const args = new UpdateOneUserArgs();
      args.where = { id: userId };
      args.data = {};

      if (name) {
        args.data.name = { set: name };
      }

      if (phone) {
        args.data.phone = { set: phone };
      }

      await updateOneUserResolver.updateOneUser(ctx, info, args);
      return true;
    } catch (error: any) {
      throw new Error("Error while updating customer " + error.message);
    }
  }
}
