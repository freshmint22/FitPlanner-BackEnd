import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Member from "../models/member.model";
import { parseEmailAndRole } from "../utils/emailRole";
import {
  createResetToken,
  resetPasswordWithToken
} from "../services/auth.service";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* ================= REGISTRO ================= */
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email: inputEmail, password } = req.body;

    const parsed = parseEmailAndRole(inputEmail);

    const exists = await Member.findOne({ email: parsed.email });
    if (exists) {
      return res.status(400).json({ ok: false, msg: "Correo ya registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Member.create({
      firstName,
      lastName,
      email: parsed.email,
      password: hashedPassword,
      rol: parsed.rol,
      estado: "activo"
    });

    const token = jwt.sign(
      { id: user._id, rol: user.rol, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ ok: true, token });
  } catch {
    res.status(500).json({ ok: false, msg: "Error al registrar" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req: Request, res: Response) => {
  try {
    const { email: inputEmail, password } = req.body;
    const parsed = parseEmailAndRole(inputEmail);

    const user = await Member.findOne({ email: parsed.email });
    if (!user) {
      return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user._id, rol: user.rol, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ ok: true, token });
  } catch {
    res.status(500).json({ ok: false, msg: "Error al iniciar sesión" });
  }
};

/* ================= RECUPERAR ================= */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const token = await createResetToken(email);

  // ⚠️ Respuesta genérica por seguridad
  if (token) {
    console.log(
      "🔐 Reset link:",
      `http://frontend/reset-password?token=${token}`
    );
  }

  res.json({
    ok: true,
    msg: "Si el correo existe, se enviará un enlace de recuperación"
  });
};

/* ================= RESET ================= */
export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const success = await resetPasswordWithToken(token, password);

  if (!success) {
    return res.status(400).json({
      ok: false,
      msg: "Token inválido o expirado"
    });
  }

  res.json({ ok: true, msg: "Contraseña actualizada correctamente" });
};
