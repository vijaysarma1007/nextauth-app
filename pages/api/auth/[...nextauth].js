import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "../../../lib/db";
import { verifyPassword } from "../../../lib/auth";

export const authOptions = {
  secret: process.env.CLIENT_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      async authorize(credentials) {
        const client = await connectToDatabase();
        const usersCollection = client.db().collection("users");

        const user = await usersCollection.findOne({ email: credentials.email });

        // console.log(user);

        if (!user) {
          client.close();
          throw new Error("No user found!");
        }

        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          client.close();
          throw new Error("Could not log you in!");
        }

        client.close();

        return {
          email: user.email,
        };
      },
    }),
  ],
};

export default NextAuth(authOptions);
