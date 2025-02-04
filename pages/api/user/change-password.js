import { getServerSession } from "next-auth/next";
import { connectToDatabase } from "../../../lib/db";
import { hashPassword, verifyPassword } from "../../../lib/auth";
import { authOptions } from "../auth/[...nextauth]";
async function handler(req, res) {
  if (req.method !== "PATCH") return;

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({
      message: "not authencticated",
    });
    return;
  }

  const userEmail = session.user.email;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  const client = await connectToDatabase();

  const usersCollection = client.db().collection("users");

  const user = await usersCollection.findOne({ email: userEmail });

  if (!user) {
    res.status(404).json({ message: "User not found!" });
    client.close();
    return;
  }

  const currentPassword = user.password;
  const isVerified = await verifyPassword(oldPassword, currentPassword);

  if (!isVerified) {
    res.status(403).json({ message: "Invalid Password!" });
    client.close();
    return;
  }

  const hashedPassword = await hashPassword(newPassword);

  const result = await usersCollection.updateOne({ email: userEmail }, { $set: { password: hashedPassword } });

  client.close();

  res.status(200).json({ message: "password updated" });
}

export default handler;
