import type { Musician } from '../types/supabase';

export interface PerformanceBenchmark {
  operation: string;
  datasetSize: number;
  executionTime: number;
  memoryUsage: number;
  success: boolean;
  error?: string;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

export interface PerformanceComparison {
  standard: PerformanceBenchmark;
  optimized: PerformanceBenchmark;
  improvement: {
    timeReduction: number; // percentage
    memoryReduction: number; // percentage
    speedup: number; // factor
  };
}

/**
 * Generate test dataset of musicians for performance testing
 */
export function generateTestMusicians(count: number): Musician[] {
  const instruments = [
    'Guitar',
    'Piano',
    'Drums',
    'Bass',
    'Violin',
    'Saxophone',
    'Trumpet',
    'Flute',
  ];
  const phoneFormats = [
    // Valid formats
    (i: number) => `555${String(i).padStart(7, '0')}`,
    (i: number) => `(555) ${String(i).slice(0, 3)}-${String(i).slice(3, 7)}`,
    (i: number) => `555-${String(i).slice(0, 3)}-${String(i).slice(3, 7)}`,
    (i: number) => `555.${String(i).slice(0, 3)}.${String(i).slice(3, 7)}`,
    (i: number) => `+1555${String(i).padStart(7, '0')}`,
    // Invalid formats (10% of the time)
    () => null,
    () => '123',
    () => '555-short',
  ];

  return Array.from({ length: count }, (_, i) => {
    const formatIndex =
      i % 10 < 2
        ? Math.floor(Math.random() * 3) + 5
        : Math.floor(Math.random() * 5);
    const phone = phoneFormats[formatIndex](i);

    return {
      id: `musician-${i}`,
      name: `Musician ${i}`,
      instrument: instruments[i % instruments.length],
      phone,
    };
  });
}

/**
 * Generate selection sets of various sizes for testing
 */
export function generateTestSelections(musicians: Musician[]): {
  small: Set<string>;
  medium: Set<string>;
  large: Set<string>;
  massive: Set<string>;
} {
  const total = musicians.length;

  return {
    small: new Set(musicians.slice(0, Math.min(10, total)).map(m => m.id)),
    medium: new Set(musicians.slice(0, Math.min(100, total)).map(m => m.id)),
    large: new Set(musicians.slice(0, Math.min(1000, total)).map(m => m.id)),
    massive: new Set(musicians.slice(0, total).map(m => m.id)),
  };
}

/**
 * Measure memory usage before and after an operation
 */
function measureMemory(): number {
  if ('memory' in performance && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
  }
  return 0;
}

/**
 * Force garbage collection if available (for testing purposes)
 */
function forceGC() {
  if ('gc' in global && typeof (global as any).gc === 'function') {
    (global as any).gc();
  }
}

/**
 * Run a function multiple times and collect performance metrics
 */
async function benchmarkFunction<T>(
  fn: () => Promise<T> | T,
  iterations: number = 5,
  warmup: number = 2
): Promise<{
  results: T[];
  times: number[];
  averageTime: number;
  minTime: number;
  maxTime: number;
  memoryBefore: number;
  memoryAfter: number;
}> {
  // Warmup runs
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  forceGC();
  const memoryBefore = measureMemory();

  const times: number[] = [];
  const results: T[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    times.push(end - start);
    results.push(result);
  }

  forceGC();
  const memoryAfter = measureMemory();

  return {
    results,
    times,
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    memoryBefore,
    memoryAfter,
  };
}

/**
 * Benchmark selection operation performance
 */
export async function benchmarkSelection(
  musicians: Musician[],
  selectedIds: Set<string>,
  iterations: number = 10
): Promise<PerformanceBenchmark> {
  try {
    const benchmark = await benchmarkFunction(() => {
      // Simulate the selection filtering operation
      return musicians.filter(musician => selectedIds.has(musician.id));
    }, iterations);

    return {
      operation: 'selection',
      datasetSize: musicians.length,
      executionTime: benchmark.averageTime,
      memoryUsage: benchmark.memoryAfter - benchmark.memoryBefore,
      success: true,
      iterations,
      averageTime: benchmark.averageTime,
      minTime: benchmark.minTime,
      maxTime: benchmark.maxTime,
    };
  } catch (error) {
    return {
      operation: 'selection',
      datasetSize: musicians.length,
      executionTime: 0,
      memoryUsage: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      iterations,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
    };
  }
}

/**
 * Benchmark optimized selection with Map lookup
 */
export async function benchmarkOptimizedSelection(
  musicians: Musician[],
  selectedIds: Set<string>,
  iterations: number = 10
): Promise<PerformanceBenchmark> {
  try {
    const benchmark = await benchmarkFunction(() => {
      // Create Map lookup
      const lookup = new Map<string, Musician>();
      musicians.forEach(musician => {
        lookup.set(musician.id, musician);
      });

      // Use Map for O(1) lookups
      const result: Musician[] = [];
      selectedIds.forEach(id => {
        const musician = lookup.get(id);
        if (musician) {
          result.push(musician);
        }
      });

      return result;
    }, iterations);

    return {
      operation: 'optimized-selection',
      datasetSize: musicians.length,
      executionTime: benchmark.averageTime,
      memoryUsage: benchmark.memoryAfter - benchmark.memoryBefore,
      success: true,
      iterations,
      averageTime: benchmark.averageTime,
      minTime: benchmark.minTime,
      maxTime: benchmark.maxTime,
    };
  } catch (error) {
    return {
      operation: 'optimized-selection',
      datasetSize: musicians.length,
      executionTime: 0,
      memoryUsage: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      iterations,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
    };
  }
}

/**
 * Benchmark phone formatting performance
 */
export async function benchmarkPhoneFormatting(
  musicians: Musician[],
  iterations: number = 10
): Promise<PerformanceBenchmark> {
  try {
    const { formatPhoneNumbersFromObjects } = await import('./phoneFormatter');

    const benchmark = await benchmarkFunction(() => {
      return formatPhoneNumbersFromObjects(musicians);
    }, iterations);

    return {
      operation: 'phone-formatting',
      datasetSize: musicians.length,
      executionTime: benchmark.averageTime,
      memoryUsage: benchmark.memoryAfter - benchmark.memoryBefore,
      success: true,
      iterations,
      averageTime: benchmark.averageTime,
      minTime: benchmark.minTime,
      maxTime: benchmark.maxTime,
    };
  } catch (error) {
    return {
      operation: 'phone-formatting',
      datasetSize: musicians.length,
      executionTime: 0,
      memoryUsage: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      iterations,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
    };
  }
}

/**
 * Benchmark chunked phone formatting performance
 */
export async function benchmarkChunkedPhoneFormatting(
  musicians: Musician[],
  chunkSize: number = 100,
  iterations: number = 10
): Promise<PerformanceBenchmark> {
  try {
    const { formatPhoneNumbersFromObjects } = await import('./phoneFormatter');

    const benchmark = await benchmarkFunction(() => {
      // Process in chunks
      const chunks: Musician[][] = [];
      for (let i = 0; i < musicians.length; i += chunkSize) {
        chunks.push(musicians.slice(i, i + chunkSize));
      }

      let combinedResult = '';
      chunks.forEach((chunk, index) => {
        const chunkFormatted = formatPhoneNumbersFromObjects(chunk, {
          separator: index === chunks.length - 1 ? '' : ', ',
        });

        if (chunkFormatted) {
          combinedResult +=
            (combinedResult && index > 0 ? ', ' : '') + chunkFormatted;
        }
      });

      return combinedResult;
    }, iterations);

    return {
      operation: 'chunked-phone-formatting',
      datasetSize: musicians.length,
      executionTime: benchmark.averageTime,
      memoryUsage: benchmark.memoryAfter - benchmark.memoryBefore,
      success: true,
      iterations,
      averageTime: benchmark.averageTime,
      minTime: benchmark.minTime,
      maxTime: benchmark.maxTime,
    };
  } catch (error) {
    return {
      operation: 'chunked-phone-formatting',
      datasetSize: musicians.length,
      executionTime: 0,
      memoryUsage: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      iterations,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
    };
  }
}

/**
 * Compare performance between standard and optimized implementations
 */
export function comparePerformance(
  standard: PerformanceBenchmark,
  optimized: PerformanceBenchmark
): PerformanceComparison {
  const timeReduction =
    standard.executionTime > 0
      ? ((standard.executionTime - optimized.executionTime) /
          standard.executionTime) *
        100
      : 0;

  const memoryReduction =
    standard.memoryUsage > 0
      ? ((standard.memoryUsage - optimized.memoryUsage) /
          standard.memoryUsage) *
        100
      : 0;

  const speedup =
    optimized.executionTime > 0
      ? standard.executionTime / optimized.executionTime
      : 1;

  return {
    standard,
    optimized,
    improvement: {
      timeReduction,
      memoryReduction,
      speedup,
    },
  };
}

/**
 * Run comprehensive performance test suite
 */
export async function runPerformanceTestSuite(
  dataSizes: number[] = [100, 500, 1000, 5000, 10000]
): Promise<{
  selectionTests: PerformanceComparison[];
  formattingTests: PerformanceComparison[];
  summary: {
    averageSpeedup: number;
    maxSpeedup: number;
    averageMemoryReduction: number;
    recommendedThresholds: {
      useOptimizedSelection: number;
      useChunkedFormatting: number;
    };
  };
}> {
  console.log('Starting performance test suite...');

  const selectionTests: PerformanceComparison[] = [];
  const formattingTests: PerformanceComparison[] = [];

  for (const size of dataSizes) {
    console.log(`Testing with ${size} musicians...`);

    const musicians = generateTestMusicians(size);
    const selections = generateTestSelections(musicians);

    // Test selection performance
    const standardSelection = await benchmarkSelection(
      musicians,
      selections.large
    );
    const optimizedSelection = await benchmarkOptimizedSelection(
      musicians,
      selections.large
    );
    selectionTests.push(
      comparePerformance(standardSelection, optimizedSelection)
    );

    // Test formatting performance
    const standardFormatting = await benchmarkPhoneFormatting(musicians);
    const chunkedFormatting = await benchmarkChunkedPhoneFormatting(musicians);
    formattingTests.push(
      comparePerformance(standardFormatting, chunkedFormatting)
    );
  }

  // Calculate summary statistics
  const selectionSpeedups = selectionTests.map(t => t.improvement.speedup);
  const formattingSpeedups = formattingTests.map(t => t.improvement.speedup);
  const allSpeedups = [...selectionSpeedups, ...formattingSpeedups];

  const memoryReductions = [
    ...selectionTests.map(t => t.improvement.memoryReduction),
    ...formattingTests.map(t => t.improvement.memoryReduction),
  ].filter(r => r > 0);

  const summary = {
    averageSpeedup:
      allSpeedups.reduce((sum, s) => sum + s, 0) / allSpeedups.length,
    maxSpeedup: Math.max(...allSpeedups),
    averageMemoryReduction:
      memoryReductions.length > 0
        ? memoryReductions.reduce((sum, r) => sum + r, 0) /
          memoryReductions.length
        : 0,
    recommendedThresholds: {
      useOptimizedSelection: findOptimalThreshold(selectionTests, 1.2), // 20% improvement
      useChunkedFormatting: findOptimalThreshold(formattingTests, 1.1), // 10% improvement
    },
  };

  console.log('Performance test suite completed:', summary);

  return {
    selectionTests,
    formattingTests,
    summary,
  };
}

/**
 * Find the optimal threshold where optimizations start providing significant benefits
 */
function findOptimalThreshold(
  comparisons: PerformanceComparison[],
  minSpeedup: number
): number {
  for (const comparison of comparisons) {
    if (comparison.improvement.speedup >= minSpeedup) {
      return comparison.standard.datasetSize;
    }
  }
  return comparisons[0]?.standard.datasetSize || 100;
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(testResults: {
  selectionTests: PerformanceComparison[];
  formattingTests: PerformanceComparison[];
  summary: any;
}): string {
  const { selectionTests, formattingTests, summary } = testResults;

  let report = '# Clipboard Performance Optimization Report\n\n';

  report += '## Summary\n';
  report += `- Average Speedup: ${summary.averageSpeedup.toFixed(2)}x\n`;
  report += `- Maximum Speedup: ${summary.maxSpeedup.toFixed(2)}x\n`;
  report += `- Average Memory Reduction: ${summary.averageMemoryReduction.toFixed(2)}%\n`;
  report += `- Recommended Selection Optimization Threshold: ${summary.recommendedThresholds.useOptimizedSelection} musicians\n`;
  report += `- Recommended Chunking Threshold: ${summary.recommendedThresholds.useChunkedFormatting} musicians\n\n`;

  report += '## Selection Performance Tests\n';
  report +=
    '| Dataset Size | Standard (ms) | Optimized (ms) | Speedup | Memory Reduction |\n';
  report +=
    '|--------------|---------------|----------------|---------|------------------|\n';

  selectionTests.forEach(test => {
    report += `| ${test.standard.datasetSize} | ${test.standard.executionTime.toFixed(2)} | ${test.optimized.executionTime.toFixed(2)} | ${test.improvement.speedup.toFixed(2)}x | ${test.improvement.memoryReduction.toFixed(2)}% |\n`;
  });

  report += '\n## Formatting Performance Tests\n';
  report +=
    '| Dataset Size | Standard (ms) | Chunked (ms) | Speedup | Memory Reduction |\n';
  report +=
    '|--------------|---------------|--------------|---------|------------------|\n';

  formattingTests.forEach(test => {
    report += `| ${test.standard.datasetSize} | ${test.standard.executionTime.toFixed(2)} | ${test.optimized.executionTime.toFixed(2)} | ${test.improvement.speedup.toFixed(2)}x | ${test.improvement.memoryReduction.toFixed(2)}% |\n`;
  });

  report += '\n## Recommendations\n';
  report +=
    '1. Use optimized selection (Map lookup) for datasets with 50+ musicians\n';
  report += '2. Use chunked processing for formatting 100+ musicians\n';
  report +=
    '3. Enable performance monitoring in development for large datasets\n';
  report += '4. Consider virtual scrolling for UI with 1000+ musicians\n';

  return report;
}
