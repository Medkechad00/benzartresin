"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { InquirySuccess, type SummaryEntry } from "@/components/inquiry/InquirySuccess";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Ruler, ShieldCheck } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { getTextDirection } from "@/lib/i18n/direction";
import { slideOffset } from "@/lib/i18n/motion";
import { getTableBySlug, type TableData } from "@/content/tables/tables";
import {
  OTHER_OPTION_ID,
  OTHER_TEXT_FIELDS,
  SHAPE_OPTIONS,
  type InquiryOption,
  type OtherSelectField,
} from "@/lib/inquiry-schema";

/**
 * One icon per reassurance claim, positionally matched to
 * `Inquiry.reassurance.items` in the message files:
 *
 *   0  insured from the bench to your doorstep  -> ShieldCheck
 *   1  final dimensions confirmed before a cut  -> Ruler
 *   2  timeline agreed in writing at the start  -> FileText
 *
 * Index-matched rather than keyed, because the copy is authored as a plain array
 * so its length stays a content decision. The render falls back to ShieldCheck
 * if a fourth item is ever added, so adding copy cannot crash the page.
 */
const REASSURANCE_ICONS = [ShieldCheck, Ruler, FileText];

/**
 * TOTAL_STEPS is two, not three.
 *
 * The form asked eleven questions across three screens, five of which have now
 * been removed: wood preference, resin preference, budget range, space type, and
 * where the table would live. What remains splits cleanly in two — who you are,
 * then what you want — so a third screen would exist only to hold the step
 * counter.
 *
 * Declared as a constant because it was previously the literal `3` in four
 * unrelated places: the "next" guard, the submit guard, the mobile counter, and
 * the label of the submit button. Changing the step count meant finding all four,
 * and missing the submit guard would leave the form unable to send at all.
 */
const TOTAL_STEPS = 2;

function shapeOptionFor(shape: string): string {
  const match = SHAPE_OPTIONS.find((option) => option.id === shape);
  return match ? match.id : "";
}

function RefPrefill({ onResolve }: { onResolve: (piece: TableData) => void }) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";

  useEffect(() => {
    if (!ref) return;
    const piece = getTableBySlug(ref);
    if (piece) onResolve(piece);
  }, [ref, onResolve]);

  return null;
}

/**
 * Field chrome.
 *
 * Two accessibility defects fixed here.
 *
 * 1. NON-TEXT CONTRAST (1.4.11). `border-black/20` over the form's white
 *    surface is about 1.6:1. That hairline is the ONLY thing marking where each
 *    of the seven inputs is, and a control boundary needs 3:1. `border-black/50`
 *    is 3.98:1.
 *
 * 2. FOCUS VISIBILITY (2.4.7). `outline-none` was paired with
 *    `focus:border-[#DFAB2E]` — a colour swap on a 1px line, from #CCC to
 *    #DFAB2E, which is a state-change contrast of roughly 1.2:1. That is not a
 *    focus indicator. `outline-none` is simply gone, so the 2px black
 *    `:focus-visible` outline declared in globals.css applies; the border still
 *    changes colour as a secondary cue, now to the accessible gold.
 */
const FIELD_CLASS =
  "text-xl md:text-2xl border-b border-black/50 pb-3 focus:border-gold-ink transition-colors bg-transparent font-display";
const LABEL_CLASS = "font-sans text-xs uppercase tracking-widest text-black";
const ERROR_CLASS = "font-sans text-sm text-red-700";

const OTHER_FIELDS = OTHER_TEXT_FIELDS;

type OtherSelectName = OtherSelectField;

