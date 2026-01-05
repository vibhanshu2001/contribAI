import express from 'express';
import { AuthService } from '../services/AuthService';
import { config } from '../config/env';

const router = express.Router();

// GET /api/auth/login -> Bypassing GitHub
router.get('/login', (req, res) => {
    res.redirect('/api/auth/callback');
});

// GET /api/auth/callback -> Handle mock login
router.get('/callback', async (req, res) => {
    try {
        const { token } = await AuthService.handleLogin();
        // Redirect to frontend with token
        res.redirect(`http://localhost:3000/dashboard?token=${token}`);
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

export const authRoutes = router;
