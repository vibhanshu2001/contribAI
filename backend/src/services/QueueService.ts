import { ScanService } from './ScanService';
import { ScanJob } from '../models/ScanJob';

// Simplified Queue for MVP - just wraps direct calls or simulates async
export class QueueService {
    /**
     * Add a scan job to the queue
     */
    static async addScanJob(repoId: number, userId: number, resume = false): Promise<ScanJob> {
        // In a real app, this would add to BullMQ.
        // For MVP, directly trigger ScanService
        return ScanService.triggerScan(repoId, userId, resume);
    }

    /**
     * Trigger a scan (alias for addScanJob)
     */
    static async triggerScan(repoId: number, userId: number, resume = false): Promise<ScanJob> {
        return this.addScanJob(repoId, userId, resume);
    }
}
