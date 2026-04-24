/**
 * Base LLM Service for Azure OpenAI integration
 * Handles authentication, request/response, error handling, and logging
 */

import OpenAI from 'openai';
import type { LLMInteractionLog } from '@/lib/models';
import { llmInteractionLogStore } from '@/lib/data/stores';

export interface LLMPrompt {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
}

export interface LLMResponse {
    content: string;
    tokensUsed: number;
    model: string;
    timestamp: Date;
}

export interface AzureOpenAIConfig {
    apiKey: string;
    endpoint: string;
    projectsEndpoint: string;
    model: string;
    apiVersion: string;
}

export class BaseLLMService {
    private client: OpenAI | null = null;
    private config: AzureOpenAIConfig | null = null;
    private readonly MAX_RETRIES = 3;
    private readonly TIMEOUT_MS = 30000;
    private readonly BASE_BACKOFF_MS = 1000;

    constructor() {
        // Auto-configure from environment variables
        this.configureFromEnv();
    }

    /**
     * Configure the service from environment variables
     */
    private configureFromEnv(): void {
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://klaudio-eastus2-resource.openai.azure.com/openai/deployments/gpt-4.1-mini';
        const projectsEndpoint = process.env.AZURE_OPENAI_PROJECTS_ENDPOINT || 'https://klaudio-eastus2-resource.services.ai.azure.com/api/projects/klaudio-eastus2';
        const model = process.env.AZURE_OPENAI_MODEL || 'gpt-4.1-mini';
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

        if (!apiKey) {
            console.warn('AZURE_OPENAI_API_KEY not found in environment variables');
            return;
        }

        this.configure({
            apiKey,
            endpoint,
            projectsEndpoint,
            model,
            apiVersion
        });
    }

