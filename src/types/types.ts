import { FoodCategory, PrismaClient } from "@prisma/client";
import { YogaInitialContext } from "graphql-yoga";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class CustomerAddress {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  address!: string;
}

export type MyContext = {
  prisma: PrismaClient;
  token?: string;
  user?: {
    id: string;
    role: string;
  };
} & YogaInitialContext;

export type CustomerAddressType = { id: string; name: string; address: string };
export type FetchFoodsFilters = {
  category?: FoodCategory;
  name?: { contains: string; mode: "insensitive" };
};
