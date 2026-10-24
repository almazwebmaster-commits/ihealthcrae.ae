import manifest from "@/data/image-manifest.json";

export type SlotImage = { src: string; width: number; height: number };

const slots = manifest as Record<string, SlotImage>;

/** Processed homepage image for a slot ID (see docs/homepage-image-plan.md), if one exists. */
export function slotImage(id: string): SlotImage | undefined {
  return slots[id];
}