    /**
     * Configure the LLM service with Azure OpenAI credentials
     */
    configure(config: AzureOpenAIConfig): void {
        this.config = config;

        // Extract base URL and deployment name from the full endpoint
        // Azure endpoint format: https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version={version}
        // We need: https://{resource}.openai.azure.com
        let baseURL = config.endpoint;
        let deploymentName = config.model;

        // If endpoint contains deployment path, extract base URL and deployment name
        if (baseURL.includes('/deployments/')) {
            const match = baseURL.match(/^(https:\/\/[^\/]+)\/openai\/deployments\/([^\/]+)/);
            if (match) {
                baseURL = match[1];
                deploymentName = match[2];
            }
        }

        // Initialize OpenAI client with Azure configuration
        // The OpenAI SDK will automatically append /chat/completions to the baseURL
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: `${baseURL}/openai/deployments/${deploymentName}`,
            defaultHeaders: {
                'api-key': config.apiKey
            },
            defaultQuery: {
                'api-version': config.apiVersion
            }
        });

        // Store the deployment name for use in requests
        this.config.model = deploymentName;
    }

    /**
     * Send a request to the LLM with retry logic and error handling
     */
    async sendRequest(prompt: LLMPrompt, relatedOpportunityId?: string): Promise<LLMResponse> {
        if (!this.client || !this.config) {
            throw new Error('LLM service not configured. Please set AZURE_OPENAI_API_KEY in environment variables.');
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
            try {
                const response = await this.makeRequest(prompt);

                // Log successful interaction
                await this.logInteraction(prompt, response, relatedOpportunityId);

                return response;
            } catch (error) {
                lastError = error as Error;

                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw this.handleError(error);
                }

                // Calculate exponential backoff
                if (attempt < this.MAX_RETRIES - 1) {
                    const backoffMs = this.BASE_BACKOFF_MS * Math.pow(2, attempt);
                    console.warn(`LLM request failed (attempt ${attempt + 1}/${this.MAX_RETRIES}), retrying in ${backoffMs}ms...`);
                    await this.sleep(backoffMs);
                }
            }
        }

        // All retries exhausted
        throw new Error(`LLM request failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
    }

    /**
     * Make the actual API request with timeout
     */
    private async makeRequest(prompt: LLMPrompt): Promise<LLMResponse> {
        if (!this.client || !this.config) {
            throw new Error('LLM service not configured');
        }

        const startTime = Date.now();

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), this.TIMEOUT_MS);
        });

        // Create API request promise
        const requestPromise = this.client.chat.completions.create({
            model: this.config.model,
            messages: [
                { role: 'system', content: prompt.systemPrompt },
                { role: 'user', content: prompt.userPrompt }
            ],
            temperature: prompt.temperature,
            max_tokens: prompt.maxTokens
        });

        // Race between timeout and request
        const completion = await Promise.race([requestPromise, timeoutPromise]);

        const content = completion.choices[0]?.message?.content || '';
        const tokensUsed = completion.usage?.total_tokens || 0;

        return {
            content,
            tokensUsed,
            model: this.config.model,
            timestamp: new Date()
        };
    }

    /**
     * Log LLM interaction for auditability
     */
    private async logInteraction(
        prompt: LLMPrompt,
        response: LLMResponse,
        relatedOpportunityId?: string
    ): Promise<void> {
        const log: LLMInteractionLog = {
            id: `llm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: response.timestamp,
            promptType: this.inferPromptType(prompt),
            systemPrompt: prompt.systemPrompt,
            userPrompt: prompt.userPrompt,
            response: response.content,
            model: response.model,
            tokensUsed: response.tokensUsed,
            relatedOpportunityId
        };

        llmInteractionLogStore.create(log);
    }

    /**
     * Infer prompt type from system prompt content
     */
    private inferPromptType(prompt: LLMPrompt): string {
        const systemPrompt = prompt.systemPrompt.toLowerCase();

        if (systemPrompt.includes('score') || systemPrompt.includes('match')) {
            return 'scoring';
        }
        if (systemPrompt.includes('summary')) {
            return 'summary';
        }
        if (systemPrompt.includes('detail') || systemPrompt.includes('brief')) {
            return 'detail';
        }

        return 'general';
    }

    /**
     * Check if an error is retryable
     */
    private isRetryableError(error: unknown): boolean {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();

            // Timeout errors are retryable
            if (message.includes('timeout')) {
                return true;
            }

            // Check for Azure-specific error codes
            const errorObj = error as any;
            const status = errorObj.status || errorObj.statusCode;

            // 429 (rate limit) and 500 (server error) are retryable
            if (status === 429 || status === 500 || status === 503) {
                return true;
            }

            // 401 (unauthorized) is not retryable
            if (status === 401 || status === 403) {
                return false;
            }
        }

        return false;
    }

    /**
     * Handle and format errors
     */
    private handleError(error: unknown): Error {
        if (error instanceof Error) {
            const errorObj = error as any;
            const status = errorObj.status || errorObj.statusCode;

            if (status === 401) {
                return new Error('Azure OpenAI authentication failed. Please check your API key.');
            }

            if (status === 429) {
                return new Error('Azure OpenAI rate limit exceeded. Please try again later.');
            }

            if (status === 500 || status === 503) {
                return new Error('Azure OpenAI service error. Please try again later.');
            }

            return error;
        }

        return new Error('Unknown LLM service error');
    }

    /**
     * Sleep utility for backoff
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if service is configured
     */
    isConfigured(): boolean {
        return this.client !== null && this.config !== null;
    }

    /**
     * Get current configuration (without exposing API key)
     */
    getConfig(): Omit<AzureOpenAIConfig, 'apiKey'> | null {
        if (!this.config) return null;

        return {
            endpoint: this.config.endpoint,
            projectsEndpoint: this.config.projectsEndpoint,
            model: this.config.model,
            apiVersion: this.config.apiVersion
        };
    }
}

// Export singleton instance
export const baseLLMService = new BaseLLMService();
