import { PrismaClient } from "@prisma/client";
import { YogaInitialContext } from "graphql-yoga";

export type MyContext = {
  prisma: PrismaClient;
  token?: string;
  user?: {
    id: string;
    role: string;
  };
} & YogaInitialContext;
