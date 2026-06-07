import type { Logger } from "@/core/logger/logger";
import { ExternalServiceError } from "@/core/errors/app-error";
import type { Pictogram, PictogramKeyword, SearchOptions } from "@/modules/pictograms/domain/pictogram";

export interface ArasaacClientOptions {
  baseUrl: string;
  staticUrl: string;
  defaultLocale: string;
  cacheTtlSeconds: number;
  logger: Logger;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
  retryBackoffMs?: number;
}

interface ArasaacRawPictogram {
  _id: number;
  schematic?: boolean;
  sex?: boolean;
  violence?: boolean;
  aac?: boolean;
  aacColor?: boolean;
  skin?: string;
  hair?: string;
  downloads?: number;
  categories?: string[];
  synsets?: string[];
  tags?: string[];
  keywords?: Array<{
    keyword: string;
    type?: number;
    meaning?: string;
    plural?: string;
    idLocution?: string;
    hasLocution?: boolean;
  }>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * ARASAAC API client with caching, retries with exponential backoff, and
 * graceful fallback to static URLs when the API is unreachable.
 *
 * Designed for both serverless and long-running runtimes.
 */
export class ArasaacClient {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxRetries: number;
  private readonly retryBackoffMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ArasaacClientOptions) {
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBackoffMs = options.retryBackoffMs ?? 500;
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  /**
   * Search pictograms by keyword. Uses the language-scoped search endpoint.
   */
  async searchByKeyword(keyword: string, options: SearchOptions = {}): Promise<Pictogram[]> {
    const language = options.language ?? this.options.defaultLocale;
    const path = options.bestSearch
      ? `/pictograms/${language}/bestsearch/${encodeURIComponent(keyword)}`
      : `/pictograms/${language}/search/${encodeURIComponent(keyword)}`;

    const cacheKey = `search:${language}:${options.bestSearch ? "best" : "all"}:${keyword.toLowerCase()}`;
    const cached = this.readCache<ArasaacRawPictogram[]>(cacheKey);
    if (cached) return this.mapMany(cached, options.limit);

    const data = await this.request<ArasaacRawPictogram[]>(path);
    this.writeCache(cacheKey, data);
    return this.mapMany(data, options.limit);
  }

  /**
   * Generic search (forwarded to /bestsearch by default for relevance).
   */
  async searchPictograms(keyword: string, options: SearchOptions = {}): Promise<Pictogram[]> {
    return this.searchByKeyword(keyword, { bestSearch: true, ...options });
  }

  /**
   * Fetch a single pictogram by numeric id.
   */
  async getPictogram(id: number, options: SearchOptions = {}): Promise<Pictogram | null> {
    const language = options.language ?? this.options.defaultLocale;
    const cacheKey = `id:${language}:${id}`;
    const cached = this.readCache<ArasaacRawPictogram>(cacheKey);
    if (cached) return this.mapOne(cached);

    try {
      const data = await this.request<ArasaacRawPictogram>(`/pictograms/${language}/${id}`);
      this.writeCache(cacheKey, data);
      return this.mapOne(data);
    } catch (err) {
      if (err instanceof ExternalServiceError && (err.details?.status as number | undefined) === 404) {
        return null;
      }
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private mapOne(raw: ArasaacRawPictogram): Pictogram {
    const language = this.options.defaultLocale;
    const keywords: PictogramKeyword[] = (raw.keywords ?? []).map((k) => ({
      keyword: k.keyword,
      meaning: k.meaning,
      type: k.type,
      language,
    }));
    return {
      id: raw._id,
      imageUrl: `${this.options.staticUrl}/${raw._id}/${raw._id}_500.png`,
      keywords,
      categories: raw.categories ?? [],
      tags: raw.tags ?? [],
      schematic: raw.schematic,
      sex: raw.sex,
      violence: raw.violence,
      aac: raw.aac,
    };
  }

  private mapMany(raw: ArasaacRawPictogram[], limit?: number): Pictogram[] {
    const list = raw.map((r) => this.mapOne(r));
    return typeof limit === "number" ? list.slice(0, limit) : list;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.options.baseUrl}${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        const res = await this.fetchImpl(url, {
          headers: { Accept: "application/json", "User-Agent": "AdaptedBooks/1.0" },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.status === 404) {
          throw new ExternalServiceError("arasaac", undefined);
        }
        if (res.status === 429) {
          // Honour Retry-After when present, else exponential backoff.
          const retryAfter = Number(res.headers.get("retry-after") ?? "0") * 1000;
          await sleep(retryAfter || this.retryBackoffMs * 2 ** attempt);
          continue;
        }
        if (!res.ok) {
          throw new ExternalServiceError("arasaac");
        }
        const data = (await res.json()) as T;
        return data;
      } catch (err) {
        lastError = err;
        const isAbort = err instanceof Error && err.name === "AbortError";
        const isLast = attempt === this.maxRetries;
        this.options.logger.warn(
          { err, attempt, path, isLast, isAbort },
          "arasaac.request.failure",
        );
        if (isLast) break;
        await sleep(this.retryBackoffMs * 2 ** attempt);
      }
    }

    throw new ExternalServiceError("arasaac", lastError);
  }

  private readCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private writeCache<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.options.cacheTtlSeconds * 1000,
    });
    if (this.cache.size > 5000) {
      // Naive LRU-ish eviction: clear oldest 10% of entries.
      const toDrop = Math.ceil(this.cache.size * 0.1);
      let i = 0;
      for (const k of this.cache.keys()) {
        this.cache.delete(k);
        if (++i >= toDrop) break;
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
