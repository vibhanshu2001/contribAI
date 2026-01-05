import axios from 'axios';
import { Repository, ScanJob, Signal, User } from '../models';
import { ScanCursor } from '../models/ScanJob';
import { SignalService } from './SignalService';
import { AuthService } from './AuthService';
import { IssueProcessor } from './IssueProcessor';
import { ProgressTracker } from './ProgressTracker';
import { RepoStructureAnalyzer, CategorizedFile } from './RepoStructureAnalyzer';
import logger from '../utils/logger';

export class ScanService {
    private static readonly BATCH_SIZE = 10; // Process 10 files at a time

    /**
     * Triggers a scan for a repository
     */
    static async triggerScan(repoId: number, userId: number, resume = false): Promise<ScanJob> {
        logger.info('Triggering scan', { repoId, userId, resume });
        const repo = await Repository.findByPk(repoId);
        if (!repo) {
            logger.error('Repository not found', { repoId });
            throw new Error('Repository not found');
        }

        let scanJob: ScanJob;

        if (resume && repo.scan_cursor) {
            // Resume existing scan
            const activeScan = await ScanJob.findOne({
                where: { repository_id: repo.id, status: 'active' },
                order: [['id', 'DESC']]
            });

            if (activeScan) {
                logger.info('Resuming existing scan', { scanJobId: activeScan.id });
                scanJob = activeScan;
                await ProgressTracker.logProgress(scanJob.id, 'resuming', 'Resuming scan from previous position');
            } else {
                // Create new scan job
                scanJob = await this.createNewScanJob(repo.id);
            }
        } else {
            // Create new scan job
            scanJob = await this.createNewScanJob(repo.id);
        }

        // Update Repo Status immediately
        repo.scan_status = 'scanning';
        await repo.save();

        // Run scan asynchronously
        this.performScan(scanJob.id, userId).catch(err => {
            logger.error(`Scan failed for job ${scanJob.id}`, { error: err });
            scanJob.status = 'failed';
            scanJob.save();
        });

        return scanJob;
    }

    /**
     * Create a new scan job
     */
    private static async createNewScanJob(repositoryId: number): Promise<ScanJob> {
        const scanJob = await ScanJob.create({
            repository_id: repositoryId,
            status: 'active',
            started_at: new Date(),
            progress_percentage: 0,
            current_phase: 'fetching_tree',
            progress_log: '[]'
        });

        await ProgressTracker.logProgress(scanJob.id, 'fetching_tree', 'Initializing scan...');
        return scanJob;
    }

