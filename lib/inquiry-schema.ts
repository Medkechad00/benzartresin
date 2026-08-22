/**
 * Canonical schema for the commission enquiry form.
 *
 * WHY THIS EXISTS. The option identifiers used to be written out by hand in
 * three unrelated places, in three different conventions:
 *
 *   - the form's <option value> attributes:  "private-dining", "under-3000"
 *   - the translation keys:                  "privateDining", "under3000"
 *   - the email the studio receives:         whatever the raw value happened to be
 *
 * So the enquiry email arrived reading "private-dining" instead of
 * "Private dining", and adding an option meant editing a hardcoded <select>,
 * four locale files, and hoping the spellings matched. Nothing enforced that
 * they did.
 *
 * Now there is one list. The `id` is the value submitted, the value stored, and
 * the translation key — one string, one convention (camelCase), no mapping
 * table to fall out of sync. `label` is the English text the studio reads in
 * the notification email, which is deliberately NOT translated: the studio
 * reads every enquiry in English regardless of the visitor's locale.
 *
 * WHAT THE FORM NO LONGER ASKS. Wood preference, resin preference, budget
 * range, space type and "where will the table live" have all been removed. Each
 * was a question the studio answers better in conversation than a visitor can
 * answer from a dropdown — a first-time buyer does not know whether they want
 * obsidian or amber, and a budget band asked before any design discussion
 * anchors the conversation before it starts. Shape survives because it is the
 * one specification a visitor genuinely arrives holding, and because pieces
 * link here with `?ref=` and pre-fill it.
 *
 * Their option lists are deleted rather than left unused: an exported
 * `BUDGET_OPTIONS` with no consumer is an invitation to wire it back into a
 * form that deliberately stopped asking.
 */

/** One selectable option. `id` doubles as the submitted value and the i18n key. */
export type InquiryOption = {
  id: string;
  /** English label for the studio's notification email. Not shown to visitors. */
  label: string;
};

/**
 * The `other` option, shared by every select that accepts a free-text answer.
 * Declared once so its id can never drift — the server checks for exactly this
 * id when deciding whether to read the companion field.
 */
export const OTHER_OPTION_ID = 'other' as const;

export const SHAPE_OPTIONS: InquiryOption[] = [
  { id: 'rectangular', label: 'Rectangular' },
  { id: 'organic', label: 'Organic edge' },
  { id: 'round', label: 'Round' },
  // Three pieces in the collection are oval (fully radiused ends rather than a
  // true ellipse). Without this option a visitor arriving from one of those
  // detail pages via `?ref=` would land on a form that cannot describe the
  // piece they just clicked.
  { id: 'oval', label: 'Oval' },
  { id: 'conference', label: 'Conference table' },
  { id: OTHER_OPTION_ID, label: 'Other' },
];

/**
 * Every select, keyed by the payload field it populates.
 *
 * The server iterates this to turn submitted ids into readable labels, so a new
 * select becomes available in the email automatically.
 */
export const INQUIRY_OPTION_GROUPS = {
  shape: SHAPE_OPTIONS,
} as const;

export type InquiryOptionField = keyof typeof INQUIRY_OPTION_GROUPS;

/**
 * Selects that support a free-text "Other", mapped to the field holding that
 * text. Keeping this as data rather than copy-pasted conditionals means the
 * reveal, the required flag, and the clearing behaviour stay identical.
 */
export const OTHER_TEXT_FIELDS = {
  shape: 'shapeOther',
} as const;

export type OtherSelectField = keyof typeof OTHER_TEXT_FIELDS;

/**
 * Resolves a submitted id to its English label for the notification email.
 *
 * Falls back to the raw value rather than dropping it: an unrecognised id means
 * the form and this file have diverged, and silently discarding a real answer
 * would be worse than showing an ugly one.
 */
export function optionLabel(field: InquiryOptionField, id: string | undefined): string {
  if (!id) return '';
  const match = INQUIRY_OPTION_GROUPS[field]?.find((option) => option.id === id);
  return match ? match.label : id;
}
