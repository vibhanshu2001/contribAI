import { Signal, IssueCandidate, LLMUsage, Repository } from '../models';
import { LLMService } from './LLMService';
import { config } from '../config/env';
import logger from '../utils/logger';

export class IssueProcessor {
    /**
     * Process signals for a repository: Classify -> Draft
     */
    static async processSignals(repoId: number) {
        logger.info('Starting issue processing', { repoId });
        const signals = await Signal.findAll({
            where: { repository_id: repoId },
            // Limit signals to process to save cost (e.g. max 50 recent ones)
            limit: 50,
            order: [['id', 'DESC']]
        });

        logger.info('Found signals for processing', { repoId, signalCount: signals.length });

        const repo = await Repository.findByPk(repoId);
        if (!repo) {
            logger.warn('Repository not found, skipping processing', { repoId });
            return;
        }

        // Safety Cap: Check if we already have enough draft issues for this scan?
        // For MVP, we'll just process until we hit the cap.
        const MAX_ISSUES = config.limits.maxIssuesPerScan;
        let issuesDrafted = 0;

        const repoContext = `Repo: ${repo.owner}/${repo.name}, Language: ${repo.language}`;

        for (const signal of signals) {
            if (issuesDrafted >= MAX_ISSUES) break;

            // Check if candidate already exists
            const existing = await IssueCandidate.findOne({ where: { signal_id: signal.id } });
            if (existing) continue;

            // Phase 1: Classify
            try {
                logger.info('Processing signal', { signalId: signal.id, type: signal.type });
                const classification = await LLMService.classify(signal, repoContext);

                // Track Usage (Estimated)
                await LLMUsage.create({
                    repository_id: repoId,
                    tokens_in: 200, // Estimate
                    tokens_out: 50, // Estimate
                    estimated_cost: 0.0005,
                    phase: 'classification'
                });

                if (!classification.worthy || classification.confidence < 0.7) {
                    logger.info('Signal skipped - not worthy or low confidence', {
                        signalId: signal.id,
                        worthy: classification.worthy,
                        confidence: classification.confidence,
                        reasoning: classification.reasoning
                    });
                    continue;
                }

                // Phase 2: Draft
                logger.info('Signal passed classification, drafting issue', { signalId: signal.id });
                const draft = await LLMService.draft(signal, repoContext);

                // Track Usage
                await LLMUsage.create({
                    repository_id: repoId,
                    tokens_in: 500,
                    tokens_out: 300,
                    estimated_cost: 0.002,
                    phase: 'drafting'
                });

                const candidate = await IssueCandidate.create({
                    repository_id: repoId,
                    signal_id: signal.id,
                    title: draft.title || `Issue from ${signal.file_path}`,
                    body: draft.body || 'No description provided.',
                    category: draft.category || 'bug',
                    confidence_score: classification.confidence,
                    status: 'draft',
                    risk_level: 'low' // Default
                });

                logger.info('Issue candidate created', {
                    candidateId: candidate.id,
                    signalId: signal.id,
                    title: candidate.title
                });

                issuesDrafted++;

            } catch (error: any) {
                logger.error('Error processing signal', {
                    signalId: signal.id,
                    error: error.message,
                    stack: error.stack
                });
            }
        }

        logger.info('Issue processing completed', {
            repoId,
            totalSignals: signals.length,
            issuesDrafted,
            maxIssues: MAX_ISSUES
        });
    }
}
