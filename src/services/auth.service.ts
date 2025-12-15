import crypto from "crypto";
import bcrypt from "bcryptjs";
import Member from "../models/member.model";

export const createResetToken = async (email: string) => {
  const user = await Member.findOne({ email });
  if (!user) return null;

  const token = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await user.save();
  return token;
};

export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
) => {
  const user = await Member.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) return false;

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
  return true;
};
