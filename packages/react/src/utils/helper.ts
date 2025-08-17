export type Metadata =
  | Record<string, { value: string; updatedAt: string }>
  | undefined;

export function mapMetadataToRecord(
  metadata: Metadata
): Record<string, string> {
  if (!metadata) {
    return {};
  }

  return Object.entries(metadata).reduce(
    (acc, [key, value]) => {
      acc[key] = value.value;

      return acc;
    },
    {} as Record<string, string>
  );
}

export const hexToRgbaFloat = (
  hex: string
): { r: number; g: number; b: number; a: number } => {
  const [r, g, b, a] = hex.match(/[A-F\d]{2}/gi) || [];

  if (!r || !g || !b) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r: parseInt(r, 16) / 255,
    g: parseInt(g, 16) / 255,
    b: parseInt(b, 16) / 255,
    a: a ? parseInt(a, 16) / 255 : 1,
  };
};

export const lerp = (a: number, b: number, t: number) => {
  return a + (b - a) * t;
};
