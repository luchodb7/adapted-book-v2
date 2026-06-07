import type { Pictogram, SearchOptions } from "../pictogram";

/**
 * High-level pictogram service used by the rest of the domain.
 *
 * Hides the specifics of any particular provider (ARASAAC today, possibly a
 * local mirror or custom library tomorrow).
 */
export interface PictogramService {
  search(keyword: string, options?: SearchOptions): Promise<Pictogram[]>;
  findBestForKeyword(keyword: string, options?: SearchOptions): Promise<Pictogram | null>;
  getById(id: number, options?: SearchOptions): Promise<Pictogram | null>;
}
