// Statistical utility functions for admin dashboard

/**
 * Calculate mean of an array of numbers
 */
export function mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(arr: number[]): number {
    if (arr.length === 0) return 0;
    const avg = mean(arr);
    const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
    return Math.sqrt(mean(squareDiffs));
}

/**
 * Paired t-test for within-subject comparison
 * Returns t-statistic, degrees of freedom, and p-value
 */
export function pairedTTest(
    arr1: number[],
    arr2: number[]
): { t: number; df: number; pValue: number } | null {
    if (arr1.length !== arr2.length || arr1.length < 2) {
        return null;
    }

    const n = arr1.length;
    const differences = arr1.map((val, i) => val - arr2[i]);
    const meanDiff = mean(differences);
    const sdDiff = standardDeviation(differences);
    const seMean = sdDiff / Math.sqrt(n);

    if (seMean === 0) {
        return { t: 0, df: n - 1, pValue: 1 };
    }

    const t = meanDiff / seMean;
    const df = n - 1;

    // Calculate p-value using t-distribution approximation
    // Using the beta function approximation for the t-distribution CDF
    const pValue = 2 * (1 - tDistCDF(Math.abs(t), df));

    return { t, df, pValue };
}

/**
 * Approximation of the t-distribution CDF using the regularized incomplete beta function
 */
function tDistCDF(t: number, df: number): number {
    const x = df / (df + t * t);
    return 1 - 0.5 * incompleteBeta(x, df / 2, 0.5);
}

/**
 * Regularized incomplete beta function approximation
 */
function incompleteBeta(x: number, a: number, b: number): number {
    // Use continued fraction approximation
    if (x === 0) return 0;
    if (x === 1) return 1;

    const bt =
        Math.exp(
            logGamma(a + b) -
            logGamma(a) -
            logGamma(b) +
            a * Math.log(x) +
            b * Math.log(1 - x)
        );

    if (x < (a + 1) / (a + b + 2)) {
        return (bt * betaCF(x, a, b)) / a;
    } else {
        return 1 - (bt * betaCF(1 - x, b, a)) / b;
    }
}

/**
 * Continued fraction for incomplete beta function
 */
function betaCF(x: number, a: number, b: number): number {
    const maxIterations = 100;
    const epsilon = 1e-10;

    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < epsilon) d = epsilon;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIterations; m++) {
        const m2 = 2 * m;

        // Even step
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < epsilon) d = epsilon;
        c = 1 + aa / c;
        if (Math.abs(c) < epsilon) c = epsilon;
        d = 1 / d;
        h *= d * c;

        // Odd step
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < epsilon) d = epsilon;
        c = 1 + aa / c;
        if (Math.abs(c) < epsilon) c = epsilon;
        d = 1 / d;
        const del = d * c;
        h *= del;

        if (Math.abs(del - 1) < epsilon) break;
    }

    return h;
}

/**
 * Log gamma function approximation (Lanczos)
 */
function logGamma(x: number): number {
    const g = 7;
    const c = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];

    if (x < 0.5) {
        return (
            Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
        );
    }

    x -= 1;
    let a = c[0];
    for (let i = 1; i < g + 2; i++) {
        a += c[i] / (x + i);
    }
    const t = x + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Simple linear regression
 * Returns slope, intercept, r-squared, and p-value for slope
 */
export function linearRegression(
    x: number[],
    y: number[]
): {
    slope: number;
    intercept: number;
    rSquared: number;
    pValue: number;
} | null {
    if (x.length !== y.length || x.length < 3) {
        return null;
    }

    const n = x.length;
    const xMean = mean(x);
    const yMean = mean(y);

    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (let i = 0; i < n; i++) {
        const xDiff = x[i] - xMean;
        const yDiff = y[i] - yMean;
        sumXY += xDiff * yDiff;
        sumXX += xDiff * xDiff;
        sumYY += yDiff * yDiff;
    }

    if (sumXX === 0) {
        return null;
    }

    const slope = sumXY / sumXX;
    const intercept = yMean - slope * xMean;
    const rSquared = sumYY === 0 ? 0 : (sumXY * sumXY) / (sumXX * sumYY);

    // Calculate standard error of slope and t-statistic
    const yPredicted = x.map((xi) => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - yPredicted[i]);
    const sse = residuals.reduce((sum, r) => sum + r * r, 0);
    const mse = sse / (n - 2);
    const seSlope = Math.sqrt(mse / sumXX);

    if (seSlope === 0) {
        return { slope, intercept, rSquared, pValue: 1 };
    }

    const tStat = slope / seSlope;
    const df = n - 2;
    const pValue = 2 * (1 - tDistCDF(Math.abs(tStat), df));

    return { slope, intercept, rSquared, pValue };
}
