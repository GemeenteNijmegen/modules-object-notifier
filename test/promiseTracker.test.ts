import {
  PromiseTracker,
  TrackedResultsAnalyzer,
  PromiseMetadata,
  TrackedResult,
} from '../src/PromiseTracker';

// Test helpers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createSuccessPromise = <T>(value: T, delayMs = 0): Promise<T> =>
  delay(delayMs).then(() => value);

const createFailurePromise = (reason: string, delayMs = 0): Promise<never> =>
  delay(delayMs).then(() => Promise.reject(new Error(reason)));

interface TestMetadata extends PromiseMetadata {
  id: string;
  type: string;
}

describe('PromiseTracker', () => {
  describe('Basic functionality', () => {
    it('should create an empty tracker', () => {
      const tracker = new PromiseTracker();
      expect(tracker.count).toBe(0);
    });

    it('should add promises and track count', () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker.add(createSuccessPromise('test1'), { id: '1', type: 'test' });
      expect(tracker.count).toBe(1);

      tracker.add(createSuccessPromise('test2'), { id: '2', type: 'test' });
      expect(tracker.count).toBe(2);
    });

    it('should support method chaining', () => {
      const tracker = new PromiseTracker<TestMetadata>();

      const result = tracker
        .add(createSuccessPromise('test1'), { id: '1', type: 'test' })
        .add(createSuccessPromise('test2'), { id: '2', type: 'test' });

      expect(result).toBe(tracker);
      expect(tracker.count).toBe(2);
    });

    it('should clear promises without executing', () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker.add(createSuccessPromise('test'), { id: '1', type: 'test' });
      expect(tracker.count).toBe(1);

      tracker.clear();
      expect(tracker.count).toBe(0);
    });

    it('should reset count after execution', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker.add(createSuccessPromise('test'), { id: '1', type: 'test' });
      expect(tracker.count).toBe(1);

      await tracker.execute();
      expect(tracker.count).toBe(0);
    });
  });

  describe('Execute with successes', () => {
    it('should execute a single successful promise', async () => {
      const tracker = new PromiseTracker<TestMetadata>();
      const metadata = { id: '1', type: 'user' };

      tracker.add(createSuccessPromise('success'), metadata);

      const results = await tracker.execute();

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        metadata,
        status: 'fulfilled',
        success: true,
        value: 'success',
      });
    });

    it('should execute multiple successful promises', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker
        .add(createSuccessPromise('result1'), { id: '1', type: 'user' })
        .add(createSuccessPromise('result2'), { id: '2', type: 'admin' })
        .add(createSuccessPromise('result3'), { id: '3', type: 'user' });

      const results = await tracker.execute();

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.map(r => r.value)).toEqual(['result1', 'result2', 'result3']);
    });

    it.each([
      { count: 0, description: 'zero promises' },
      { count: 1, description: 'one promise' },
      { count: 5, description: 'five promises' },
      { count: 10, description: 'ten promises' },
    ])('should handle $description correctly', async ({ count }) => {
      const tracker = new PromiseTracker<TestMetadata>();

      for (let i = 0; i < count; i++) {
        tracker.add(
          createSuccessPromise(`result${i}`),
          { id: String(i), type: 'test' },
        );
      }

      const results = await tracker.execute();
      expect(results).toHaveLength(count);
    });
  });

  describe('Execute with failures', () => {
    it('should execute a single failed promise', async () => {
      const tracker = new PromiseTracker<TestMetadata>();
      const metadata = { id: '1', type: 'user' };

      tracker.add(createFailurePromise('Test error'), metadata);

      const results = await tracker.execute();

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        metadata,
        status: 'rejected',
        success: false,
      });
      expect(results[0].reason).toBeInstanceOf(Error);
      expect(results[0].reason.message).toBe('Test error');
    });

    it('should execute multiple failed promises', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker
        .add(createFailurePromise('Error 1'), { id: '1', type: 'user' })
        .add(createFailurePromise('Error 2'), { id: '2', type: 'admin' })
        .add(createFailurePromise('Error 3'), { id: '3', type: 'user' });

      const results = await tracker.execute();

      expect(results).toHaveLength(3);
      expect(results.every(r => !r.success)).toBe(true);
      expect(results.map(r => r.reason.message)).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });
  });

  describe('Execute with mixed results', () => {
    it('should handle mixed success and failure', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker
        .add(createSuccessPromise('success1'), { id: '1', type: 'user' })
        .add(createFailurePromise('error1'), { id: '2', type: 'admin' })
        .add(createSuccessPromise('success2'), { id: '3', type: 'user' })
        .add(createFailurePromise('error2'), { id: '4', type: 'admin' });

      const results = await tracker.execute();

      expect(results).toHaveLength(4);
      expect(results.filter(r => r.success)).toHaveLength(2);
      expect(results.filter(r => !r.success)).toHaveLength(2);
    });

    it.each([
      { successes: 3, failures: 1 },
      { successes: 1, failures: 3 },
      { successes: 2, failures: 2 },
      { successes: 5, failures: 0 },
      { successes: 0, failures: 5 },
    ])('should handle $successes successes and $failures failures', async ({ successes, failures }) => {
      const tracker = new PromiseTracker<TestMetadata>();

      for (let i = 0; i < successes; i++) {
        tracker.add(
          createSuccessPromise(`success${i}`),
          { id: `s${i}`, type: 'success' },
        );
      }

      for (let i = 0; i < failures; i++) {
        tracker.add(
          createFailurePromise(`error${i}`),
          { id: `f${i}`, type: 'failure' },
        );
      }

      const results = await tracker.execute();

      expect(results).toHaveLength(successes + failures);
      expect(results.filter(r => r.success)).toHaveLength(successes);
      expect(results.filter(r => !r.success)).toHaveLength(failures);
    });
  });

  describe('Metadata preservation', () => {
    it('should preserve simple metadata', async () => {
      const tracker = new PromiseTracker<TestMetadata>();
      const metadata = { id: 'test-123', type: 'user' };

      tracker.add(createSuccessPromise('result'), metadata);
      const results = await tracker.execute();

      expect(results[0].metadata).toEqual(metadata);
    });

    it('should preserve complex metadata', async () => {
      interface ComplexMetadata extends PromiseMetadata {
        id: string;
        nested: {
          level1: {
            level2: string;
          };
        };
        array: number[];
      }

      const tracker = new PromiseTracker<ComplexMetadata>();
      const metadata: ComplexMetadata = {
        id: 'complex',
        nested: {
          level1: {
            level2: 'deep value',
          },
        },
        array: [1, 2, 3],
      };

      tracker.add(createSuccessPromise('result'), metadata);
      const results = await tracker.execute();

      expect(results[0].metadata).toEqual(metadata);
    });

    it('should maintain separate metadata for each promise', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      const metadata1 = { id: '1', type: 'user' };
      const metadata2 = { id: '2', type: 'admin' };
      const metadata3 = { id: '3', type: 'guest' };

      tracker
        .add(createSuccessPromise('r1'), metadata1)
        .add(createSuccessPromise('r2'), metadata2)
        .add(createSuccessPromise('r3'), metadata3);

      const results = await tracker.execute();

      expect(results[0].metadata).toEqual(metadata1);
      expect(results[1].metadata).toEqual(metadata2);
      expect(results[2].metadata).toEqual(metadata3);
    });
  });

  describe('Options and configuration', () => {
    it('should use default options when none provided', () => {
      const tracker = new PromiseTracker();
      expect(tracker).toBeDefined();
    });

    it('should call logger when autoLog is enabled', async () => {
      const mockLogger = jest.fn();
      const tracker = new PromiseTracker<TestMetadata>({
        autoLog: true,
        logger: mockLogger,
      });

      tracker.add(createSuccessPromise('result'), { id: '1', type: 'test' });
      await tracker.execute();

      expect(mockLogger).toHaveBeenCalledTimes(1);
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('fulfilled'),
        expect.objectContaining({ id: '1', type: 'test' }),
      );
    });

    it('should not call logger when autoLog is disabled', async () => {
      const mockLogger = jest.fn();
      const tracker = new PromiseTracker<TestMetadata>({
        autoLog: false,
        logger: mockLogger,
      });

      tracker.add(createSuccessPromise('result'), { id: '1', type: 'test' });
      await tracker.execute();

      expect(mockLogger).not.toHaveBeenCalled();
    });

    it('should log both successes and failures', async () => {
      const mockLogger = jest.fn();
      const tracker = new PromiseTracker<TestMetadata>({
        autoLog: true,
        logger: mockLogger,
      });

      tracker
        .add(createSuccessPromise('success'), { id: '1', type: 'test' })
        .add(createFailurePromise('error'), { id: '2', type: 'test' });

      await tracker.execute();

      expect(mockLogger).toHaveBeenCalledTimes(2);
    });
  });

  describe('Async behavior', () => {
    it('should wait for all promises to complete', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker
        .add(createSuccessPromise('fast', 10), { id: '1', type: 'fast' })
        .add(createSuccessPromise('slow', 100), { id: '2', type: 'slow' })
        .add(createSuccessPromise('medium', 50), { id: '3', type: 'medium' });

      const startTime = Date.now();
      const results = await tracker.execute();
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(90); // Should wait for slowest
    });

    it('should not block on failed promises', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker
        .add(createFailurePromise('quick-fail', 10), { id: '1', type: 'fail' })
        .add(createSuccessPromise('slow-success', 100), { id: '2', type: 'success' });

      const startTime = Date.now();
      const results = await tracker.execute();
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(2);
      expect(duration).toBeGreaterThanOrEqual(90); // Should still wait for slow success
    });
  });
});

