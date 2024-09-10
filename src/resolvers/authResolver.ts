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
import jwt, { JwtPayload } from "jsonwebtoken";
import { generateOTP, isEmailValid } from "../utils/utils";
import prisma from "../../prisma/client";
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
interface JwtPayloadWithId extends JwtPayload {
  id: string;
  role: string;
}
@Resolver()
export class AuthResolver {
  @Mutation(() => User)
  async signUp(
    @Ctx() ctx: any,
    @Info() info: GraphQLResolveInfo,
    @Arg("data") data: UserCreateInput
  ): Promise<User> {
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
        verificationOtp: otp,
        verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    // Depending on the user's role, create a Customer or Restaurant
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
        location: "Default location",
        name,
        operatingHours:"",
        user: { connect: { id: user.id } },
      };
      await createRestaurantResolver.createOneRestaurant(
        ctx,
        info,
        restaurantArgs
      );
    }
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
      user.verificationOtp !== otp ||
      user.verificationOtpExpiry! < new Date()
    ) {
      throw new Error("Invalid or expired OTP");
    }
    await prisma.user.update({
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
        resetPassOtp: null,
        resetPassOtpExpiry: null,
      },
    });
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async changePassword(
    @Ctx() context: any,
    @Arg("password") password: string,
    @Arg("newPassword") newPassword: string
  ): Promise<boolean> {
    const userPayload = context.payload;
    const user = await prisma.user.findUnique({
      where: { id: userPayload.id },
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
    await prisma.user.update({
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
          verificationOtp: otp,
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

  // @Query(() => User)
  // @UseMiddleware(isAuth)
  // async getCurrentUser(@Ctx() context: any): Promise<User | null> {
  //   try {
  //     const userPayload = context.payload;
  //     const user = await prisma.user.findUnique({
  //       where: { id: userPayload.id },
  //     });
  //     return user;
  //   } catch (error: any) {
  //     throw new Error(error.message);
  //   }
  // }

  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuth)
  async getCurrentUser(
    @Ctx() context: any,
    @Info() info: GraphQLResolveInfo
  ): Promise<User | null> {
    try {
      const userPayload = context.payload;
      const findUniqueUserResolver = new FindUniqueUserResolver();
      const args = new FindUniqueUserArgs();
      args.where = { id: userPayload.id };
      const user = await findUniqueUserResolver.user(context, info, args);
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
