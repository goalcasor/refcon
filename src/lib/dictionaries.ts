type Locale = 'es' | 'en' | 'de' | 'ca';

const dictionaries: Record<Locale, () => Promise<any>> = {
  en: async () => {
    const header = await import('@/locales/en/header.json').then((module) => module.default);
    const home = await import('@/locales/en/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/en/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/en/login.json').then((module) => module.default);
    const signup = await import('@/locales/en/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/en/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/en/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/en/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/en/blog.json').then((module) => module.default);
    const contact = await import('@/locales/en/contact.json').then((module) => module.default);
    const consent = await import('@/locales/en/consent.json').then((module) => module.default);
    const legal = await import('@/locales/en/legal.json').then((module) => module.default);
    const landing = await import('@/locales/en/landing.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact, consent, legal, landing };
  },
  de: async () => {
    const header = await import('@/locales/de/header.json').then((module) => module.default);
    const home = await import('@/locales/de/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/de/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/de/login.json').then((module) => module.default);
    const signup = await import('@/locales/de/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/de/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/de/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/de/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/de/blog.json').then((module) => module.default);
    const contact = await import('@/locales/de/contact.json').then((module) => module.default);
    const consent = await import('@/locales/de/consent.json').then((module) => module.default);
    const legal = await import('@/locales/de/legal.json').then((module) => module.default);
    const landing = await import('@/locales/de/landing.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact, consent, legal, landing };
  },
  es: async () => {
    const header = await import('@/locales/es/header.json').then((module) => module.default);
    const home = await import('@/locales/es/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/es/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/es/login.json').then((module) => module.default);
    const signup = await import('@/locales/es/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/es/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/es/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/es/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/es/blog.json').then((module) => module.default);
    const contact = await import('@/locales/es/contact.json').then((module) => module.default);
    const consent = await import('@/locales/es/consent.json').then((module) => module.default);
    const legal = await import('@/locales/es/legal.json').then((module) => module.default);
    const landing = await import('@/locales/es/landing.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact, consent, legal, landing };
  },
  ca: async () => {
    const header = await import('@/locales/ca/header.json').then((module) => module.default);
    const home = await import('@/locales/ca/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/ca/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/ca/login.json').then((module) => module.default);
    const signup = await import('@/locales/ca/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/ca/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/ca/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/ca/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/ca/blog.json').then((module) => module.default);
    const contact = await import('@/locales/ca/contact.json').then((module) => module.default);
    const consent = await import('@/locales/ca/consent.json').then((module) => module.default);
    const legal = await import('@/locales/ca/legal.json').then((module) => module.default);
    const landing = await import('@/locales/ca/landing.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact, consent, legal, landing };
  },
}

export const getDictionary = async (locale: Locale) => {
    const loader = dictionaries[locale] || dictionaries.es;
    return loader();
};
