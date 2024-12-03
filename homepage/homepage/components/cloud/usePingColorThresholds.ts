import { useTheme } from "next-themes";

export const pingColorThresholdsDark = [
  { ping: 5, color: "hsl(248, 50%, 100%)" },
  { ping: 10, color: "hsl(248, 50%, 80%)" },
  { ping: 15, color: "hsl(248, 50%, 72%)" },
  { ping: 25, color: "hsl(248, 50%, 62%)" },
  { ping: 35, color: "hsl(248, 50%, 54%)" },
  { ping: 45, color: "hsl(248, 50%, 49%)" },
  { ping: 55, color: "hsl(248, 50%, 43%)" },
  { ping: 65, color: "hsl(248, 50%, 39%)" },
  { ping: 100, color: "hsl(248, 50%, 35%)" },
  { ping: 150, color: "hsl(248, 50%, 28%)" },
  { ping: 200, color: "hsl(248, 50%, 23%)" },
  { ping: 300, color: "hsl(248, 50%, 20%)" },
  { ping: 1000, color: "hsl(248, 50%, 16%)" },
];

export const pingColorThresholdsLight = [
  { ping: 5, color: "hsl(260,100%,53%)" },
  { ping: 10, color: "hsl(258,95%,56%)" },
  { ping: 15, color: "hsl(256,93%,59%)" },
  { ping: 25, color: "hsl(252,90%,62%)" },
  { ping: 35, color: "hsl(250,88%,65%)" },
  { ping: 45, color: "hsl(245,87%,68%)" },
  { ping: 55, color: "hsl(240,86%,71%)" },
  { ping: 65, color: "hsl(238,84%,74%)" },
  { ping: 100, color: "hsl(235,80%,77%)" },
  { ping: 150, color: "hsl(232,73%,80%)" },
  { ping: 200, color: "hsl(230,69%,83%)" },
  { ping: 300, color: "hsl(230,65%,88%)" },
  { ping: 1000, color: "hsl(220,60%,92%)" },
];

export const usePingColorThresholds = () => {
  const { resolvedTheme } = useTheme();

  return resolvedTheme === "dark"
    ? pingColorThresholdsDark
    : pingColorThresholdsLight;
};
