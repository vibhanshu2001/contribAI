import express from 'express';
import { AuthService } from '../services/AuthService';
import { config } from '../config/env';

const router = express.Router();

// GET /api/auth/login -> Redirect to GitHub
router.get('/login', (req, res) => {
    const redirectUri = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${config.github.callbackUrl}&scope=repo,user:email`;
    res.redirect(redirectUri);
});

// GET /api/auth/callback -> Handle code exchange
router.get('/callback', async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
        res.status(400).json({ error: 'Missing code' });
        return;
    }

    try {
        const { token, user } = await AuthService.handleLogin(code);
        // Redirect to frontend with token (simple approach for MVP)
        // In production, might use cookies or a fast intermediate page
        res.redirect(`http://localhost:3000/dashboard?token=${token}`);
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

export const authRoutes = router;
