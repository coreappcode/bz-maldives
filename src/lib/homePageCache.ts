import type { Product } from '../types';
import { IS_MALDIVES_STOREFRONT } from '../config/market';

export interface HomePageSections {
  featured: Product[];
  deals: Product[];
  trending: Product[];
  hasSponsored: boolean;
}

export interface HomePageBanner {
  id: string;
  src: string;
  alt: string;
  link: string;
  adSlot: number;
}

export interface HomePagePrices {
  productIds: string[];
  sellingPrices: Record<string, number>;
  mrps: Record<string, number>;
}

export interface CacheEntry<T> {
  value: T;
  cachedAt: number;
}

export const HOME_CONTENT_CACHE_TTL_MS = 5 * 60 * 1000;
export const HOME_PRICE_CACHE_TTL_MS = 2 * 60 * 1000;

const MAX_STALE_CACHE_AGE_MS = 60 * 60 * 1000;
const MARKET_KEY = IS_MALDIVES_STOREFRONT ? 'MV' : 'GLOBAL';
const SECTIONS_CACHE_KEY = `beauzead_home_sections_v1:${MARKET_KEY}`;
const BANNERS_CACHE_KEY = `beauzead_home_banners_v1:${MARKET_KEY}`;

function readCache<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed
      || typeof parsed !== 'object'
      || !('cachedAt' in parsed)
      || !('value' in parsed)
      || !Number.isFinite(parsed.cachedAt)
      || Date.now() - Number(parsed.cachedAt) > MAX_STALE_CACHE_AGE_MS
    ) {
      return null;
    }

    return parsed as CacheEntry<T>;
  } catch (error) {
    console.warn('[home-cache] Unable to read cached home data:', error);
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify({ value, cachedAt: Date.now() }));
  } catch (error) {
    console.warn('[home-cache] Unable to save home data cache:', error);
  }
}

export function readHomeSectionsCache(): CacheEntry<HomePageSections> | null {
  const cached = readCache<HomePageSections>(SECTIONS_CACHE_KEY);
  if (
    !cached
    || !cached.value
    || typeof cached.value !== 'object'
    || !Array.isArray(cached.value.featured)
    || !Array.isArray(cached.value.deals)
    || !Array.isArray(cached.value.trending)
    || typeof cached.value.hasSponsored !== 'boolean'
  ) {
    return null;
  }
  return cached;
}

export function writeHomeSectionsCache(value: HomePageSections): void {
  writeCache(SECTIONS_CACHE_KEY, value);
}

export function readHomeBannersCache(): CacheEntry<HomePageBanner[]> | null {
  const cached = readCache<HomePageBanner[]>(BANNERS_CACHE_KEY);
  return cached && Array.isArray(cached.value) ? cached : null;
}

export function writeHomeBannersCache(value: HomePageBanner[]): void {
  writeCache(BANNERS_CACHE_KEY, value);
}

const priceCacheKey = (country: string): string =>
  `beauzead_home_prices_v1:${MARKET_KEY}:${country.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

function normalizeProductIds(productIds: string[]): string[] {
  return Array.from(new Set(productIds.filter(Boolean))).sort();
}

export function readHomePricesCache(
  country: string,
  productIds: string[],
): CacheEntry<HomePagePrices> | null {
  const cached = readCache<HomePagePrices>(priceCacheKey(country));
  if (
    !cached
    || !cached.value
    || !Array.isArray(cached.value.productIds)
    || !cached.value.sellingPrices
    || typeof cached.value.sellingPrices !== 'object'
    || !cached.value.mrps
    || typeof cached.value.mrps !== 'object'
  ) return null;

  const requestedIds = normalizeProductIds(productIds);
  const cachedIds = normalizeProductIds(cached.value.productIds);
  if (
    requestedIds.length !== cachedIds.length
    || requestedIds.some((id, index) => id !== cachedIds[index])
  ) {
    return null;
  }

  return cached;
}

export function writeHomePricesCache(country: string, value: HomePagePrices): void {
  writeCache(priceCacheKey(country), {
    ...value,
    productIds: normalizeProductIds(value.productIds),
  });
}

export function isCacheFresh<T>(entry: CacheEntry<T>, ttlMs: number): boolean {
  return Date.now() - entry.cachedAt < ttlMs;
}
