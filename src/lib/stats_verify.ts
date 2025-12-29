import { standardDeviation, independentTTest, pairedTTest } from "./stats";

/**
 * Benchmark cases
 */

function assertEquals(actual: number, expected: number, epsilon: number, name: string) {
  if (Math.abs(actual - expected) < epsilon) {
    console.log(`✅ ${name}: ${actual.toFixed(4)} (Expected ${expected.toFixed(4)})`);
  } else {
    console.error(`❌ ${name}: ${actual.toFixed(4)} (Expected ${expected.toFixed(4)})`);
  }
}

console.log("--- Testing Sample Standard Deviation ---");
const data1 = [2, 4, 4, 4, 5, 5, 7, 9];
// Population SD: 2.0
// Sample SD: 2.138 (sqrt(32/7))
assertEquals(standardDeviation(data1), 2.138089935, 1e-6, "Sample SD");

console.log("\n--- Testing Independent T-Test (Welch's) ---");
// Group 1: [1, 2, 3, 4, 5] (mean=3, var=2.5)
// Group 2: [2, 4, 6, 8] (mean=5, var=6.666...)
const group1 = [1, 2, 3, 4, 5];
const group2 = [2, 4, 6, 8];
const result = independentTTest(group1, group2);
if (result) {
  // Manual/Online Calc: t = -1.3587, df = 4.7494
  // p-value (two-tailed) = 0.2352
  // p-value (lower-tail) = 0.1176
  assertEquals(result.t, -1.3587, 1e-4, "Independent T (t)");
  assertEquals(result.df, 4.7494, 1e-4, "Independent T (df)");
  assertEquals(result.pValue, 0.2352, 1e-3, "Independent T (p-value)");
  assertEquals(result.pValueLowerTail, 0.1176, 1e-3, "Independent T (lower p-value)");
}

console.log("\n--- Testing Paired T-Test ---");
// Before: [1, 2, 3, 4, 5]
// After: [2, 4, 6, 8, 10]
const before = [1, 2, 3, 4, 5];
const after = [2, 4, 6, 8, 10];
const pResult = pairedTTest(before, after);
if (pResult) {
  assertEquals(pResult.t, -4.2426, 1e-4, "Paired T (t)");
  assertEquals(pResult.df, 4, 1e-4, "Paired T (df)");
  assertEquals(pResult.pValue, 0.01324, 1e-4, "Paired T (p-value)");
}