export default function InquiryClient() {
  const locale = useLocale();
  const isRtl = getTextDirection(locale) === "rtl";
  const t = useTranslations("Inquiry");
  const tc = useTranslations("Common");

  const [referringPiece, setReferringPiece] = useState<TableData | null>(null);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  /**
   * Per-field validation messages, keyed by input name.
   *
   * The form had no per-field error mechanism at all: no `aria-invalid`, no
   * `aria-describedby`, no error text beside any of the six required inputs.
   * Validation was native-only, and a native bubble is transient — it vanishes on
   * the next interaction and leaves nothing in the accessibility tree, so a
   * screen-reader user who missed it has no way to find out which field is
   * wrong. That is WCAG 3.3.1 (Error Identification) and 3.3.3 (Error
   * Suggestion).
   *
   * The messages themselves still come from the browser (`validationMessage`),
   * which means they arrive already localised and already matched to the exact
   * constraint that failed — better copy than a hand-rolled string table, and
   * one less thing to translate three times.
   */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    dimensions: "",
    shape: "", shapeOther: "",
    shippingCountry: "",
    message: "", locale, ref: "",
    extraNotes: ""
  });

  const steps = [
    t("steps.client"),
    t("steps.details"),
  ];

  const reassurance = t.raw("reassurance.items") as string[];

  const applyReferringPiece = useCallback((piece: TableData) => {
    setReferringPiece(piece);
    setFormData((prev) => ({
      ...prev,
      ref: piece.slug,
      /*
        Wood and resin were pre-filled here too, from the piece the visitor
        clicked. Both fields are gone, so only the two specifications the form
        still asks for are carried across.
      */
      dimensions: prev.dimensions || piece.dimensions,
      shape: prev.shape || shapeOptionFor(piece.shape),
    }));
  }, []);

  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const handlePrev = () => {
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Clear a field's error as soon as the visitor edits it, so the message
    // never contradicts what is currently on screen.
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name in OTHER_FIELDS && value !== OTHER_OPTION_ID) {
        next[OTHER_FIELDS[name as OtherSelectName]] = '';
      }
      return next;
    });
  };

  /**
   * Collects the browser's own validity state into `fieldErrors`.
   *
   * Returns true when the visible step is valid. `checkValidity()` still works
   * with `noValidate` on the form — `noValidate` only suppresses the browser's
   * automatic UI, not the constraint evaluation — so this keeps native rules and
   * native localised messages while taking over the presentation.
   */
  const validateVisibleStep = (form: HTMLFormElement): boolean => {
    const errors: Record<string, string> = {};
    const controls = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea"
      )
    );

    for (const control of controls) {
      // The honeypot is `aria-hidden` and off-screen; it must never be validated
      // or reported, or a bot-trap becomes a visible error the visitor cannot fix.
      if (control.name === "extraNotes") continue;
      if (!control.checkValidity()) {
        errors[control.name] = control.validationMessage;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Field props shared by every control, so none can be wired up inconsistently. */
  const errorProps = (name: string) =>
    fieldErrors[name]
      ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` }
      : {};

  const resetForm = () => {
    setStatus("idle");
    setStep(1);
    setErrorMessage("");
    setFieldErrors({});
  };

  const renderOptions = (options: InquiryOption[], group: string) =>
    options.map((option) => (
      <option key={option.id} value={option.id}>
        {t(`${group}.${option.id}`)}
      </option>
    ));

  /**
   * Human-readable restatement of the submission, for the confirmation panel.
   *
   * Select answers are stored as ids ("privateDining", "5000to8000"), so each
   * one is resolved back through the same translation namespace the <option>
   * came from — showing a visitor the raw id would undercut the whole point of
   * restating their enquiry. "Other" answers resolve to the free-text value
   * instead. Empty fields are dropped rather than rendered blank.
   */
  const selectionValue = (group: string, value: string, other: string): string => {
    if (!value) return "";
    if (value === OTHER_OPTION_ID) return other.trim();
    return t(`${group}.${value}`);
  };

  const successSummary: SummaryEntry[] = [
    { label: t("referenceEyebrow"), value: referringPiece?.name ?? "" },
    { label: t("fields.dimensions"), value: formData.dimensions },
    { label: t("fields.shape"), value: selectionValue("shapeOptions", formData.shape, formData.shapeOther) },
    { label: t("fields.shippingCountry"), value: formData.shippingCountry },
  ].filter((entry) => entry.value.trim().length > 0);

  const otherInput = (name: OtherSelectName) => {
    if (formData[name] !== OTHER_OPTION_ID) return null;
    const field = OTHER_FIELDS[name];
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-2 overflow-hidden"
      >
        <label htmlFor={field} className={LABEL_CLASS}>
          {t(`fields.${field}`)} *
        </label>
        <input
          required
          type="text"
          id={field}
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className={FIELD_CLASS}
          placeholder={t('placeholders.otherSpecify')}
          {...errorProps(field)}
        />
        {/*
          `autoFocus` was removed from this input.

          It mounts from the `onChange` of the shape `<select>` above. In Firefox
          and Safari, arrow-keying through a native select fires `change` on every
          option you pass, so this input appeared and stole focus out of the
          select while the visitor was still choosing — WCAG 3.2.2 On Input. The
          field is the next thing in the tab order anyway, so nothing is gained by
          forcing it.
        */}
        {fieldErrors[field] ? (
          <p id={`${field}-error`} className={ERROR_CLASS}>
            {fieldErrors[field]}
          </p>
        ) : null}
      </motion.div>
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    /**
     * Validate the visible step before advancing OR submitting.
     *
     * The form now carries `noValidate`, so nothing blocks this handler and the
     * error presentation is ours. Advancing used to be unguarded in the sense
     * that the browser silently refused it with a bubble; the failure is now
     * stated in text next to the field and summarised above the form.
     */
    if (!validateVisibleStep(e.currentTarget)) {
      // Focus the summary rather than the field: it names every problem at once,
      // and it is a container so nothing is typed over while it is read out.
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    if (step !== TOTAL_STEPS) {
      handleNext();
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        setStatus("success");
      } else {
        setErrorMessage(result?.message ?? t("errors.generic"));
        setStatus("error");
      }
    } catch {
      setErrorMessage(t("errors.network"));
      setStatus("error");
    }
  };

  /**
   * The confirmation takes the whole content area, not the form's column.
   *
   * While the form is up, the page is a two-column layout: a sticky title and
   * step tracker on the left, the form on the right capped at `max-w-2xl`. None
   * of that left column is true once the enquiry is in. It still reads
   * "Commission enquiry" over instructions for filling in a form that no longer
   * exists, and the confirmation was being squeezed into 672px beside it.
   *
   * Returning early here lets the confirmation use the same `max-w-7xl`
   * twelve-column grid as every other section on the site, which is what makes
   * an asymmetric composition possible at all.
   */
  if (status === "success") {
    return (
      <PageLayout>
        <div className="pt-16 md:pt-24">
          <InquirySuccess
            firstName={formData.name.trim().split(/\s+/)[0] ?? ""}
            summary={successSummary}
            onReset={resetForm}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Suspense fallback={null}>
        <RefPrefill onResolve={applyReferringPiece} />
      </Suspense>
      <div className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

          <div className="lg:w-1/3 lg:sticky lg:top-40 shrink-0">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-black tracking-tight leading-[0.9] mb-8"
            >
              <span className="bg-[#DFAB2E]">{t("title")}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-gray-600 text-lg leading-relaxed mb-12 pe-8"
            >
              {t("description")}
            </motion.p>

            {referringPiece ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="border-s-2 border-[#DFAB2E] ps-4 mb-12"
              >
                <p className="font-sans text-[10px] uppercase tracking-widest text-gray-600 mb-1">
                  {t("referenceEyebrow")}
                </p>
                <p className="font-display text-2xl text-black">{referringPiece.name}</p>
                <p className="font-sans text-sm text-gray-600 mt-1">
                  {[referringPiece.wood, referringPiece.resinColor].filter(Boolean).join(" · ")}
                </p>
                <p className="font-sans text-xs text-gray-600 mt-3 leading-relaxed">
                  {t("referenceNote")}
                </p>
              </motion.div>
            ) : null}

            {/*
              No `status !== "success"` guard needed: the success state returns
              its own full-width layout above, so this tracker only ever renders
              while the form is up.
            */}
            <div className="hidden lg:flex flex-col gap-4 mb-12">
              {steps.map((title, i) => {
                const id = i + 1;
                return (
                  <div key={title} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full border flex items-center justify-center font-sans text-xs transition-colors ${
                        step >= id
                          ? "border-[#DFAB2E] text-black bg-[#DFAB2E]"
                          : "border-gray-300 text-gray-600"
                      }`}
                    >
                      {id}
                    </div>
                    <span
                      className={`font-display text-lg transition-colors ${
                        step >= id ? "text-black" : "text-gray-600"
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:w-2/3 w-full max-w-2xl">
            {/*
              Trust callout.

              Three things were wrong with the version this replaces:

               1. `hidden lg:flex`. The single strongest reassurance on the page
                  was invisible on phones, which is exactly where a long form
                  needs it most and where most of this traffic is.
               2. The claim "No obligation until we agree on the design" was set
                  at `text-[10px] uppercase`, the size this project uses for
                  field labels. It is not a label, it is the promise that gets
                  someone to finish the form, and it now reads at display size.
               3. One hand-rolled SVG tick sat above three unmarked claims. Each
                  claim now carries its own Phosphor icon, which turns the block
                  into a scannable checklist instead of a paragraph.

              Logical properties throughout so the gold rule stays on the reading
              edge in Arabic. Square corners rather than the previous
              `rounded-e-sm`, matching the sharp-cornered form beside it.
            */}
            <div className="flex flex-col gap-4 bg-gold/8 border-s-2 border-gold ps-5 pe-5 py-5 md:ps-6 md:pe-6 md:py-6 mb-8">
              <p className="font-display text-lg md:text-xl text-black tracking-tight leading-snug">
                {t("reassurance.title")}
              </p>
              <ul className="flex flex-col gap-3">
                {reassurance.map((item, i) => {
                  const Icon = REASSURANCE_ICONS[i] ?? ShieldCheck;
                  return (
                    <li key={item} className="flex items-start gap-3">
                      {/*
                        `gold-dark` rather than `gold`: at 18px on the pale
                        `gold/8` tint the lighter token nearly disappeared.
                        Phosphor's `regular` weight matches the 1.5 stroke used
                        by the other icons in this project.
                      */}
                      <Icon
                        size={18}
                        weight="regular"
                        aria-hidden="true"
                        className="text-gold-ink shrink-0 mt-px"
                      />
                      <span className="font-sans text-sm text-black/70 leading-snug">{item}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                /*
                  `noValidate` so this component owns error presentation. The
                  browser's constraint evaluation is still used — see
                  `validateVisibleStep` — but its transient bubble is replaced
                  with persistent text that lives in the accessibility tree.
                */
                noValidate
                aria-describedby="inquiry-required-note"
                className="bg-white p-8 md:p-16 border border-black/10 relative overflow-hidden min-h-[400px]"
              >
                  {/*
                    Error summary.

                    `tabIndex={-1}` so it can be focused programmatically after a
                    failed submit, and `role="alert"` so it is announced even for
                    a visitor who is not looking at the top of the form. Rendered
                    only when there is something to say — an empty permanent alert
                    region is announced as noise by several screen readers.
                  */}
                  {Object.keys(fieldErrors).length > 0 ? (
                    <div
                      ref={errorSummaryRef}
                      tabIndex={-1}
                      role="alert"
                      className="mb-10 border-s-4 border-red-700 bg-red-50 ps-4 pe-4 py-4"
                    >
                      <p className="font-sans text-sm font-bold text-red-800">
                        {t("errors.summaryTitle")}
                      </p>
                      <ul className="mt-2 flex list-disc flex-col gap-1 ps-5">
                        {Object.entries(fieldErrors).map(([name, message]) => (
                          <li key={name} className="font-sans text-sm text-red-700">
                            <a href={`#${name}`} className="underline">
                              {t(`fields.${name}`)}
                            </a>
                            {`: ${message}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/*
                    The asterisk legend.

                    Six labels ended in `*` with nothing on the page explaining
                    what it meant. `required` gave assistive technology the
                    information, so this is specifically for sighted users —
                    WCAG 3.3.2 Labels or Instructions.
                  */}
                  <p
                    id="inquiry-required-note"
                    className="mb-10 font-sans text-xs text-gray-600"
                  >
                    {tc("requiredFieldsNote")}
                  </p>

                  {/*
                    Honeypot.

                    Named `extraNotes`, not `website`. The old name was the
                    direct cause of every enquiry from this project's own
                    browser being discarded: password managers map `website` to
                    the URL of a saved login and fill it on sight, and none of
                    them honour `autocomplete="off"`. The name now matches
                    nothing in any autofill vocabulary, while a bot that fills
                    every field it finds — which is what this is for — still
                    trips it.

                    The `data-*` attributes are the opt-outs for the four
                    managers that ignore `autocomplete`: LastPass, 1Password,
                    Dashlane, Bitwarden.

                    Off-screen rather than `display:none`, because some bots skip
                    fields that are not rendered. `start-[-9999px]` rather than
                    `-left-[9999px]`: the physical property pushes the field off
                    the LEFT edge, which under dir="rtl" is the overflow side
                    rather than the leading side, and only stayed invisible
                    because this element happens to carry `overflow-hidden`.
                  */}
                  <div aria-hidden="true" className="absolute start-[-9999px] top-0 h-0 w-0 overflow-hidden">
                    <label htmlFor="extraNotes">{t("aria.honeypotLabel")}</label>
                    <input
                      type="text"
                      id="extraNotes"
                      name="extraNotes"
                      tabIndex={-1}
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore=""
                      data-form-type="other"
                      data-bwignore="true"
                      value={formData.extraNotes}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex lg:hidden justify-between mb-8 border-b border-gray-100 pb-4">
                    <span className="font-sans text-xs uppercase tracking-widest text-gray-600">
                      {t("stepOf", { current: step, total: TOTAL_STEPS })}
                    </span>
                    <span className="font-sans text-xs uppercase tracking-widest text-black">
                      {steps[step - 1]}
                    </span>
                  </div>

                  {/*
                    Step changes were completely silent: the panel swapped, focus
                    stayed on the submit button, and nothing was announced. This
                    live region states which step is now showing. It is separate
                    from the visible counter above because that counter is hidden
                    on desktop.
                  */}
                  <p aria-live="polite" className="sr-only">
                    {t("stepOf", { current: step, total: TOTAL_STEPS })} — {steps[step - 1]}
                  </p>

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: slideOffset(isRtl, 20) }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: slideOffset(isRtl, -20) }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-10"
                      >
                        <div className="flex flex-col gap-2">
                          <label htmlFor="name" className={LABEL_CLASS}>{t("fields.name")} *</label>
                          <input required type="text" id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.namePlaceholder")} {...errorProps("name")} />
                          {fieldErrors.name ? <p id="name-error" className={ERROR_CLASS}>{fieldErrors.name}</p> : null}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="email" className={LABEL_CLASS}>{t("fields.email")} *</label>
                          <input required type="email" id="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.emailPlaceholder")} {...errorProps("email")} />
                          {fieldErrors.email ? <p id="email-error" className={ERROR_CLASS}>{fieldErrors.email}</p> : null}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="phone" className={LABEL_CLASS}>{t("fields.phone")} *</label>
                          {/*
                            dir="ltr" is deliberate: a typed number is a series of European-number
                            runs split by neutral spaces, and an RTL paragraph reorders those runs
                            ("+966 55 123 4567" reads back as "4567 123 55 966+"). dir="auto" cannot
                            hold that line, because on an input it resolves from the value rather
                            than the placeholder, so an empty field fell back to ltr and pulled the
                            Arabic placeholder to the left edge. Since the field's own direction is
                            now pinned, alignment has to key off the page: text-right, not text-end.
                          */}
                          <input required type="tel" id="phone" name="phone" autoComplete="tel" value={formData.phone} onChange={handleChange} className={`${FIELD_CLASS} ${isRtl ? "text-right" : ""}`} placeholder={t("fields.phonePlaceholder")} dir="ltr" {...errorProps("phone")} />
                          {fieldErrors.phone ? <p id="phone-error" className={ERROR_CLASS}>{fieldErrors.phone}</p> : null}
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: slideOffset(isRtl, 20) }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: slideOffset(isRtl, -20) }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-10"
                      >
                        {/*
                          What used to be two screens.

                          Wood preference and resin preference are gone from what
                          was "Your vision"; space type, budget range and "where
                          will the table live" are gone from what was "Details".
                          The four questions left over fit one screen without
                          scrolling on a laptop, and asking a visitor to page
                          through two half-empty steps to answer them read as
                          padding.

                          Order is deliberate: the two specifications a visitor
                          arrives already knowing (size, shape) come first and are
                          pre-filled when they follow a link from a piece, so the
                          screen often opens partly answered. The open-ended
                          question is last, where it has the most context.
                        */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="dimensions" className={LABEL_CLASS}>{t("fields.dimensions")}</label>
                          <input type="text" id="dimensions" name="dimensions" value={formData.dimensions} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.dimensionsPlaceholder")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="shape" className={LABEL_CLASS}>{t("fields.shape")}</label>
                          <select id="shape" name="shape" value={formData.shape} onChange={handleChange} className={`${FIELD_CLASS} appearance-none`}>
                            <option value="">{t("placeholders.selectShape")}</option>
                            {renderOptions(SHAPE_OPTIONS, "shapeOptions")}
                          </select>
                        </div>
                        {otherInput("shape")}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="shippingCountry" className={LABEL_CLASS}>{t("fields.shippingCountry")} *</label>
                          <input required type="text" id="shippingCountry" name="shippingCountry" autoComplete="country-name" value={formData.shippingCountry} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.shippingCountryPlaceholder")} {...errorProps("shippingCountry")} />
                          {fieldErrors.shippingCountry ? <p id="shippingCountry-error" className={ERROR_CLASS}>{fieldErrors.shippingCountry}</p> : null}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="message" className={LABEL_CLASS}>{t("fields.message")} *</label>
                          <textarea required id="message" name="message" value={formData.message} onChange={handleChange} rows={4} className={`${FIELD_CLASS} resize-none`} placeholder={t("fields.messagePlaceholder")} {...errorProps("message")}></textarea>
                          {fieldErrors.message ? <p id="message-error" className={ERROR_CLASS}>{fieldErrors.message}</p> : null}
                        </div>
                        {status === "error" && (
                          <p role="alert" className="text-red-700 text-sm font-sans">{errorMessage}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-12 flex items-center justify-between pt-8 border-t border-black/10">
                    {step > 1 ? (
                      <button type="button" onClick={handlePrev} className="font-sans text-xs uppercase tracking-widest text-gray-600 hover:text-black transition-colors">
                        {t("buttons.back")}
                      </button>
                    ) : <div />}

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="bg-black text-white px-10 py-4 uppercase tracking-wider text-sm font-sans hover:bg-black/90 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                      {status === "submitting"
                        ? t("buttons.submitting")
                        : step === TOTAL_STEPS
                          ? t("buttons.submit")
                          : t("buttons.next")}
                    </button>
                  </div>
                </form>
            </motion.div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
