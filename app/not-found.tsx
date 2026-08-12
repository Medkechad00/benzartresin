import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { localizedPath } from "@/lib/urls";

/**
 * Root 404 fallback.
 *
 * With `localePrefix: 'always'`, Next.js redirects bare paths to the default
 * locale before this renders, so this only catches truly unmatched routes.
 * It extracts the locale from the URL to keep the CTA in the right language.
 */
export default async function RootNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar theme="light" />

      <div className="flex-grow flex items-center justify-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-6">
              {t("eyebrow")}
            </p>

            <h1 className="font-display text-[20vw] md:text-[12rem] leading-none tracking-tighter text-black mb-4">
              404
            </h1>

            <div className="w-16 h-[1px] bg-gold mx-auto mb-8" />

            <h2 className="font-display text-3xl md:text-5xl text-black tracking-tight leading-tight mb-6">
              {t("title")}
            </h2>

            <p className="font-sans text-gray-500 text-lg leading-relaxed max-w-md mx-auto mb-12">
              {t("description")}
            </p>

            <Link
              href={localizedPath('/tables', 'en') as any}
              className="inline-block bg-black text-white px-10 py-5 uppercase tracking-widest text-xs font-bold hover:bg-[#DFAB2E] hover:text-black transition-colors active:scale-[0.98]"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
