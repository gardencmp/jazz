// const result = generateClampFontSize(500, 1200, 11.5, 14);
// console.log(result); // clamp(11.5px, 9.7143px + 0.3571vw, 14px)
// prev used: https://clamp.font-size.app/
// alt method from klim.co.nz:
// w1: "calc(8 / var(--viewport-basis) * 100vw)"

export function generateClampSize(
  minViewportWidth: number,
  maxViewportWidth: number,
  minFontSize: number,
  maxFontSize: number
): string {
  const minClampValue = `${minFontSize}px`;
  const maxClampValue = `${maxFontSize}px`;

  const fontSizeDiff = maxFontSize - minFontSize;
  const viewportWidthDiff = maxViewportWidth - minViewportWidth;

  const slope = fontSizeDiff / viewportWidthDiff;
  const yIntercept = minFontSize - slope * minViewportWidth;

  const clampExpression = `${yIntercept.toFixed(4)}px + ${(slope * 100).toFixed(
    4
  )}vw`;

  return `clamp(${minClampValue}, ${clampExpression}, ${maxClampValue})`;
}