    /**
     * Core scanning logic with incremental support
     */
    static async performScan(scanJobId: number, userId: number) {
        const scanJob = await ScanJob.findByPk(scanJobId);
        if (!scanJob) return;

        try {
            const repo = await Repository.findByPk(scanJob.repository_id);
            if (!repo) throw new Error('Repo not found');

            const user = await User.findByPk(userId);
            if (!user) throw new Error('User not found');

            const token = AuthService.decryptToken(user.oauth_token_encrypted);
            const headers = { Authorization: `Bearer ${token}` };

            // Parse cursor if resuming
            let cursor: ScanCursor | null = null;
            if (scanJob.scan_cursor) {
                try {
                    cursor = JSON.parse(scanJob.scan_cursor);
                    logger.info('Resuming from cursor', { cursor });
                } catch (e) {
                    logger.warn('Failed to parse cursor, starting fresh', { scanJobId });
                }
            }

            // Phase 1: Fetch Repository Metadata & Tree
            if (!cursor || cursor.phase === 'tree') {
                await ProgressTracker.logProgress(scanJobId, 'fetching_tree', 'Fetching repository structure...');
                await ProgressTracker.updatePercentage(scanJobId, 5);

                const repoDetailsUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}`;
                const repoRes = await axios.get(repoDetailsUrl, { headers });
                const { stargazers_count, language, default_branch } = repoRes.data;

                // Update Repo Metadata
                repo.stars = stargazers_count;
                repo.language = language || 'Unknown';
                await repo.save();

                // Fetch Tree
                const branch = default_branch || 'main';
                const treeUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}/git/trees/${branch}?recursive=1`;
                const treeRes = await axios.get(treeUrl, { headers });
                const treeData = treeRes.data.tree;

                await ProgressTracker.logProgress(scanJobId, 'analyzing_structure', `Found ${treeData.length} items in repository`);
                await ProgressTracker.updatePercentage(scanJobId, 10);

                // Phase 2: Analyze Structure
                const structure = RepoStructureAnalyzer.analyzeStructure(treeData);

                // Parse custom ignored paths
                let customIgnored: string[] = [];
                try {
                    customIgnored = JSON.parse(repo.ignored_paths || '[]');
                } catch (e) {
                    customIgnored = [];
                }

                // Categorize files
                const categorizedFiles = RepoStructureAnalyzer.categorizeFiles(treeData, structure, customIgnored);
                const filesToScan = RepoStructureAnalyzer.applyLimits(categorizedFiles);

                await ProgressTracker.logProgress(
                    scanJobId,
                    'scanning_files',
                    `Will scan ${filesToScan.length} files (${categorizedFiles.filter(f => f.priority === 1).length} source, ${categorizedFiles.filter(f => f.priority === 2).length} config, ${categorizedFiles.filter(f => f.priority === 3).length} test)`
                );
                await ProgressTracker.updatePercentage(scanJobId, 15);

                // Initialize cursor for file scanning
                cursor = {
                    lastProcessedFile: '',
                    filesProcessed: 0,
                    totalFiles: filesToScan.length,
                    phase: 'files',
                    timestamp: new Date().toISOString()
                };

                // Store files to scan in cursor (for resumability)
                scanJob.scan_cursor = JSON.stringify({ ...cursor, filesToScan });
                await scanJob.save();
            }

            // Phase 3: Scan Files in Batches
            if (cursor && cursor.phase === 'files') {
                const cursorData = JSON.parse(scanJob.scan_cursor!);
                const filesToScan: CategorizedFile[] = cursorData.filesToScan || [];
                let filesProcessed = cursor.filesProcessed || 0;
                let signalsFound = scanJob.signals_found || 0;

                for (let i = filesProcessed; i < filesToScan.length; i += this.BATCH_SIZE) {
                    const batch = filesToScan.slice(i, i + this.BATCH_SIZE);

                    for (const file of batch) {
                        try {
                            await ProgressTracker.logProgress(
                                scanJobId,
                                'scanning_files',
                                `Scanning ${file.path}`,
                                {
                                    filesProcessed: i + 1,
                                    totalFiles: filesToScan.length,
                                    currentFile: file.path
                                }
                            );

                            // Fetch file content
                            const blobRes = await axios.get(file.url, { headers });
                            const content = Buffer.from(blobRes.data.content, 'base64').toString('utf-8');

                            // Extract signals
                            const signals = SignalService.extractSignals(content, file.path);

                            if (signals.length > 0) {
                                for (const sig of signals) {
                                    await Signal.create({
                                        repository_id: repo.id,
                                        type: sig.type,
                                        file_path: sig.file_path,
                                        line_number: sig.line_number,
                                        snippet: sig.snippet,
                                        context: sig.context
                                    });
                                    signalsFound++;
                                }

                                await ProgressTracker.logProgress(
                                    scanJobId,
                                    'scanning_files',
                                    `Found ${signals.length} signal(s) in ${file.path}`
                                );
                            }

                            filesProcessed++;
                        } catch (error) {
                            logger.error('Error scanning file', { file: file.path, error });
                            // Continue with next file
                        }
                    }

                    // Update cursor after each batch
                    cursor.filesProcessed = filesProcessed;
                    cursor.timestamp = new Date().toISOString();
                    scanJob.scan_cursor = JSON.stringify({ ...cursorData, ...cursor });
                    scanJob.signals_found = signalsFound;
                    await scanJob.save();

                    // Update progress percentage (15% to 70%)
                    const fileProgress = Math.floor(15 + (filesProcessed / filesToScan.length) * 55);
                    await ProgressTracker.updatePercentage(scanJobId, fileProgress);
                }

                await ProgressTracker.logProgress(
                    scanJobId,
                    'processing_signals',
                    `Scan complete. Found ${signalsFound} signals in ${filesProcessed} files`
                );

                // Move to next phase
                cursor.phase = 'signals';
                scanJob.scan_cursor = JSON.stringify({ ...cursorData, ...cursor });
                await scanJob.save();
            }

            // Phase 4: Process Signals with LLM
            if (cursor && cursor.phase === 'signals') {
                await ProgressTracker.logProgress(scanJobId, 'processing_signals', 'Processing signals with AI...');
                await ProgressTracker.updatePercentage(scanJobId, 75);

                await IssueProcessor.processSignals(repo.id);

                await ProgressTracker.logProgress(scanJobId, 'processing_signals', 'AI processing complete');
                await ProgressTracker.updatePercentage(scanJobId, 95);

                cursor.phase = 'llm';
                scanJob.scan_cursor = JSON.stringify(cursor);
                await scanJob.save();
            }

            // Complete scan
            scanJob.status = 'completed';
            scanJob.completed_at = new Date();
            scanJob.current_phase = 'completed';
            await scanJob.save();

            await ProgressTracker.logProgress(scanJobId, 'completed', 'Scan completed successfully');
            await ProgressTracker.updatePercentage(scanJobId, 100);

            repo.scan_status = 'completed';
            repo.last_scan_at = new Date();
            repo.scan_cursor = null; // Clear cursor on successful completion
            await repo.save();

            logger.info('Scan completed successfully', { scanJobId, signalsFound: scanJob.signals_found });

        } catch (error) {
            logger.error('Scan Error:', { scanJobId, error });
            scanJob.status = 'failed';
            scanJob.current_phase = 'failed';
            await scanJob.save();

            await ProgressTracker.logProgress(scanJobId, 'failed', `Scan failed: ${(error as Error).message}`);

            const repo = await Repository.findByPk(scanJob.repository_id);
            if (repo) {
                repo.scan_status = 'failed';
                // Keep cursor for resumability
                repo.scan_cursor = scanJob.scan_cursor;
                await repo.save();
            }
        }
    }

    /**
     * Cancel an active scan
     */
    static async cancelScan(scanJobId: number): Promise<void> {
        const scanJob = await ScanJob.findByPk(scanJobId);
        if (!scanJob || scanJob.status !== 'active') {
            throw new Error('No active scan found');
        }

        scanJob.status = 'failed';
        scanJob.current_phase = 'cancelled';
        await scanJob.save();

        await ProgressTracker.logProgress(scanJobId, 'cancelled', 'Scan cancelled by user');

        const repo = await Repository.findByPk(scanJob.repository_id);
        if (repo) {
            repo.scan_status = 'failed';
            repo.scan_cursor = scanJob.scan_cursor; // Save cursor for resume
            await repo.save();
        }

        logger.info('Scan cancelled', { scanJobId });
    }
}

