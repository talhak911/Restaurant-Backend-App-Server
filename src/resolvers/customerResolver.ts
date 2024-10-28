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
  User,
} from "../../prisma/generated/type-graphql";
import { GraphQLResolveInfo } from "graphql/type";
import { ReviewsParam } from "../gql/schema";

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
      throw new Error(error.message);
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
      throw new Error(error.message);
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

  @Mutation(() => Boolean)
  async addReview(
    @Arg("orderId") orderId: number,
    @Arg("reviews", () => [ReviewsParam]) reviews: ReviewsParam[],
    @Ctx() ctx: MyContext
  ): Promise<boolean> {
    const userId = ctx.user?.id;

    const order = await ctx.prisma.order.findUniqueOrThrow({
      where: { id: orderId, customerId: userId },
      select: { isReviewed: true },
    });

    if (order.isReviewed) {
      throw new Error("You have already given a review for this order");
    }

    await Promise.all(
      reviews.map(async (item) => {
        const food = await ctx.prisma.food.findUniqueOrThrow({
          where: { id: item.foodId },
        });

        const clampedRating = Math.max(1, Math.min(item.rating, 5));
        const newTotalCount = food.totalRatingsCount + 1;
        const newAverageRating = parseFloat(
          (
            (food.averageRating * food.totalRatingsCount + clampedRating) /
            newTotalCount
          ).toFixed(1)
        );
        await ctx.prisma.review.create({
          data: {
            rating: clampedRating,
            comment: item.comment,
            food: { connect: { id: item.foodId } },
            customer: { connect: { id: userId } },
          },
        });

        await ctx.prisma.food.update({
          where: { id: item.foodId },
          data: {
            averageRating: newAverageRating,
            totalRatingsCount: newTotalCount,
          },
        });
      })
    );

    await ctx.prisma.order.update({
      where: { id: orderId },
      data: { isReviewed: true },
    });
    return true;
  }

  @Mutation(() => User)
  async updateCustomer(
    @Arg("name", { nullable: true }) name: string,
    @Arg("phone", { nullable: true }) phone: string,
    @Arg("dateOfBirth", { nullable: true }) dateOfBirth: Date,
    @Arg("picture", { nullable: true }) picture: string,
    @Info() info: GraphQLResolveInfo,
    @Ctx() ctx: MyContext
  ): Promise<User | null> {
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
      if (dateOfBirth) {
        args.data.dateOfBirth = { set: dateOfBirth };
      }
      if (phone) {
        args.data.phone = { set: phone };
      }
      if (picture) {
        args.data.customer = {
          update: { data: { picture: { set: picture } } },
        };
      }

      const user = await updateOneUserResolver.updateOneUser(ctx, info, args);
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
