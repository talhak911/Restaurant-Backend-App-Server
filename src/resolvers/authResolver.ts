import {
  Arg,
  Ctx,
  Info,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOTP, isEmailValid } from "../utils/utils";
import { isAuth } from "../middleware/middleware";
import {
  CreateOneCustomerArgs,
  CreateOneCustomerResolver,
  CreateOneRestaurantArgs,
  CreateOneRestaurantResolver,
  FindUniqueUserArgs,
  FindUniqueUserResolver,
  User,
  UserCreateInput,
} from "../../prisma/generated/type-graphql";
import { sendOTPEmail } from "../utils/mailer";
import { GraphQLResolveInfo } from "graphql/type";
import { MyContext } from "../types/types";
import { SignInResponse } from "../gql/schema";

@Resolver()
export class AuthResolver {
  @Mutation(() => User)
  async signUp(
    @Ctx() ctx: MyContext,
    @Info() info: GraphQLResolveInfo,
    @Arg("data") data: UserCreateInput
  ): Promise<User> {
    try {
      const { name, email, password, role, dateOfBirth, phone } = data;
      if (!isEmailValid(email)) {
        throw new Error("Email is not valid");
      }
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new Error("User already exists");
      }
      if (new Date(dateOfBirth).getTime() > new Date().getTime()) {
        throw new Error("Date of birth should not be in the future");
      }
      if (password.length < 8) {
        throw new Error("Password should be minimum 8 characters long");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOTP();
      await sendOTPEmail(email, otp, "Verify");
      const user = await ctx.prisma.user.create({
        data: {
          dateOfBirth,
          phone,
          name: name,
          email: email,
          password: hashedPassword,
          role: role,
          verificationOtp: otp,
          verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      if (role === "CUSTOMER") {
        const createCustomerResolver = new CreateOneCustomerResolver();
        const customerArgs = new CreateOneCustomerArgs();
        customerArgs.data = {
          user: { connect: { id: user.id } },
        };
        await createCustomerResolver.createOneCustomer(ctx, info, customerArgs);
      } else if (role === "RESTAURANT") {
        const createRestaurantResolver = new CreateOneRestaurantResolver();
        const restaurantArgs = new CreateOneRestaurantArgs();
        restaurantArgs.data = {
          user: { connect: { id: user.id } },
        };

        await createRestaurantResolver.createOneRestaurant(
          ctx,
          info,
          restaurantArgs
        );
      }
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  @Mutation(() => Boolean)
  async verifyAccount(
    @Ctx() ctx: MyContext,
    @Arg("email") email: string,
    @Arg("otp") otp: string
  ): Promise<boolean> {
    const user = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      user.verificationOtp !== otp ||
      user.verificationOtpExpiry! < new Date()
    ) {
      throw new Error("Invalid or expired OTP");
    }
    await ctx.prisma.user.update({
      where: { email },
      data: {
        verification: true,
        verificationOtp: null,
        verificationOtpExpiry: null,
      },
    });

    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Ctx() ctx: MyContext,
    @Arg("email") email: string,
    @Arg("otp") otp: string,
    @Arg("password") password: string
  ): Promise<boolean> {
    const user = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("No user found");
    }
    if (user.resetPassOtp !== otp || user.resetPassOtpExpiry! < new Date()) {
      throw new Error("Invalid or expired OTP");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await ctx.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetPassOtp: null,
        resetPassOtpExpiry: null,
      },
    });
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async changePassword(
    @Ctx() ctx: MyContext,
    @Arg("password") password: string,
    @Arg("newPassword") newPassword: string
  ): Promise<boolean> {
    const userPayload = ctx?.user;
    const user = await ctx.prisma.user.findUnique({
      where: { id: userPayload?.id },
    });
    if (!user) {
      throw new Error("No user found");
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Incorrect old password");
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await ctx.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    return true;
  }

  @Mutation(() => Boolean)
  async requestOtp(
    @Ctx() ctx: MyContext,
    @Arg("email") email: string,
    @Arg("type") type: "Verify" | "Reset"
  ): Promise<boolean> {
    const user = await ctx.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new Error("User does not exists");
    }
    const otp = generateOTP();
    await sendOTPEmail(email, otp, type);
    if (type === "Verify") {
      await ctx.prisma.user.update({
        where: { email },
        data: {
          verificationOtp: otp,
          verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    } else {
      await ctx.prisma.user.update({
        where: { email },
        data: {
          resetPassOtp: otp,
          resetPassOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    }

    return true;
  }

  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuth)
  async getCurrentUser(
    @Ctx() ctx: MyContext,
    @Info() info: GraphQLResolveInfo
  ): Promise<User | null> {
    try {
      const userPayload = ctx?.user;
      const findUniqueUserResolver = new FindUniqueUserResolver();
      const args = new FindUniqueUserArgs();
      args.where = { id: userPayload?.id };
      const user = await findUniqueUserResolver.user(ctx, info, args);
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  @Mutation(() => SignInResponse)
  async signIn(
    @Ctx() ctx: MyContext,
    @Arg("email") email: string,
    @Arg("password") password: string
  ): Promise<SignInResponse> {
    const user = await ctx.prisma.user.findUnique({
      where: { email },
      include: { customer: true, restaurant: true },
    });
    if (!user) throw new Error("User not found");
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Incorrect password");
    if (!user.verification) {
      throw new Error("Verify your account");
    }
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => String)
  async refreshToken(
    @Ctx() ctx: MyContext,
    @Arg("refreshToken") refreshToken: string
  ): Promise<string> {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
      if (typeof payload === "string") {
        throw new Error("Invalid refresh token payload");
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const newAccessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
      );

      return newAccessToken;
    } catch (error: any) {
      throw new Error("Refresh token is invalid or expired");
    }
  }
}
