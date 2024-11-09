import crypto from "crypto";
import { OrderStatus } from "../../prisma/generated/type-graphql";

export const isEmailValid = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const getStatus: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Order is Active",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
  ASSIGNED: "Assigned to a delivery person",
  OUT_FOR_DELIVERY: "Out for Delivery",
};