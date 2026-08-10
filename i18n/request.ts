import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  const requested = await requestLocale;

  // Narrow to a supported locale. `routing.locales` is a readonly tuple of
  // literal types, so `includes` needs the value widened to string rather than
  // an `any` cast.
  const locale = routing.locales.includes(requested as never)
    ? (requested as (typeof routing.locales)[number])
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
