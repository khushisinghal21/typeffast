import { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// NOTE: This file is imported by middleware which runs in the Edge Runtime.
// Do NOT import bcryptjs or any Node.js-only modules here.
// Credentials provider (with bcrypt) is added in auth.ts (Node.js runtime only).

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
} satisfies NextAuthConfig;
