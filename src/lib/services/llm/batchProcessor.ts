/**
 * Batch Processor for efficient LLM request handling
 * Supports parallel processing with rate limiting and queue management
 */

export interface BatchProcessorOptions {
    concurrency: number;
    onProgress?: (completed: number, total: number) => void;
    onError?: (error: Error, item: any) => void;
    rateLimitDelay?: number; // Delay between batches in ms
}

export class BatchProcessor {
    private readonly DEFAULT_CONCURRENCY = 5;
    private readonly DEFAULT_RATE_LIMIT_DELAY = 100; // 100ms between batches

    /**
     * Process multiple items in parallel with configurable concurrency
     */
    async processBatch<T, R>(
        items: T[],
        processor: (item: T) => Promise<R>,
        options: Partial<BatchProcessorOptions> = {}
    ): Promise<R[]> {
        const {
            concurrency = this.DEFAULT_CONCURRENCY,
            onProgress,
            onError,
            rateLimitDelay = this.DEFAULT_RATE_LIMIT_DELAY
        } = options;

        const results: R[] = [];
        const errors: Array<{ item: T; error: Error }> = [];
        let completed = 0;
        const total = items.length;

        // Process items in chunks based on concurrency
        for (let i = 0; i < items.length; i += concurrency) {
            const chunk = items.slice(i, i + concurrency);

            // Process chunk in parallel
            const chunkPromises = chunk.map(async (item) => {
                try {
                    const result = await processor(item);
                    completed++;

                    if (onProgress) {
                        onProgress(completed, total);
                    }

                    return { success: true as const, result, item };
                } catch (error) {
                    completed++;
                    const err = error instanceof Error ? error : new Error(String(error));

                    if (onError) {
                        onError(err, item);
                    }

                    if (onProgress) {
                        onProgress(completed, total);
                    }

                    return { success: false as const, error: err, item };
                }
            });

            // Wait for chunk to complete
            const chunkResults = await Promise.all(chunkPromises);

            // Collect results and errors
            for (const result of chunkResults) {
                if (result.success) {
                    results.push(result.result);
                } else {
                    errors.push({ item: result.item, error: result.error });
                }
            }

            // Rate limiting: delay between chunks (except for last chunk)
            if (i + concurrency < items.length && rateLimitDelay > 0) {
                await this.sleep(rateLimitDelay);
            }
        }

        // Log errors if any occurred
        if (errors.length > 0) {
            console.warn(`Batch processing completed with ${errors.length} errors out of ${total} items`);
        }

        return results;
    }

    /**
     * Process items with streaming results (results returned as they complete)
     */
    async processBatchStreaming<T, R>(
        items: T[],
        processor: (item: T) => Promise<R>,
        onResult: (result: R, index: number) => void,
        options: Partial<BatchProcessorOptions> = {}
    ): Promise<void> {
        const {
            concurrency = this.DEFAULT_CONCURRENCY,
            onProgress,
            onError,
            rateLimitDelay = this.DEFAULT_RATE_LIMIT_DELAY
        } = options;

        let completed = 0;
        const total = items.length;

        // Process items in chunks based on concurrency
        for (let i = 0; i < items.length; i += concurrency) {
            const chunk = items.slice(i, i + concurrency);
            const chunkStartIndex = i;

            // Process chunk in parallel
            const chunkPromises = chunk.map(async (item, chunkIndex) => {
                const itemIndex = chunkStartIndex + chunkIndex;

                try {
                    const result = await processor(item);
                    completed++;

                    // Stream result immediately
                    onResult(result, itemIndex);

                    if (onProgress) {
                        onProgress(completed, total);
                    }
                } catch (error) {
                    completed++;
                    const err = error instanceof Error ? error : new Error(String(error));

                    if (onError) {
                        onError(err, item);
                    }

                    if (onProgress) {
                        onProgress(completed, total);
                    }
                }
            });

            // Wait for chunk to complete
            await Promise.all(chunkPromises);

            // Rate limiting: delay between chunks (except for last chunk)
            if (i + concurrency < items.length && rateLimitDelay > 0) {
                await this.sleep(rateLimitDelay);
            }
        }
    }

    /**
     * Process items with a queue-based approach (useful for long-running operations)
     */
    async processBatchWithQueue<T, R>(
        items: T[],
        processor: (item: T) => Promise<R>,
        options: Partial<BatchProcessorOptions> = {}
    ): Promise<R[]> {
        const {
            concurrency = this.DEFAULT_CONCURRENCY,
            onProgress,
            onError
        } = options;

        const results: R[] = new Array(items.length);
        const queue = items.map((item, index) => ({ item, index }));
        let completed = 0;
        const total = items.length;

        // Create worker promises
        const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
            while (queue.length > 0) {
                const work = queue.shift();
                if (!work) break;

                const { item, index } = work;

                try {
                    const result = await processor(item);
                    results[index] = result;
                    completed++;

                    if (onProgress) {
                        onProgress(completed, total);
                    }
                } catch (error) {
                    completed++;
                    const err = error instanceof Error ? error : new Error(String(error));

                    if (onError) {
                        onError(err, item);
                    }

                    if (onProgress) {
                        onProgress(completed, total);
                    }
                }
            }
        });

        // Wait for all workers to complete
        await Promise.all(workers);

        // Filter out undefined results (from errors)
        return results.filter(r => r !== undefined);
    }

    /**
     * Sleep utility for rate limiting
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate optimal concurrency based on item count and rate limits
     */
    calculateOptimalConcurrency(
        itemCount: number,
        rateLimit: number, // requests per second
        estimatedDurationPerItem: number // in seconds
    ): number {
        // Simple heuristic: don't exceed rate limit
        const maxConcurrency = Math.floor(rateLimit * estimatedDurationPerItem);

        // Cap at reasonable limits
        return Math.max(1, Math.min(maxConcurrency, 10));
    }
}

// Export singleton instance
export const batchProcessor = new BatchProcessor();

// Export utility function for common use case
export async function processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options?: Partial<BatchProcessorOptions>
): Promise<R[]> {
    return batchProcessor.processBatch(items, processor, options);
}
