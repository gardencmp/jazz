import { ConfidenceInterval, Difference } from './stats';

export function formatConfidenceInterval(
  ci: ConfidenceInterval,
  format: (n: number) => string,
) {
  if (ci.low == null || isNaN(ci.low)) return `∞ - ∞`;
  return `${format(ci.low)} - ${format(ci.high)}`;
}

const colorizeSign = (n: number, format: (n: number) => string) => {
  if (n > 0) {
    return `+${format(n)}`;
  } else if (n < 0) {
    // Negate the value so that we don't get a double negative sign.
    return `-${format(-n)}`;
  } else {
    return format(n);
  }
};

export function percent(n: number) {
  return (n * 100).toFixed(0) + '%';
}

export function formatTime(n: number) {
  if (n > 1000) return (n / 1000).toFixed(2) + 's';

  return n.toFixed(0) + 'ms';
}

function negate(ci: ConfidenceInterval): ConfidenceInterval {
  return {
    low: -ci.high,
    high: -ci.low,
  };
}

export function formatDifference({ absolute, relative }: Difference) {
  let word: string, rel: string, abs: string;

  if (absolute.low > 0 && relative.low > 0) {
    word = `worse ❌`;
    rel = formatConfidenceInterval(relative, percent);
    abs = formatConfidenceInterval(absolute, formatTime);
  } else if (absolute.high < 0 && relative.high < 0) {
    word = `better ✅`;
    rel = formatConfidenceInterval(negate(relative), percent);
    abs = formatConfidenceInterval(negate(absolute), formatTime);
  } else {
    word = `unsure 🔍`;
    rel = formatConfidenceInterval(relative, (n) => colorizeSign(n, percent));
    abs = formatConfidenceInterval(absolute, (n) =>
      colorizeSign(n, formatTime),
    );
  }

  return {
    label: word,
    relative: rel,
    absolute: abs,
  };
}
