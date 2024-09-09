import crypto from "crypto";

export const isEmailValid = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateOTP = (length = 6) => {
  return crypto.randomInt(100000, 999999).toString();
};
