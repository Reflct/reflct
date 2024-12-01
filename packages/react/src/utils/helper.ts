export type Metadata = Record<string, { value: string; updatedAt: string }>;

export function mapMetadataToRecord(
  metadata: Metadata
): Record<string, string> {
  return Object.entries(metadata).reduce(
    (acc, [key, value]) => {
      acc[key] = value.value;

      return acc;
    },
    {} as Record<string, string>
  );
}
