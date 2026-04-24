/**
 * LLM Services - Decoupled Azure OpenAI integration
 * 
 * This module provides a clean separation of concerns for LLM integration:
 * - BaseLLMService: Core Azure OpenAI client with error handling and logging
 * - ScoringService: Match scoring for client pairs
 * - SummaryService: Opportunity title generation
 * - DetailService: Detailed opportunity brief generation
 * - BatchProcessor: Efficient parallel processing with rate limiting
 */

export { baseLLMService, BaseLLMService } from './base';
export { scoringService, ScoringService } from './scoringService';
export { summaryService, SummaryService } from './summaryService';
export { detailService, DetailService } from './detailService';
export { batchProcessor, BatchProcessor, processBatch } from './batchProcessor';

export type { LLMPrompt, LLMResponse, AzureOpenAIConfig } from './base';
export type { BatchProcessorOptions } from './batchProcessor';
