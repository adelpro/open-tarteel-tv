/**
 * Normalize a measured header height from a native `onLayout` event.
 *
 * A broken or not-yet-laid-out event can report a negative or non-finite
 * height. Collapsing those to zero keeps downstream grid sizing from ever
 * receiving NaN or a negative size.
 */
export const normalizeHeaderHeight = (height: number): number => {
  if (!Number.isFinite(height) || height < 0) {
    return 0;
  }
  return height;
};
