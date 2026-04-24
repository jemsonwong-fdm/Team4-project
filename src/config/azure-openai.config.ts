/**
 * Azure OpenAI Foundry API Configuration
 */

export interface AzureOpenAIConfig {
    apiKey: string;
    endpoint: string;
    projectsEndpoint: string;
    model: string;
    apiVersion: string;
}

/**
 * Get Azure OpenAI configuration from environment variables
 */
export function getAzureOpenAIConfig(): AzureOpenAIConfig {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

    if (!apiKey) {
        throw new Error('AZURE_OPENAI_API_KEY environment variable is not set');
    }

    if (!endpoint) {
        throw new Error('AZURE_OPENAI_ENDPOINT environment variable is not set');
    }

    return {
        apiKey,
        endpoint,
        projectsEndpoint: process.env.AZURE_OPENAI_PROJECTS_ENDPOINT ||
            'https://klaudio-eastus2-resource.services.ai.azure.com/api/projects/klaudio-eastus2',
        model: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
    };
}

/**
 * Validate Azure OpenAI configuration
 */
export function validateAzureOpenAIConfig(config: AzureOpenAIConfig): boolean {
    return !!(
        config.apiKey &&
        config.endpoint &&
        config.projectsEndpoint &&
        config.model &&
        config.apiVersion
    );
}
