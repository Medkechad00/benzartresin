"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { motion, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { getTextDirection } from "@/lib/i18n/direction";
import { slideOffset } from "@/lib/i18n/motion";
import { getTableBySlug, type TableData } from "@/content/tables/tables";
import {
  BUDGET_OPTIONS,
  OTHER_OPTION_ID,
  OTHER_TEXT_FIELDS,
  RESIN_OPTIONS,
  SHAPE_OPTIONS,
  SPACE_OPTIONS,
  WOOD_OPTIONS,
  type InquiryOption,
  type OtherSelectField,
} from "@/lib/inquiry-schema";
import { tableSlug } from "@/lib/urls";

function resinOptionFor(resinColor: string): string {
  const c = resinColor.toLowerCase();
  if (c.includes("black") || c.includes("obsidian")) return "obsidian";
  if (c.includes("amber") || c.includes("gold")) return "amber";
  if (c.includes("clear")) return "clear";
  return "custom";
}

function woodOptionFor(wood: string): string {
  const w = wood.toLowerCase();
  if (w.includes("walnut")) return "walnut";
  if (w.includes("maple")) return "maple";
  if (w.includes("olive")) return "olive";
  return "open";
}

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

const FIELD_CLASS =
  "text-xl md:text-2xl border-b border-black/20 pb-3 focus:border-[#DFAB2E] outline-none transition-colors bg-transparent font-display";
const LABEL_CLASS = "font-sans text-xs uppercase tracking-widest text-black";

const OTHER_FIELDS = OTHER_TEXT_FIELDS;

type OtherSelectName = OtherSelectField;

