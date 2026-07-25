import { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { logActivity } from "@/lib/logger";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (user.role === 'BLOCKED') {
          throw new Error("Your account has been temporarily blocked.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
    CredentialsProvider({
      id: "impersonate",
      name: "Impersonate",
      credentials: {
        userId: { label: "User ID", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.userId) throw new Error("Missing userId");

        const cookieStore = cookies();
        const sessionToken = cookieStore.get('next-auth.session-token')?.value || cookieStore.get('__Secure-next-auth.session-token')?.value;
        
        if (!sessionToken) throw new Error("No session");

        const decoded = await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET! });
        
        if (decoded?.role !== 'ADMIN') {
          throw new Error("Unauthorized to impersonate");
        }

        const user = await prisma.user.findUnique({
          where: { id: credentials.userId }
        });

        if (!user) throw new Error("User not found");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  events: {
    async signIn(message) {
      if (message.user) {
        await logActivity({
          userId: message.user.id,
          action: 'LOGIN',
          module: 'AUTH',
          details: `User ${message.user.email} logged in`
        });
      }
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
