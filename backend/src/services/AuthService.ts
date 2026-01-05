import axios from 'axios';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/env';
import crypto from 'crypto';

// Simple encryption for storing OAuth tokens (MVP)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
export class AuthService {
    static async handleLogin() {
        // Mock default user for MVP
        const [user] = await User.findOrCreate({
            where: { github_id: 'guest_id' },
            defaults: {
                github_username: 'guest_user',
                oauth_token_encrypted: 'mock_token'
            }
        });

        // Generate JWT for our app
        const token = jwt.sign(
            { id: user.id, username: user.github_username }, // payload
            process.env.JWT_SECRET || 'fallback_secret', // secret
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    static decryptToken(encryptedToken: string): string {
        return encryptedToken; // No-op for mock
    }

    static verifyToken(token: string) {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    }
}
