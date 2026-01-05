import express from 'express';
import { IssueCandidate, Signal, Repository } from '../models';
import { IssueService } from '../services/IssueService';

const router = express.Router();

// We need repoId to filter usually, but maybe list by issueId
// GET /api/repos/:id/issues
// Let's keep this generic: GET /api/issues with query param ?repo_id=...

router.get('/', async (req, res) => {
    const { repo_id, status } = req.query;
    const where: any = {};
    if (repo_id) where.repository_id = repo_id;
    if (status) where.status = status;

    const issues = await IssueCandidate.findAll({
        where,
        include: [Signal, Repository],
        order: [['confidence_score', 'DESC']]
    });
    res.json(issues);
});

router.get('/:id', async (req, res) => {
    const issue = await IssueCandidate.findByPk(req.params.id, { include: [Signal, Repository] });
    if (!issue) return res.status(404).json({ error: 'Not found' });
    res.json(issue);
});

router.patch('/:id', async (req, res) => {
    try {
        const issue = await IssueService.updateIssue(parseInt(req.params.id), req.body);
        res.json(issue);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.post('/:id/publish', async (req: any, res) => {
    try {
        // Mock user id 1 for MVP as auth middleware logic is simplified
        const userId = 1;
        const result = await IssueService.publishIssue(parseInt(req.params.id), userId);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export const issueRoutes = router;
