import "reflect-metadata";
import { createServer } from "node:http";
import { createYoga} from "graphql-yoga";
import { buildSchema } from "type-graphql";
import { AuthResolver } from "./resolvers/authResolver";
import { RestaurantResolver } from "./resolvers/restaurantResolver";
import { CustomerResolver } from "./resolvers/customerResolver";
import { MyContext } from "./types/types";
import prisma from "../prisma/client";
import { CartResolver } from "./resolvers/cartResolver";
import { OrderResolver } from "./resolvers/orderResolver";
import { DeliveryResolver } from "./resolvers/deliveryResolver";

const main = async () => {
  const schema = await buildSchema({
    resolvers: [
      AuthResolver,
      RestaurantResolver,
      CustomerResolver,
      CartResolver,
      OrderResolver,
      DeliveryResolver
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
    console.info("Server is running");
  });
};
main();
