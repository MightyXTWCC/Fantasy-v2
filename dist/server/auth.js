import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './database.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}
export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
export async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        // Check if user exists
        const user = await db.selectFrom('users')
            .selectAll()
            .where('id', '=', decoded.userId)
            .executeTakeFirst();
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
        return;
    }
}
export async function requireAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
