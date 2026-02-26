/**
 * Metadata associated with a tracked promise
 */
export interface PromiseMetadata<T = any> {
  [key: string]: T;
}

/**
 * Result of a tracked promise execution
 */
export interface TrackedResult<M extends PromiseMetadata> {
  metadata: M;
  status: 'fulfilled' | 'rejected';
  value?: any;
  reason?: any;
  success: boolean;
}

/**
 * Options for the PromiseTracker
 */
export interface PromiseTrackerOptions {
  /**
   * Whether to log results automatically
   */
  autoLog?: boolean;

  /**
   * Custom logger function
   */
  logger?: (message: string, data?: any) => void;
}

/**
 * Generic class for tracking promises with associated metadata
 */
export class PromiseTracker<M extends PromiseMetadata = PromiseMetadata> {
  private promises: Array<{
    promise: Promise<any>;
    metadata: M;
  }> = [];

  private options: PromiseTrackerOptions;

  constructor(options: PromiseTrackerOptions = {}) {
    this.options = {
      autoLog: false,
      logger: console.log,
      ...options,
    };
  }

  /**
   * Get count of tracked promises
   */
  get count(): number {
    return this.promises.length;
  }

  /**
   * Execute all tracked promises and return results with metadata
   */
  async execute(): Promise<TrackedResult<M>[]> {
    if (this.promises.length === 0) {
      return [];
    }

    const results = await Promise.allSettled(
      this.promises.map(p => p.promise),
    );

    const trackedResults = results.map((result, index) => {
      const tracked: TrackedResult<M> = {
        metadata: this.promises[index].metadata,
        status: result.status,
        success: result.status === 'fulfilled',
        ...(result.status === 'fulfilled'
          ? { value: result.value }
          : { reason: result.reason }
        ),
      };

      if (this.options.autoLog) {
        this.logResult(tracked);
      }

      return tracked;
    });

    // Clear promises after execution
    this.clear();

    return trackedResults;
  }

  /**
   * Add a promise to track
   */
  add(promise: Promise<any>, metadata: M): this {
    this.promises.push({ promise, metadata });
    return this;
  }


  /**
   * Clear all tracked promises without executing
   */
  clear(): void {
    this.promises = [];
  }

  /**
   * Log a single result
   */
  private logResult(result: TrackedResult<M>): void {
    if (!this.options.logger) return;

    const status = result.success ? '✓' : '✗';
    this.options.logger(
      `${status} Promise ${result.status}`,
      result.metadata,
    );
  }

}

/**
 * Utility class for analyzing tracked results
 */
export class TrackedResultsAnalyzer<M extends PromiseMetadata = PromiseMetadata> {
  constructor(private results: TrackedResult<M>[]) {}

  get successes(): TrackedResult<M>[] {
    return this.results.filter(r => r.success);
  }

  get failures(): TrackedResult<M>[] {
    return this.results.filter(r => !r.success);
  }

  get successCount(): number {
    return this.successes.length;
  }

  get failureCount(): number {
    return this.failures.length;
  }

  get totalCount(): number {
    return this.results.length;
  }

  get successRate(): number {
    if (this.totalCount === 0) return 0;
    return this.successCount / this.totalCount;
  }

  /**
   * Group results by a metadata property
   */
  groupBy<K extends keyof M>(key: K): Map<M[K], TrackedResult<M>[]> {
    const groups = new Map<M[K], TrackedResult<M>[]>();

    for (const result of this.results) {
      const groupKey = result.metadata[key];
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(result);
    }

    return groups;
  }

  /**
   * Generate a summary report
   */
  summary(): string {
    return `
Results Summary:
- Total: ${this.totalCount}
- Successes: ${this.successCount} (${(this.successRate * 100).toFixed(1)}%)
- Failures: ${this.failureCount}
    `.trim();
  }
}
