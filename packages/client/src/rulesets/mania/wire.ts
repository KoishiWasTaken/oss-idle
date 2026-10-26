import type { ReplayOffset } from '@oss-idle/shared/rulesets/mania/maniaGame';

/** A mania play's streamed replay. */
export const maniaOffsets = (offsets: readonly unknown[]) => offsets as ReplayOffset[];
