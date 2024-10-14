// @ts-expect-error No types
import jstat from 'jstat';

// Most of these helpers are coming from tachometer source code
// https://github.com/google/tachometer/blob/9c3ad697b27a85935c6c1bce987eedc51f507d35/src/stats.ts

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export type ConfidenceInterval = {
    low: number;
    high: number;
  };
  
  export type SummaryStats = {
    size: number;
    median: number;
    mean: number;
    meanCI: ConfidenceInterval;
    variance: number;
    standardDeviation: number;
    relativeStandardDeviation: number;
  };

function median(data: number[]): number {
  // https://jstat.github.io/all.html#percentile
  return jstat.percentile(data, 0.5);
}
function studenttInv(p: number, dof: number): number {
  // https://jstat.github.io/all.html#jStat.studentt.inv
  return jstat.studentt.inv(p, dof);
}

export function summaryStats(data: number[]): SummaryStats {
  const size = data.length;
  const sum = sumOf(data);
  const mean = sum / size;
  const squareResiduals = data.map((val) => (val - mean) ** 2);

  // n - 1 due to https://en.wikipedia.org/wiki/Bessel%27s_correction
  const variance = sumOf(squareResiduals) / (size - 1);
  const stdDev = Math.sqrt(variance);

  return {
    size,
    median: median(data),
    mean,
    meanCI: confidenceInterval95(
      samplingDistributionOfTheMean({ mean, variance }, size),
      size,
    ),
    variance,
    standardDeviation: stdDev,
    // aka coefficient of variation
    relativeStandardDeviation: stdDev / mean,
  };
}

type MeanAndVariance = { mean: number; variance: number };

/**
 * Compute a 95% confidence interval for the given distribution.
 */
function confidenceInterval95(
  { mean, variance }: MeanAndVariance,
  size: number,
) {
  // http://www.stat.yale.edu/Courses/1997-98/101/confint.htm
  const t = studenttInv(1 - 0.05 / 2, size - 1);
  const stdDev = Math.sqrt(variance);
  const margin = t * stdDev;
  return {
    low: mean - margin,
    high: mean + margin,
  };
}

function sumOf(data: number[]) {
  return data.reduce((acc, cur) => acc + cur);
}

export function computeDifference(a: SummaryStats, b: SummaryStats) {
  const meanA = samplingDistributionOfTheMean(a, a.size);
  const meanB = samplingDistributionOfTheMean(b, b.size);
  const diffAbs = samplingDistributionOfAbsoluteDifferenceOfMeans(meanA, meanB);
  const diffRel = samplingDistributionOfRelativeDifferenceOfMeans(meanA, meanB);

  // We're assuming sample sizes are equal. If they're not for some reason, be
  // conservative and use the smaller one for the t-distribution's degrees of
  // freedom (since that will lead to a wider confidence interval).
  const minSize = Math.min(a.size, b.size);
  return {
    absolute: confidenceInterval95(diffAbs, minSize),
    relative: confidenceInterval95(diffRel, minSize),
  };
}

export type Difference = {
    absolute: ConfidenceInterval;
    relative: ConfidenceInterval;
}

/**
 * Estimates the sampling distribution of the mean. This models the distribution
 * of the means that we would compute under repeated samples of the given size.
 */
function samplingDistributionOfTheMean(
  dist: MeanAndVariance,
  sampleSize: number,
) {
  // http://onlinestatbook.com/2/sampling_distributions/samp_dist_mean.html
  // http://www.stat.yale.edu/Courses/1997-98/101/sampmn.htm
  return {
    mean: dist.mean,
    // Error shrinks as sample size grows.
    variance: dist.variance / sampleSize,
  };
}

/**
 * Estimates the sampling distribution of the difference of means (b-a). This
 * models the distribution of the difference between two means that we would
 * compute under repeated samples under the given two sampling distributions of
 * means.
 */
function samplingDistributionOfAbsoluteDifferenceOfMeans(
  a: MeanAndVariance,
  b: MeanAndVariance,
) {
  // http://onlinestatbook.com/2/sampling_distributions/samplingdist_diff_means.html
  // http://www.stat.yale.edu/Courses/1997-98/101/meancomp.htm
  return {
    mean: b.mean - a.mean,
    // The error from both input sampling distributions of means accumulate.
    variance: a.variance + b.variance,
  };
}

/**
 * Estimates the sampling distribution of the relative difference of means
 * ((b-a)/a). This models the distribution of the relative difference between
 * two means that we would compute under repeated samples under the given two
 * sampling distributions of means.
 */
function samplingDistributionOfRelativeDifferenceOfMeans(
  a: MeanAndVariance,
  b: MeanAndVariance,
) {
  // http://blog.analytics-toolkit.com/2018/confidence-intervals-p-values-percent-change-relative-difference/
  // Note that the above article also prevents an alternative calculation for a
  // confidence interval for relative differences, but the one chosen here is
  // is much simpler and passes our stochastic tests, so it seems sufficient.
  return {
    mean: (b.mean - a.mean) / a.mean,
    variance:
      (a.variance * b.mean ** 2 + b.variance * a.mean ** 2) / a.mean ** 4,
  };
}
