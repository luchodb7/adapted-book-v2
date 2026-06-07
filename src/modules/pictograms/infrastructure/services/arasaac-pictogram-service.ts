import type { Logger } from "@/core/logger/logger";
import type { Pictogram, SearchOptions } from "@/modules/pictograms/domain/pictogram";
import type { PictogramService } from "@/modules/pictograms/domain/services/pictogram-service";
import type { ArasaacClient } from "./arasaac-client";

export class ArasaacPictogramService implements PictogramService {
  constructor(
    private readonly client: ArasaacClient,
    private readonly logger: Logger,
  ) {}

  async search(keyword: string, options: SearchOptions = {}): Promise<Pictogram[]> {
    if (!keyword.trim()) return [];
    try {
      return await this.client.searchPictograms(keyword, options);
    } catch (err) {
      this.logger.warn({ err, keyword }, "pictogram.search.failed");
      return [];
    }
  }

  async findBestForKeyword(keyword: string, options: SearchOptions = {}): Promise<Pictogram | null> {
    const results = await this.search(keyword, { ...options, bestSearch: true, limit: 1 });
    return results[0] ?? null;
  }

  async getById(id: number, options: SearchOptions = {}): Promise<Pictogram | null> {
    try {
      return await this.client.getPictogram(id, options);
    } catch (err) {
      this.logger.warn({ err, id }, "pictogram.getById.failed");
      return null;
    }
  }
}
