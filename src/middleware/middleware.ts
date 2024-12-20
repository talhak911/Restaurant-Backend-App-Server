import { MiddlewareFn } from "type-graphql";
import jwt from "jsonwebtoken";
import { MyContext } from "../types/types";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const token = context?.token;
  if (!token) {
    throw new Error("Authorization header is  missing");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof payload === "string") {
      throw new Error("Invalid token payload");
    }
    context.user = payload as { id: string; role: string };
  } catch (err:any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error("TokenExpired");
    }
    throw new Error("Authorization failed");
  }

  return next();
};
