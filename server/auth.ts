import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, StoredUser } from './store.js';
import { UserProfile } from '../src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lumen_ai_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: UserProfile): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): UserProfile | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserProfile;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid token. Please sign in again.' });
  }

  // Ensure user still exists in database
  const existingUser = db.getUser(decoded.id);
  if (!existingUser) {
    return res.status(401).json({ error: 'Unauthorized: User account no longer exists.' });
  }

  req.user = {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    avatar: existingUser.avatar,
    provider: existingUser.provider,
    createdAt: existingUser.createdAt
  };

  next();
}
