import express from 'express';
import { Signal } from '../models';

const router = express.Router({ mergeParams: true }); // mergeParams to access :id from parent router

// GET /api/repos/:id/signals
router.get('/', async (req, res) => {
    try {
        const repoId = (req.params as any).id; // Cast to any to bypass TS check for merged params
        // Express router mergeParams issue: usually we need to access req.params.id if mounted at /api/repos/:id/signals
        // If mounted as `app.use('/api/repos', ...)` and then subrouter, let's verify.
        // Actually, easier to just make a global route /api/signals?repo_id=...
        // Or handle it in repos.ts

        // Let's rely on query param for simplicity or fix mounting later.
        // Wait, I am mounting this in index.ts or repos.ts?
        // I haven't mounted it yet.

        // Simplest: Add this handler inside repos.ts
        res.status(501).json({ error: 'Not implemented in separate file' });
    } catch (e) {
        res.status(500).json({ error: 'Internal error' });
    }
});
