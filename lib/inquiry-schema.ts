/**
 * Canonical schema for the commission enquiry form.
 *
 * WHY THIS EXISTS. The option identifiers used to be written out by hand in
 * three unrelated places, in three different conventions:
 *
 *   - the form's <option value> attributes:  "private-dining", "under-3000", "15000+"
 *   - the translation keys:                  "privateDining", "under3000", "over15000"
 *   - the email the studio receives:         whatever the raw value happened to be
 *
 * So the enquiry email arrived reading "private-dining" and "5000-8000" instead
 * of "Private dining" and "5,000 – 8,000 USD", and adding an option meant
 * editing a hardcoded <select>, four locale files, and hoping the spellings
 * matched. Nothing enforced that they did.
 *
 * Now there is one list. The `id` is the value submitted, the value stored, and
 * the translation key — one string, one convention (camelCase), no mapping
 * table to fall out of sync. `label` is the English text the studio reads in
 * the notification email, which is deliberately NOT translated: the studio
 * reads every enquiry in English regardless of the visitor's locale.
 *
 * Adding an option is now a one-line change here plus its three translations.
 */

/** One selectable option. `id` doubles as the submitted value and the i18n key. */
export type InquiryOption = {
  id: string;
  /** English label for the studio's notification email. Not shown to visitors. */
  label: string;
};

/**
 * The `other` option, shared by the four selects that accept a free-text
 * answer. Declared once so its id can never drift between them — the server
 * checks for exactly this id when deciding whether to read the companion field.
 */
export const OTHER_OPTION_ID = 'other' as const;

export const WOOD_OPTIONS: InquiryOption[] = [
  { id: 'walnut', label: 'Walnut' },
  { id: 'maple', label: 'Maple' },
  { id: 'olive', label: 'Olive' },
  { id: 'open', label: 'Open to suggestions' },
  { id: OTHER_OPTION_ID, label: 'Other' },
];

export const RESIN_OPTIONS: InquiryOption[] = [
  { id: 'clear', label: 'Clear' },
  { id: 'obsidian', label: 'Obsidian' },
  { id: 'amber', label: 'Amber' },
  { id: 'custom', label: 'Custom / to discuss' },
  { id: OTHER_OPTION_ID, label: 'Other' },
];

export const SHAPE_OPTIONS: InquiryOption[] = [
  { id: 'rectangular', label: 'Rectangular' },
  { id: 'organic', label: 'Organic edge' },
  { id: 'round', label: 'Round' },
  { id: 'conference', label: 'Conference table' },
  { id: OTHER_OPTION_ID, label: 'Other' },
];

/**
 * Space types.
 *
 * "Covered outdoor" is deliberately absent. UV ambers resin and humidity swings
 * stress the wood/resin joint, so the FAQ states plainly that outdoor work is
 * declined. Listing it here would contradict that and generate enquiries the
 * studio intends to turn down.
 */
export const SPACE_OPTIONS: InquiryOption[] = [
  { id: 'privateDining', label: 'Private dining' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'office', label: 'Office' },
  { id: 'reception', label: 'Reception' },
  { id: OTHER_OPTION_ID, label: 'Other' },
];

/**
 * Budget bands in USD.
 *
 * Ids are camelCase rather than the ranges themselves ("3000-5000") so they are
 * valid translation keys and safe in a URL or a spreadsheet column header.
 */
export const BUDGET_OPTIONS: InquiryOption[] = [
  { id: 'under3000', label: 'Under 3,000 USD' },
  { id: '3000to5000', label: '3,000 - 5,000 USD' },
  { id: '5000to8000', label: '5,000 - 8,000 USD' },
  { id: '8000to15000', label: '8,000 - 15,000 USD' },
  { id: 'over15000', label: 'Over 15,000 USD' },
];

/**
 * Every select, keyed by the payload field it populates.
 *
 * The server iterates this to turn submitted ids into readable labels, so a new
 * select becomes available in the email automatically.
 */
export const INQUIRY_OPTION_GROUPS = {
  wood: WOOD_OPTIONS,
  resin: RESIN_OPTIONS,
  shape: SHAPE_OPTIONS,
  spaceType: SPACE_OPTIONS,
  budget: BUDGET_OPTIONS,
} as const;

export type InquiryOptionField = keyof typeof INQUIRY_OPTION_GROUPS;

/**
 * Selects that support a free-text "Other", mapped to the field holding that
 * text. Keeping this as data rather than four copy-pasted conditionals means
 * the reveal, the required flag, and the clearing behaviour stay identical.
 */
export const OTHER_TEXT_FIELDS = {
  wood: 'woodOther',
  resin: 'resinOther',
  shape: 'shapeOther',
  spaceType: 'spaceTypeOther',
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
