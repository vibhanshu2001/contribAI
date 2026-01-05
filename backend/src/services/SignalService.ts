export interface SignalResult {
    // Result of a signal extraction
    type: string;
    file_path: string;
    line_number: number;
    snippet: string;
    context: string;
}

export class SignalService {
    /**
     * Analyzes file content and returns a list of signals (TODOs, issues)
     */
    static extractSignals(content: string, filePath: string): SignalResult[] {
        const signals: SignalResult[] = [];
        const lines = content.split('\n');

        // 1. TODO / FIXME / HACK scanning
        const todoRegex = /(\/\/|#|\/\*)\s*(TODO|FIXME|HACK|XXX)\s*[:\-]?(.*)$/i;

        lines.forEach((line, index) => {
            const match = line.match(todoRegex);
            if (match) {
                const type = match[2].toUpperCase(); // TODO, FIXME
                const commentContent = match[3].trim();

                // Context: Get 2 lines before and 2 lines after
                const startLine = Math.max(0, index - 2);
                const endLine = Math.min(lines.length - 1, index + 2);
                const contextLines = lines.slice(startLine, endLine + 1);

                signals.push({
                    type: type + '_COMMENT',
                    file_path: filePath,
                    line_number: index + 1,
                    snippet: line.trim(),
                    context: contextLines.join('\n')
                });
            }
        });

        // 2. Heuristic: Public exported function missing docs (TS/JS only)
        if (filePath.match(/\.(ts|js|jsx|tsx)$/)) {
            // Very naive regex for exported functions
            // "export function foo" or "export const foo =" or "public foo("
            const exportRegex = /^\s*(export\s+(async\s+)?(function|const|class)|public\s+)/;
            const docRegex = /^\s*\/\*\*/; // Starts with /**

            lines.forEach((line, index) => {
                if (line.match(exportRegex)) {
                    // Check previous line for documentation
                    const prevLine = index > 0 ? lines[index - 1] : '';
                    if (!prevLine.trim().match(docRegex) && !prevLine.trim().endsWith('*/')) {
                        // Check if it's just a simple export inside a module or interface? 
                        // Heuristic: If line length > 20 (to avoid noise)
                        if (line.length > 20) {
                            const startLine = Math.max(0, index - 1);
                            const endLine = Math.min(lines.length - 1, index + 3);

                            signals.push({
                                type: 'MISSING_DOCS',
                                file_path: filePath,
                                line_number: index + 1,
                                snippet: line.trim().substring(0, 100),
                                context: lines.slice(startLine, endLine + 1).join('\n')
                            });
                        }
                    }
                }
            });
        }

        return signals;
    }
}
