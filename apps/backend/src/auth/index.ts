import env from "@/env";

import authDb from "@/db/auth";

import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, openAPI } from "better-auth/plugins";

import { redisSecondaryStorage } from "@/auth/storage";
import { ac, roles } from "@/auth/permissions";
import { sendVerificationEmail, sendResetPasswordEmail } from "@/emails";

export const auth = betterAuth({
  appName: "MateriaQ",
  secrets: [{ version: 1, value: env.AUTH_SECRET }],
  baseURL: env.AUTH_BASE_URL,
  basePath: "/auth",

  database: drizzleAdapter(authDb, {
    provider: "pg",
  }),

  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
  },

  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip"],
    },
  },

  plugins: [
    adminPlugin({
      ac,
      roles,
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    openAPI({
      disableDefaultReference: true,
    }),
  ],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
    sendResetPassword: sendResetPasswordEmail,
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail,
  },

  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },

  secondaryStorage: redisSecondaryStorage,
});