export default function InquiryClient() {
  const locale = useLocale();
  const isRtl = getTextDirection(locale) === "rtl";
  const t = useTranslations("Inquiry");

  const [referringPiece, setReferringPiece] = useState<TableData | null>(null);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    wood: "", woodOther: "",
    resin: "", resinOther: "",
    dimensions: "",
    shape: "", shapeOther: "",
    spaceType: "", spaceTypeOther: "",
    shippingCountry: "", budget: "",
    location: "", message: "", locale, ref: "",
    website: ""
  });

  const steps = [
    t("steps.client"),
    t("steps.vision"),
    t("steps.details"),
  ];

  const reassurance = t.raw("reassurance.items") as string[];

  const applyReferringPiece = useCallback((piece: TableData) => {
    setReferringPiece(piece);
    setFormData((prev) => ({
      ...prev,
      ref: piece.slug,
      wood: prev.wood || woodOptionFor(piece.wood),
      resin: prev.resin || resinOptionFor(piece.resinColor),
      dimensions: prev.dimensions || piece.dimensions,
      shape: prev.shape || shapeOptionFor(piece.shape),
    }));
  }, []);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name in OTHER_FIELDS && value !== OTHER_OPTION_ID) {
        next[OTHER_FIELDS[name as OtherSelectName]] = '';
      }
      return next;
    });
  };

  const resetForm = () => {
    setStatus("idle");
    setStep(1);
    setErrorMessage("");
  };

  const renderOptions = (options: InquiryOption[], group: string) =>
    options.map((option) => (
      <option key={option.id} value={option.id}>
        {t(`${group}.${option.id}`)}
      </option>
    ));

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
          autoFocus
        />
      </motion.div>
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step !== 3) {
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
                <p className="font-sans text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  {t("referenceEyebrow")}
                </p>
                <p className="font-display text-2xl text-black">{referringPiece.name}</p>
                <p className="font-sans text-sm text-gray-600 mt-1">
                  {referringPiece.wood} &middot; {referringPiece.resinColor}
                </p>
                <p className="font-sans text-xs text-gray-500 mt-3 leading-relaxed">
                  {t("referenceNote")}
                </p>
              </motion.div>
            ) : null}

            {status !== "success" && (
              <div className="hidden lg:flex flex-col gap-4 mb-12">
                {steps.map((title, i) => {
                  const id = i + 1;
                  return (
                    <div key={title} className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center font-sans text-xs transition-colors ${
                          step >= id
                            ? "border-[#DFAB2E] text-black bg-[#DFAB2E]"
                            : "border-gray-300 text-gray-400"
                        }`}
                      >
                        {id}
                      </div>
                      <span
                        className={`font-display text-lg transition-colors ${
                          step >= id ? "text-black" : "text-gray-400"
                        }`}
                      >
                        {title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:w-2/3 w-full max-w-2xl">
            <div className="hidden lg:flex items-start gap-4 bg-gold/8 border-l-2 border-gold pl-5 pr-4 py-4 mb-8 rounded-r-sm">
              <svg aria-hidden="true" className="w-5 h-5 text-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-black/70 mb-2">
                  {t("reassurance.title")}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {reassurance.map((item) => (
                    <li key={item} className="font-sans text-sm text-black/70 leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {status === "success" ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={resetForm} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative bg-white p-10 md:p-16 border border-black/10 text-center max-w-lg mx-auto"
                  >
                    <button
                      type="button"
                      onClick={resetForm}
                      aria-label={t("aria.closeAndResend")}
                      className="absolute top-4 end-4 w-10 h-10 flex items-center justify-center text-black/40 hover:text-black transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                      </svg>
                    </button>

                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-8">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>

                    <h2 className="font-display text-3xl md:text-4xl text-black tracking-tight mb-6">
                      {t("success.title")}
                    </h2>
                    <p className="font-sans text-gray-600 text-lg leading-relaxed mb-10">
                      {t("success.body", { name: formData.name.split(" ")[0] || "" })}
                    </p>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-black text-white px-10 py-4 uppercase tracking-wider text-xs font-bold hover:bg-black/90 transition-colors active:scale-[0.98]"
                    >
                      {t("buttons.submit")}
                    </button>
                  </motion.div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white p-8 md:p-16 border border-black/10 relative overflow-hidden min-h-[400px]"
                >
                  <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
                    <label htmlFor="website">{t("aria.honeypotLabel")}</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex lg:hidden justify-between mb-8 border-b border-gray-100 pb-4">
                    <span className="font-sans text-xs uppercase tracking-widest text-gray-500">
                      {t("stepOf", { current: step, total: 3 })}
                    </span>
                    <span className="font-sans text-xs uppercase tracking-widest text-black">
                      {steps[step - 1]}
                    </span>
                  </div>

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
                          <input required type="text" id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.namePlaceholder")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="email" className={LABEL_CLASS}>{t("fields.email")} *</label>
                          <input required type="email" id="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.emailPlaceholder")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="phone" className={LABEL_CLASS}>{t("fields.phone")} *</label>
                          <input required type="tel" id="phone" name="phone" autoComplete="tel" value={formData.phone} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.phonePlaceholder")} dir="ltr" />
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
                        <div className="flex flex-col gap-2">
                          <label htmlFor="wood" className={LABEL_CLASS}>{t("fields.wood")}</label>
                          <select id="wood" name="wood" value={formData.wood} onChange={handleChange} className={`${FIELD_CLASS} appearance-none`}>
                            <option value="">{t("placeholders.selectOption")}</option>
                            {renderOptions(WOOD_OPTIONS, "woodOptions")}
                          </select>
                        </div>
                        {otherInput("wood")}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="resin" className={LABEL_CLASS}>{t("fields.resin")}</label>
                          <select id="resin" name="resin" value={formData.resin} onChange={handleChange} className={`${FIELD_CLASS} appearance-none`}>
                            <option value="">{t("placeholders.selectOption")}</option>
                            {renderOptions(RESIN_OPTIONS, "resinOptions")}
                          </select>
                        </div>
                        {otherInput("resin")}
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
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: slideOffset(isRtl, 20) }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: slideOffset(isRtl, -20) }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-10"
                      >
                        <div className="flex flex-col gap-2">
                          <label htmlFor="spaceType" className={LABEL_CLASS}>{t("fields.spaceType")}</label>
                          <select id="spaceType" name="spaceType" value={formData.spaceType} onChange={handleChange} className={`${FIELD_CLASS} appearance-none`}>
                            <option value="">{t("placeholders.selectOption")}</option>
                            {renderOptions(SPACE_OPTIONS, "spaceOptions")}
                          </select>
                        </div>
                        {otherInput("spaceType")}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="shippingCountry" className={LABEL_CLASS}>{t("fields.shippingCountry")} *</label>
                          <input required type="text" id="shippingCountry" name="shippingCountry" autoComplete="country-name" value={formData.shippingCountry} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.shippingCountryPlaceholder")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="budget" className={LABEL_CLASS}>{t("fields.budget")}</label>
                          <select id="budget" name="budget" value={formData.budget} onChange={handleChange} className={`${FIELD_CLASS} appearance-none`}>
                            <option value="">{t("placeholders.selectRange")}</option>
                            {renderOptions(BUDGET_OPTIONS, "budgetOptions")}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="location" className={LABEL_CLASS}>{t("fields.location")} *</label>
                          <input required type="text" id="location" name="location" value={formData.location} onChange={handleChange} className={FIELD_CLASS} placeholder={t("fields.locationPlaceholder")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="message" className={LABEL_CLASS}>{t("fields.message")} *</label>
                          <textarea required id="message" name="message" value={formData.message} onChange={handleChange} rows={4} className={`${FIELD_CLASS} resize-none`} placeholder={t("fields.messagePlaceholder")}></textarea>
                        </div>
                        {status === "error" && (
                          <p role="alert" className="text-red-600 text-sm font-sans">{errorMessage}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-12 flex items-center justify-between pt-8 border-t border-black/10">
                    {step > 1 ? (
                      <button type="button" onClick={handlePrev} className="font-sans text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
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
                        : step === 3
                          ? t("buttons.submit")
                          : t("buttons.next")}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