describe('TrackedResultsAnalyzer', () => {
  let mixedResults: TrackedResult<TestMetadata>[];

  beforeEach(() => {
    mixedResults = [
      {
        metadata: { id: '1', type: 'email' },
        status: 'fulfilled',
        success: true,
        value: 'sent1',
      },
      {
        metadata: { id: '2', type: 'sms' },
        status: 'rejected',
        success: false,
        reason: new Error('Failed to send'),
      },
      {
        metadata: { id: '3', type: 'email' },
        status: 'fulfilled',
        success: true,
        value: 'sent2',
      },
      {
        metadata: { id: '4', type: 'email' },
        status: 'rejected',
        success: false,
        reason: new Error('Invalid recipient'),
      },
      {
        metadata: { id: '5', type: 'sms' },
        status: 'fulfilled',
        success: true,
        value: 'sent3',
      },
    ];
  });

  describe('Basic analysis', () => {
    it('should count successes correctly', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      expect(analyzer.successCount).toBe(3);
      expect(analyzer.successes).toHaveLength(3);
    });

    it('should count failures correctly', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      expect(analyzer.failureCount).toBe(2);
      expect(analyzer.failures).toHaveLength(2);
    });

    it('should count total correctly', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      expect(analyzer.totalCount).toBe(5);
    });

    it('should calculate success rate', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      expect(analyzer.successRate).toBeCloseTo(0.6, 2);
    });

    it('should handle empty results', () => {
      const analyzer = new TrackedResultsAnalyzer([]);
      expect(analyzer.successCount).toBe(0);
      expect(analyzer.failureCount).toBe(0);
      expect(analyzer.totalCount).toBe(0);
      expect(analyzer.successRate).toBe(0);
    });

    it.each([
      { successes: 5, failures: 0, expectedRate: 1.0 },
      { successes: 0, failures: 5, expectedRate: 0.0 },
      { successes: 3, failures: 2, expectedRate: 0.6 },
      { successes: 1, failures: 9, expectedRate: 0.1 },
    ])('should calculate success rate for $successes/$failures', ({ successes, failures, expectedRate }) => {
      const results: TrackedResult<TestMetadata>[] = [
        ...Array(successes).fill(null).map((_, i) => ({
          metadata: { id: `s${i}`, type: 'success' },
          status: 'fulfilled' as const,
          success: true,
          value: 'ok',
        })),
        ...Array(failures).fill(null).map((_, i) => ({
          metadata: { id: `f${i}`, type: 'failure' },
          status: 'rejected' as const,
          success: false,
          reason: new Error('fail'),
        })),
      ];

      const analyzer = new TrackedResultsAnalyzer(results);
      expect(analyzer.successRate).toBeCloseTo(expectedRate, 2);
    });
  });

  describe('Grouping', () => {
    it('should group by metadata property', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      const grouped = analyzer.groupBy('type');

      expect(grouped.size).toBe(2);
      expect(grouped.get('email')).toHaveLength(3);
      expect(grouped.get('sms')).toHaveLength(2);
    });

    it('should maintain result details in groups', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      const grouped = analyzer.groupBy('type');

      const emailGroup = grouped.get('email')!;
      expect(emailGroup.filter(r => r.success)).toHaveLength(2);
      expect(emailGroup.filter(r => !r.success)).toHaveLength(1);
    });

    it('should handle grouping with single group', () => {
      const singleTypeResults: TrackedResult<TestMetadata>[] = [
        { metadata: { id: '1', type: 'email' }, status: 'fulfilled', success: true, value: 'ok' },
        { metadata: { id: '2', type: 'email' }, status: 'fulfilled', success: true, value: 'ok' },
      ];

      const analyzer = new TrackedResultsAnalyzer(singleTypeResults);
      const grouped = analyzer.groupBy('type');

      expect(grouped.size).toBe(1);
      expect(grouped.get('email')).toHaveLength(2);
    });

    it('should be able to get all group keys', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      const grouped = analyzer.groupBy('type');

      expect(grouped.size).toBe(2);
      expect([...grouped.keys()]).toEqual(['email', 'sms']);
    });
  });

  describe('Summary', () => {
    it('should generate summary string', () => {
      const analyzer = new TrackedResultsAnalyzer(mixedResults);
      const summary = analyzer.summary();

      expect(summary).toContain('Total: 5');
      expect(summary).toContain('Successes: 3');
      expect(summary).toContain('60.0%');
      expect(summary).toContain('Failures: 2');
    });

    it('should handle 100% success', () => {
      const allSuccess: TrackedResult<TestMetadata>[] = [
        { metadata: { id: '1', type: 'test' }, status: 'fulfilled', success: true, value: 'ok' },
        { metadata: { id: '2', type: 'test' }, status: 'fulfilled', success: true, value: 'ok' },
      ];

      const analyzer = new TrackedResultsAnalyzer(allSuccess);
      const summary = analyzer.summary();

      expect(summary).toContain('100.0%');
    });

    it('should handle 0% success', () => {
      const allFailure: TrackedResult<TestMetadata>[] = [
        { metadata: { id: '1', type: 'test' }, status: 'rejected', success: false, reason: new Error('fail') },
        { metadata: { id: '2', type: 'test' }, status: 'rejected', success: false, reason: new Error('fail') },
      ];

      const analyzer = new TrackedResultsAnalyzer(allFailure);
      const summary = analyzer.summary();

      expect(summary).toContain('0.0%');
    });
  });

  describe('Integration with PromiseTracker', () => {
    it('should analyze results from tracker execution', async () => {
      const tracker = new PromiseTracker<TestMetadata>();

      tracker
        .add(createSuccessPromise('result1'), { id: '1', type: 'email' })
        .add(createFailurePromise('error1'), { id: '2', type: 'sms' })
        .add(createSuccessPromise('result2'), { id: '3', type: 'email' });

      const results = await tracker.execute();
      const analyzer = new TrackedResultsAnalyzer(results);

      expect(analyzer.totalCount).toBe(3);
      expect(analyzer.successCount).toBe(2);
      expect(analyzer.failureCount).toBe(1);
    });
  });
});
