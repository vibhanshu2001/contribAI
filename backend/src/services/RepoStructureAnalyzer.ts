import logger from '../utils/logger';

export interface RepoStructure {
    rootDirs: string[];
    testDirs: string[];
    configFiles: string[];
    ignoredPaths: string[];
}

export interface CategorizedFile {
    path: string;
    url: string;
    priority: 1 | 2 | 3;
    category: 'source' | 'config' | 'test';
}

export class RepoStructureAnalyzer {
    private static readonly DEFAULT_IGNORED_PATHS = [
        'node_modules',
        'dist',
        'build',
        '.git',
        'vendor',
        'coverage',
        '.next',
        'out',
        'target',
        'bin',
        'obj',
        '__pycache__',
        '.pytest_cache',
        '.venv',
        'venv'
    ];

    private static readonly SOURCE_DIRS = [
        'src',
        'lib',
        'app',
        'components',
        'pages',
        'api',
        'services',
        'utils',
        'helpers',
        'core',
        'modules'
    ];

    private static readonly TEST_DIRS = [
        '__tests__',
        'test',
        'tests',
        'spec',
        'specs',
        'e2e',
        'integration'
    ];

    private static readonly CONFIG_FILES = [
        'package.json',
        'tsconfig.json',
        'README.md',
        'CONTRIBUTING.md',
        'LICENSE',
        'Dockerfile',
        'docker-compose.yml',
        '.env.example'
    ];

    private static readonly SOURCE_EXTENSIONS = [
        '.ts', '.tsx', '.js', '.jsx',
        '.py', '.go', '.rs', '.java',
        '.c', '.cpp', '.h', '.hpp',
        '.rb', '.php', '.swift', '.kt'
    ];

    /**
     * Check if a path should be ignored
     */
    static shouldIgnorePath(path: string, customIgnored: string[] = []): boolean {
        const allIgnored = [...this.DEFAULT_IGNORED_PATHS, ...customIgnored];

        return allIgnored.some(ignored => {
            // Check if path starts with ignored directory
            return path.startsWith(ignored + '/') || path === ignored;
        });
    }

    /**
     * Analyze repository structure from tree data
     */
    static analyzeStructure(treeData: any[]): RepoStructure {
        const rootDirs = new Set<string>();
        const testDirs = new Set<string>();
        const configFiles: string[] = [];

        for (const node of treeData) {
            if (node.type === 'tree') {
                const parts = node.path.split('/');
                const firstDir = parts[0];

                // Identify source directories
                if (this.SOURCE_DIRS.includes(firstDir)) {
                    rootDirs.add(firstDir);
                }

                // Identify test directories
                if (this.TEST_DIRS.some(testDir => node.path.includes(testDir))) {
                    testDirs.add(node.path);
                }
            } else if (node.type === 'blob') {
                // Identify config files
                const fileName = node.path.split('/').pop();
                if (this.CONFIG_FILES.includes(fileName)) {
                    configFiles.push(node.path);
                }
            }
        }

        logger.info('Repository structure analyzed', {
            rootDirs: Array.from(rootDirs),
            testDirs: Array.from(testDirs),
            configFiles
        });

        return {
            rootDirs: Array.from(rootDirs),
            testDirs: Array.from(testDirs),
            configFiles,
            ignoredPaths: this.DEFAULT_IGNORED_PATHS
        };
    }

    /**
     * Categorize files by priority
     */
    static categorizeFiles(
        treeData: any[],
        structure: RepoStructure,
        customIgnored: string[] = []
    ): CategorizedFile[] {
        const categorized: CategorizedFile[] = [];

        for (const node of treeData) {
            // Only process blobs (files)
            if (node.type !== 'blob') continue;

            // Skip ignored paths
            if (this.shouldIgnorePath(node.path, customIgnored)) continue;

            const fileName = node.path.split('/').pop();
            const ext = '.' + fileName.split('.').pop();
            const pathParts = node.path.split('/');
            const firstDir = pathParts[0];

            // Priority 1: Source files in main directories
            if (
                structure.rootDirs.includes(firstDir) &&
                this.SOURCE_EXTENSIONS.includes(ext)
            ) {
                categorized.push({
                    path: node.path,
                    url: node.url,
                    priority: 1,
                    category: 'source'
                });
                continue;
            }

            // Priority 2: Config files
            if (structure.configFiles.includes(node.path)) {
                categorized.push({
                    path: node.path,
                    url: node.url,
                    priority: 2,
                    category: 'config'
                });
                continue;
            }

            // Priority 3: Test files
            if (
                structure.testDirs.some(testDir => node.path.includes(testDir)) &&
                this.SOURCE_EXTENSIONS.includes(ext)
            ) {
                categorized.push({
                    path: node.path,
                    url: node.url,
                    priority: 3,
                    category: 'test'
                });
                continue;
            }

            // Other source files (lower priority)
            if (this.SOURCE_EXTENSIONS.includes(ext)) {
                categorized.push({
                    path: node.path,
                    url: node.url,
                    priority: 3,
                    category: 'source'
                });
            }
        }

        // Sort by priority
        categorized.sort((a, b) => a.priority - b.priority);

        logger.info('Files categorized', {
            total: categorized.length,
            priority1: categorized.filter(f => f.priority === 1).length,
            priority2: categorized.filter(f => f.priority === 2).length,
            priority3: categorized.filter(f => f.priority === 3).length
        });

        return categorized;
    }

    /**
     * Apply file limits per priority
     */
    static applyLimits(
        files: CategorizedFile[],
        limits = { priority1: 100, priority2: 10, priority3: 30 }
    ): CategorizedFile[] {
        const priority1 = files.filter(f => f.priority === 1).slice(0, limits.priority1);
        const priority2 = files.filter(f => f.priority === 2).slice(0, limits.priority2);
        const priority3 = files.filter(f => f.priority === 3).slice(0, limits.priority3);

        const limited = [...priority1, ...priority2, ...priority3];

        logger.info('File limits applied', {
            original: files.length,
            limited: limited.length,
            priority1: priority1.length,
            priority2: priority2.length,
            priority3: priority3.length
        });

        return limited;
    }
}
