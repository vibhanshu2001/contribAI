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
    static async getGitHubAccessToken(code: string): Promise<string> {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: config.github.clientId,
            client_secret: config.github.clientSecret,
            code,
        }, {
            headers: { Accept: 'application/json' }
        });

        if (response.data.error) {
            throw new Error(response.data.error_description || 'Failed to exchange code');
        }
        return response.data.access_token;
    }

    static async getGitHubUser(accessToken: string): Promise<any> {
        const response = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }

    static async handleLogin(code: string) {
        const accessToken = await this.getGitHubAccessToken(code);
        const ghUser = await this.getGitHubUser(accessToken);

        const [user, created] = await User.findOrCreate({
            where: { github_id: String(ghUser.id) },
            defaults: {
                github_username: ghUser.login,
                oauth_token_encrypted: encrypt(accessToken)
            }
        });

        if (!created) {
            // Update token if user exists
            user.github_username = ghUser.login;
            user.oauth_token_encrypted = encrypt(accessToken);
            await user.save();
        }

        // Generate JWT for our app
        const token = jwt.sign(
            { id: user.id, username: user.github_username }, // payload
            process.env.JWT_SECRET || 'fallback_secret', // secret
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    static decryptToken(encryptedToken: string): string {
        return decrypt(encryptedToken);
    }

    static verifyToken(token: string) {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    }
}
