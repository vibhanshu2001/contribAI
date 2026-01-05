import axios from 'axios';
import { config } from '../config/env';
import logger from '../utils/logger';

export interface LLMResponse {
    title?: string;
    body?: string; // Markdown
    confidence?: number;
    category?: string;
    reasoning?: string;
}

export interface LLMProvider {
    /**
     * Phase 1: Assess if the signal is worth an issue
     */
    classifySignal(signal: any, repoContext: string): Promise<{ worthy: boolean; confidence: number; reasoning: string }>;

    /**
     * Phase 2: Draft the issue
     */
    draftIssue(signal: any, repoContext: string): Promise<LLMResponse>;
}

export class GeminiProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        logger.info('GeminiProvider initialized', { hasApiKey: !!apiKey });
    }

    /**
     * Call Gemini API with optional structured output schema
     */
    private async callGemini(
        prompt: string,
        options?: {
            systemInstruction?: string;
            responseSchema?: any;
        }
    ): Promise<string> {
        logger.info('Calling Gemini API', {
            promptLength: prompt.length,
            hasSchema: !!options?.responseSchema,
            hasSystemInstruction: !!options?.systemInstruction
        });

        const requestBody: any = {
            contents: [
                {
                    parts: [{ text: prompt }],
                    role: 'user'
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048,
            }
        };

        // Add system instruction if provided
        if (options?.systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{ text: options.systemInstruction }],
                role: 'user'
            };
        }

        // Add structured output schema if provided
        if (options?.responseSchema) {
            requestBody.generationConfig.responseMimeType = 'application/json';
            requestBody.generationConfig.responseSchema = options.responseSchema;
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
                requestBody,
                { headers: { 'Content-Type': 'application/json' } }
            );

            const candidate = response.data.candidates?.[0];
            if (!candidate?.content?.parts?.[0]?.text) {
                logger.error('Empty response from Gemini', { response: response.data });
                throw new Error('Empty response from Gemini');
            }
            const text = candidate.content.parts[0].text;
            logger.info('Gemini API response received', { responseLength: text.length });
            return text;
        } catch (error: any) {
            logger.error('Gemini API Error', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }

    async classifySignal(signal: any, repoContext: string): Promise<{ worthy: boolean; confidence: number; reasoning: string }> {
        logger.info('Classifying signal', { signalId: signal.id, type: signal.type, filePath: signal.file_path });

        const prompt = `You are a senior open source maintainer. Evaluate this signal from a repository to decide if it is worth creating a GitHub Issue for.
    
CONTEXT:
Repo: ${repoContext}
File: ${signal.file_path}:${signal.line_number}
Type: ${signal.type}
Snippet:
\`\`\`
${signal.context}
\`\`\`

CRITERIA:
- Ignore trivial TODOs like "clean up later" without context
- Ignore commented out code unless it looks like a bug
- Prioritize FIXME, missing public docs, or clear logic errors
- Consider if this would be valuable for maintainers to address

Evaluate if this signal is worthy of creating a GitHub issue.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                worthy: {
                    type: 'BOOLEAN',
                    description: 'True if this is a real issue/bug/doc gap worth addressing, false if trivial'
                },
                confidence: {
                    type: 'NUMBER',
                    description: 'Confidence score from 0.0 to 1.0'
                },
                reasoning: {
                    type: 'STRING',
                    description: 'Short explanation of the decision'
                }
            },
            required: ['worthy', 'confidence', 'reasoning']
        };

        const raw = await this.callGemini(prompt, { responseSchema: schema });
        const result = JSON.parse(raw);
        logger.info('Signal classified', {
            signalId: signal.id,
            worthy: result.worthy,
            confidence: result.confidence,
            reasoning: result.reasoning
        });
        return result;
    }

    async draftIssue(signal: any, repoContext: string): Promise<LLMResponse> {
        logger.info('Drafting issue', { signalId: signal.id, filePath: signal.file_path });

        const systemInstruction = `You are an experienced open source contributor. Write clear, helpful, and professional GitHub issues. Use natural language and perfect markdown formatting.`;

        const prompt = `Draft a GitHub issue for a potential problem found in a codebase.

CONTEXT:
Repository Context: ${repoContext}
File Path: ${signal.file_path}
Line Number: ${signal.line_number}
Signal Type/Brief: ${signal.type}

CODE SNIPPET:
\`\`\`
${signal.context}
\`\`\`

INSTRUCTIONS:
1. **Tone**: Write like a human contributor, not a bot. Use "I noticed" or "I was looking at". Be friendly and respectful.
2. **Structure**:
   - Start with a polite introduction.
   - Use ## headings (e.g., ## Problem, ## Details, ## Potential Fix).
   - Use bullet points for clear lists.
   - Use **bold** for emphasis.
3. **CODE BLOCKS (CRITICAL)**:
   - Use triple backticks (\`\`\`) with a language tag (e.g., \`\`\`typescript, \`\`\`javascript, \`\`\`python).
   - ALWAYS start a code block with three backticks followed by the language.
   - ALWAYS end a code block with three backticks on a new line.
   - Ensure a blank line exists BEFORE and AFTER every fenced code block.
   - Do NOT truncate code snippets.
4. **Formatting**: Ensure the body is a single, well-formatted markdown string.
`;

        const schema = {
            type: 'object',
            properties: {
                title: { type: 'string' },
                body: { type: 'string' },
                category: { type: 'string', enum: ['bug', 'enhancement', 'security'] },
                confidence_score: { type: 'number' }
            },
            required: ['title', 'body', 'category', 'confidence_score']
        };

        const raw = await this.callGemini(prompt, { responseSchema: schema });
        const result = JSON.parse(raw);
        logger.info('Issue drafted successfully', {
            signalId: signal.id,
            title: result.title,
            category: result.category
        });
        return result;
    }
}

// Export a singleton or factory
export class LLMService {
    private static provider: LLMProvider = new GeminiProvider(config.gemini.apiKey);

    static async classify(signal: any, repoContext: string) {
        return this.provider.classifySignal(signal, repoContext);
    }

    static async draft(signal: any, repoContext: string) {
        return this.provider.draftIssue(signal, repoContext);
    }
}
