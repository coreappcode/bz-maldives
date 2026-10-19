export const MALDIVES_COUNTRY_NAME = 'Maldives';
export const MALDIVES_COUNTRY_CODE = 'MV';
export const MALDIVES_CURRENCY_CODE = 'MVR';

export const IS_MALDIVES_STOREFRONT = import.meta.env.VITE_MARKET === MALDIVES_COUNTRY_CODE;

export const isMaldivesCountry = (country: string): boolean => {
  const token = String(country || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return token === 'MALDIVES' || token === 'MV' || token === 'MDV';
};
