import "reflect-metadata";
import { createServer } from "node:http";
import {  createYoga } from "graphql-yoga";

import { buildSchema } from "type-graphql";
import { PrismaClient } from "@prisma/client";
import { AuthResolver } from "./resolvers/authResolver";
import { resolvers } from "../prisma/generated/type-graphql";

const main = async () => {
  const schema = await buildSchema({
    resolvers: [...resolvers, AuthResolver],
    validate: false,
  });

  const prisma = new PrismaClient();
  const yoga = createYoga({
    schema,
    context: ({ request }) => {
      const token = request.headers.get("auth");
      return { prisma, token };
    },

    maskedErrors:false
  });

  const server = createServer(yoga);

  server.listen(4000, () => {
    console.info("Server is running on http://localhost:4000/graphql");
  });
};
main();
