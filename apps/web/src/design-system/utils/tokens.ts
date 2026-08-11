const spaceMap = {
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "8",
  8: "10",
  9: "12",
  10: "16",
  11: "20",
  12: "24",
} as const;

export type SpaceScale = keyof typeof spaceMap;

export function spaceVar(value: SpaceScale = 4) {
  return `var(--space-${spaceMap[value]})`;
}
