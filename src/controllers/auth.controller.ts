import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Member from '../models/member.model';
import { sendResetEmail } from '../utils/mailer';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Normalize email input consistently across register/login/forgot-password
function normalizeEmail(input?: string): string {
  const raw = (input || '').toString();
  return raw.toLowerCase().trim().normalize('NFKC');
}

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const emailRaw = (email || '').toString();
    const emailLower = emailRaw.toLowerCase().trim();
    const normalizedEmail = normalizeEmail(email);

    // Validate required fields / Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'validation_error', message: 'Email and password are required' }
      });
    }

    // Verificar si el email ya existe (usar la misma normalización que al guardar)
    const existingMember = await Member.findOne({ email: normalizedEmail });
    if (existingMember) {
      return res.status(409).json({
        error: { code: 'email_exists', message: 'Email already registered' }
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role based on provided selection. Default to 'user'.
    let userRole = role === 'ADMIN' ? 'admin' : 'user';

    // Crear el miembro
        const newMember = await Member.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      rol: userRole,
      estado: 'activo'
        });

    // Generar token
    const token = jwt.sign(
      { id: newMember._id, email: newMember.email, rol: newMember.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      ok: true,
      accessToken: token,
      token,
      user: {
        id: newMember._id,
        name: `${newMember.firstName || ''} ${newMember.lastName || ''}`.trim() || newMember.email,
        email: newMember.email,
        role: newMember.rol === 'admin' ? 'ADMIN' : 'USER'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      error: { code: 'server_error', message: 'Error creating account' }
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'validation_error', message: 'Email and password are required' }
      });
    }

    // Buscar usuario
    const member = await Member.findOne({ email: normalizeEmail(email) });
    if (!member) {
      return res.status(401).json({
        error: { code: 'invalid_credentials', message: 'Invalid email or password' }
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: { code: 'invalid_credentials', message: 'Invalid email or password' }
      });
    }

    // Generar token
    const token = jwt.sign(
      { id: member._id, email: member.email, rol: member.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      ok: true,
      accessToken: token,
      token,
      user: {
        id: member._id,
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
        email: member.email,
        role: member.rol === 'admin' ? 'ADMIN' : 'USER'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: { code: 'server_error', message: 'Error logging in' }
    });
  }
};

export const getProfile = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const member = await Member.findById(req.user.id).select('-password');
    if (!member) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'User not found' }
      });
    }

    return res.status(200).json({
      id: member._id,
      name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
      email: member.email,
      role: member.rol === 'admin' ? 'ADMIN' : 'USER',
      phone: member.phone,
      birthDate: member.birthDate,
      gender: member.gender,
      profileImage: member.profileImage
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({
      error: { code: 'server_error', message: 'Error fetching profile' }
    });
  }
};
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: 'Email required' });

    const user = await Member.findOne({ email: normalizeEmail(email) });

    // Always respond OK to avoid leaking which emails exist
    if (!user) return res.status(200).json({ ok: true });

    const token = crypto.randomBytes(20).toString('hex');
    (user as any).resetPasswordToken = token;
    (user as any).resetPasswordExpires = new Date(Date.now() + 3600 * 1000); // 1 hour
    await user.save();
    // Send a reset email with the token (best-effort)
    try {
      const to = user.email as string;
      await sendResetEmail(to, token);
    } catch (mailErr) {
      console.warn('Could not send reset email:', mailErr);
      // swallow — still return ok to the client to avoid leaking
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ ok: false });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ ok: false });

    const user = await Member.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ ok: false });

    (user as any).password = await bcrypt.hash(password, 10);
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined as any;
    await user.save();

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ ok: false });
  }
};
