import "reflect-metadata";
import { createServer } from "node:http";
import { createYoga} from "graphql-yoga";
import { buildSchema } from "type-graphql";
import { AuthResolver } from "./resolvers/authResolver";
import { resolvers } from "../prisma/generated/type-graphql";
import { RestaurantResolver } from "./resolvers/restaurantResolver";
import { CustomerResolver } from "./resolvers/customerResolver";
import { MyContext } from "./types/types";
import prisma from "../prisma/client";

const main = async () => {
  const schema = await buildSchema({
    resolvers: [
      ...resolvers,
      AuthResolver,
      RestaurantResolver,
      CustomerResolver,
    ],
    validate: false,
  });

  const yoga = createYoga({
    schema,
    context: ({ request }: MyContext) => {
      const token = request.headers.get("auth");
      return { prisma, token };
    },

    maskedErrors: false,
  });

  const server = createServer(yoga);

  server.listen(4000, () => {
    console.info("Server is running on http://localhost:4000/graphql");
  });
};
main();
