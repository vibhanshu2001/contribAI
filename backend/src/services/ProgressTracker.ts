import { ScanJob, ProgressEvent } from '../models/ScanJob';
import logger from '../utils/logger';

export class ProgressTracker {
    /**
     * Log a progress event for a scan job
     */
    static async logProgress(
        scanJobId: number,
        phase: string,
        message: string,
        metadata?: {
            filesProcessed?: number;
            totalFiles?: number;
            currentFile?: string;
        }
    ): Promise<void> {
        try {
            const scanJob = await ScanJob.findByPk(scanJobId);
            if (!scanJob) {
                logger.error('ScanJob not found for progress logging', { scanJobId });
                return;
            }

            // Parse existing progress log
            let progressLog: ProgressEvent[] = [];
            try {
                progressLog = JSON.parse(scanJob.progress_log || '[]');
            } catch (e) {
                logger.warn('Failed to parse progress_log, resetting', { scanJobId });
                progressLog = [];
            }

            // Create new progress event
            const event: ProgressEvent = {
                timestamp: new Date().toISOString(),
                phase,
                message,
                ...metadata
            };

            // Append event
            progressLog.push(event);

            // Keep only last 100 events to avoid bloat
            if (progressLog.length > 100) {
                progressLog = progressLog.slice(-100);
            }

            // Update scan job
            scanJob.progress_log = JSON.stringify(progressLog);
            scanJob.current_phase = phase;
            await scanJob.save();

            logger.info('Progress logged', { scanJobId, phase, message });
        } catch (error) {
            logger.error('Failed to log progress', { scanJobId, error });
        }
    }

    /**
     * Update progress percentage
     */
    static async updatePercentage(scanJobId: number, percentage: number): Promise<void> {
        try {
            const scanJob = await ScanJob.findByPk(scanJobId);
            if (!scanJob) return;

            scanJob.progress_percentage = Math.min(100, Math.max(0, percentage));
            await scanJob.save();
        } catch (error) {
            logger.error('Failed to update progress percentage', { scanJobId, error });
        }
    }

    /**
     * Get current progress for a scan job
     */
    static async getProgress(scanJobId: number): Promise<{
        percentage: number;
        phase: string;
        events: ProgressEvent[];
    } | null> {
        try {
            const scanJob = await ScanJob.findByPk(scanJobId);
            if (!scanJob) return null;

            let events: ProgressEvent[] = [];
            try {
                events = JSON.parse(scanJob.progress_log || '[]');
            } catch (e) {
                events = [];
            }

            return {
                percentage: scanJob.progress_percentage,
                phase: scanJob.current_phase,
                events
            };
        } catch (error) {
            logger.error('Failed to get progress', { scanJobId, error });
            return null;
        }
    }

    /**
     * Clear progress log (useful for new scans)
     */
    static async clearProgress(scanJobId: number): Promise<void> {
        try {
            const scanJob = await ScanJob.findByPk(scanJobId);
            if (!scanJob) return;

            scanJob.progress_log = '[]';
            scanJob.progress_percentage = 0;
            scanJob.current_phase = 'pending';
            await scanJob.save();
        } catch (error) {
            logger.error('Failed to clear progress', { scanJobId, error });
        }
    }
}
