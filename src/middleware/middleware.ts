import { MiddlewareFn } from "type-graphql";
import jwt from "jsonwebtoken";

export const isAuth: MiddlewareFn<any> = async ({ context }, next) => {
  const token = context?.token;
  if (!token) {
    throw new Error("Authorization header is  missing");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    context.user = payload;
  } catch (err) {
    throw new Error("Authorization failed");
  }

  return next();
};
