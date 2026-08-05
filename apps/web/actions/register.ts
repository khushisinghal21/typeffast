"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/db/user";
import { signUpSchema, SignUpValues } from "../common/src/schemas";
import prisma from "../DB_prisma/src/index";

export const register = async (values: SignUpValues) => {
  const validation = signUpSchema.safeParse(values);

  if (!validation.success) {
    return { success: false, message: "Invalid Credentials" };
  }

  const { name, email, password } = validation.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { success: false, message: "User already exists" };
  }

  // Local dev: auto-verify on signup (skip email confirmation)
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  return { success: true, message: "Account created! You can now sign in." };
};
