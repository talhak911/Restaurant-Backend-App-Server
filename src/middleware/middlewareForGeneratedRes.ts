import { MiddlewareFn } from "type-graphql";

export const blockAutoGeneratedResolvers: MiddlewareFn = async () => {
  throw new Error("Access denied.");
};