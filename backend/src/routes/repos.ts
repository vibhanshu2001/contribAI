import express from 'express';
import { Repository, ScanJob, Signal } from '../models';
import { QueueService } from '../services/QueueService';
import { AuthService } from '../services/AuthService';
import { ProgressTracker } from '../services/ProgressTracker';
// Middleware to check auth would be here. For MVP assume valid token passed in header or session logic.
// We'll decode JWT here or assume req.user is set by authentication middleware.
// For MVP, l'll add a simple verify middleware inline or separately.

const router = express.Router();

// Auth Middleware
const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    try {
        const token = authHeader.split(' ')[1];
        const decoded: any = AuthService.verifyToken(token); // Use AuthService helper
        req.user = decoded;
        next();
    } catch (e) {
        console.error('Auth Verify Error', e);
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.get('/', async (req, res) => {
    const repos = await Repository.findAll({ order: [['updated_at', 'DESC']] });
    res.json(repos);
});

// Helper to get token for metadata fetch
async function getGithubToken(req: any) {
    // For MVP, we use the mocked user ID 1. In prod, use req.user.id from JWT
    const userId = req.user?.id || 1;
    const user = await import('../models').then(m => m.User.findByPk(userId));
    if (!user) return null;
    return AuthService.decryptToken(user.oauth_token_encrypted);
}

router.post('/', requireAuth, async (req: any, res) => {
    const { owner, name } = req.body;
    try {
        // 1. Check if already exists locally
        const existing = await Repository.findOne({ where: { owner, name } });
        if (existing) return res.json(existing);

        // 2. Fetch metadata from GitHub
        const token = await getGithubToken(req);
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const ghRes = await import('axios').then(a => a.default.get(`https://api.github.com/repos/${owner}/${name}`, { headers }));
        const { stargazers_count, language, default_branch } = ghRes.data;

        // 3. Create Repo with metadata
        const repo = await Repository.create({
            owner,
            name,
            stars: stargazers_count,
            language: language || 'Unknown'
        });
        res.json(repo);
    } catch (e: any) {
        console.error('Add Repo Error', e.message);
        res.status(400).json({ error: 'Repository not found on GitHub or invalid' });
    }
});

router.get('/:id', async (req, res) => {
    const repo = await Repository.findByPk(req.params.id, {
        include: [ScanJob]
    });
    if (!repo) return res.status(404).json({ error: 'Not found' });
    res.json(repo);
});

router.post('/:id/scan', requireAuth, async (req: any, res) => {
    const repoId = parseInt(req.params.id);
    const userId = req.user.id;

    await QueueService.addScanJob(repoId, userId);
    res.json({ message: 'Scan queued' });
});

router.get('/:id/signals', async (req, res) => {
    const signals = await import('../models').then(m => m.Signal.findAll({
        where: { repository_id: req.params.id },
        order: [['createdAt', 'DESC']],
        limit: 100 // Cap for now
    }));
    res.json(signals);
});

// DELETE /api/repos/:id
router.delete('/:id', requireAuth, async (req: any, res) => {
    try {
        const repo = await Repository.findByPk(req.params.id);
        if (!repo) return res.status(404).json({ error: 'Repo not found' });

        // Destroy repo (Cascade should handle related ScanJobs/Signals if configured, otherwise we might leave orphans. 
        // For MVP, Sequelize cascade is usually off by default unless associations configured with hooks: true or onUpdate/onDelete constraints.
        // Let's assume database level foreign keys handle it or we just delete repo.)
        await repo.destroy();
        res.json({ message: 'Repository deleted' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get scan progress
router.get('/:id/scan-progress', requireAuth, async (req: any, res) => {
    try {
        const repoId = parseInt(req.params.id);
        const repo = await Repository.findByPk(repoId);
        if (!repo) return res.status(404).json({ error: 'Repository not found' });

        // Find the most recent active or completed scan
        const scanJob = await ScanJob.findOne({
            where: { repository_id: repoId },
            order: [['id', 'DESC']]
        });

        if (!scanJob) {
            return res.json({ progress: null });
        }

        const progress = await ProgressTracker.getProgress(scanJob.id);

        res.json({
            scanJobId: scanJob.id,
            status: scanJob.status,
            progress,
            signalsFound: scanJob.signals_found
        });
    } catch (error) {
        console.error('Error getting scan progress:', error);
        res.status(500).json({ error: 'Failed to get scan progress' });
    }
});

// Resume scan
router.post('/:id/resume-scan', requireAuth, async (req: any, res) => {
    try {
        const repoId = parseInt(req.params.id);
        const userId = req.user?.id || 1;

        const repo = await Repository.findByPk(repoId);
        if (!repo) return res.status(404).json({ error: 'Repository not found' });

        if (!repo.scan_cursor) {
            return res.status(400).json({ error: 'No scan to resume' });
        }

        const scanJob = await QueueService.triggerScan(repoId, userId, true); // resume = true
        res.json(scanJob);
    } catch (error) {
        console.error('Error resuming scan:', error);
        res.status(500).json({ error: 'Failed to resume scan' });
    }
});

// Cancel scan
router.post('/:id/cancel-scan', requireAuth, async (req: any, res) => {
    try {
        const repoId = parseInt(req.params.id);

        const repo = await Repository.findByPk(repoId);
        if (!repo) return res.status(404).json({ error: 'Repository not found' });

        // Find active scan
        const activeScan = await ScanJob.findOne({
            where: { repository_id: repoId, status: 'active' },
            order: [['id', 'DESC']]
        });

        if (!activeScan) {
            return res.status(400).json({ error: 'No active scan to cancel' });
        }

        const { ScanService } = await import('../services/ScanService');
        await ScanService.cancelScan(activeScan.id);

        res.json({ message: 'Scan cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling scan:', error);
        res.status(500).json({ error: 'Failed to cancel scan' });
    }
});

export const repoRoutes = router;
