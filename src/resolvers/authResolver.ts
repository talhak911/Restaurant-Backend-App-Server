import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { generateOTP, isEmailValid } from "../utils/utils";
import prisma from "../../prisma/client";
import { isAuth } from "../middleware/middleware";
import { User, UserCreateInput } from "../../prisma/generated/type-graphql";
import { sendOTPEmail } from "../utils/mailer";
interface JwtPayloadWithId extends JwtPayload {
  id: string;
  role: string;
}
@Resolver()
export class AuthResolver {
  @Mutation(() => User)
  async signUp(@Arg("data") data: UserCreateInput): Promise<User> {
    const { name, email, password, role } = data;
    if (!isEmailValid(email)) {
      throw new Error("Email is not valid");
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    await sendOTPEmail(email, otp, "Verify");
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: role,
        verifitcationOtp: otp,
        verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
      },
    });

    return user;
  }

  @Mutation(() => Boolean)
  async verifyAccount(
    @Arg("email") email: string,
    @Arg("otp") otp: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      user.verifitcationOtp !== otp ||
      user.verificationOtpExpiry! < new Date()
    ) {
      throw new Error("Invalid or expired OTP");
    }
    await prisma.user.update({
      where: { email },
      data: {
        verification: true,
        verifitcationOtp: null,
        verificationOtpExpiry: null,
      },
    });

    return true;
  }

  //TODO make reset password api
  // @Mutation(() => Boolean)
  // async resetPasswordRequest(
  //   @Arg("email") email: string
  //   // @Arg("otp") otp: string,
  //   // @Arg("password") password: string
  // ): Promise<boolean> {
  //   const user = await prisma.user.findUnique({
  //     where: { email },
  //   });

  //   if (!user) {
  //     throw new Error("No user found");
  //   }
  //   const otp = generateOTP();
  //   await sendOTPEmail(email, otp, "Reset");

  //   return true;
  // }
  @Mutation(() => Boolean)

  //reset password
  async resetPassword(
    @Arg("email") email: string,
    @Arg("otp") otp: string,
    @Arg("password") password: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("No user found");
    }
    if (user.resetPassOtp !== otp || user.resetPassOtpExpiry! < new Date()) {
      throw new Error("Invalid or expired OTP");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetPassOtp:null,
        resetPassOtpExpiry:null
      },
    });
    return true;
  }

  @Mutation(() => Boolean)
  async requestOtp(
    @Arg("email") email: string,
    @Arg("type") type: "Verify" | "Reset"
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new Error("User does not exists");
    }
    const otp = generateOTP();
    await sendOTPEmail(email, otp, type);
    if (type === "Verify") {
      await prisma.user.update({
        where: { email },
        data: {
          verifitcationOtp: otp,
          verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    } else {
      await prisma.user.update({
        where: { email },
        data: {
          resetPassOtp: otp,
          resetPassOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    }

    return true;
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  async getCurrentUser(@Ctx() context: any): Promise<User | null> {
    try {
      console.log("Xontent is ", context.token);
      const payload = jwt.verify(context.token, process.env.JWT_SECRET!);
      const userPayload = payload as JwtPayloadWithId;
      console.log("Payload ID is", userPayload.id);
      const user = await prisma.user.findUnique({
        where: { id: userPayload.id },
      });
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  @Query(() => String)
  async signIn(
    @Arg("email") email: string,
    @Arg("password") password: string
  ): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error("User not found");
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Incorrect password");
    if (!user.verification) {
      throw new Error("Verify your account");
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    return token;
  }
}
