/** Horizontal slide distance that mirrors under dir="rtl". */
export function slideOffset(isRtl: boolean, magnitude: number): number {
  return isRtl ? -magnitude : magnitude;
}

/** CSS transform for directional icons (arrows, chevrons) in RTL. */
export function rtlIconClass(isRtl: boolean): string {
  return isRtl ? 'scale-x-[-1]' : '';
}
