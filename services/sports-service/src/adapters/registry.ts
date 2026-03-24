/**
 * Adapter registry — dispatches to the correct league adapter.
 */
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { LeagueAdapter, LeagueAdapterConfig, NormalizedGame } from './types.js';
import { FootballDataAdapter } from './football-data.js';

export class AdapterRegistry {
  private adapters: Map<string, LeagueAdapter> = new Map();

  constructor(firecrawl: FirecrawlClient) {
    // Register all known adapters
    const football = new FootballDataAdapter(firecrawl);
    this.adapters.set(football.type, football);
  }

  /** Register a custom adapter. */
  register(adapter: LeagueAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  /** Fetch games from a single league adapter. */
  async fetchGames(config: LeagueAdapterConfig): Promise<NormalizedGame[]> {
    const adapter = this.adapters.get(config.adapterType);
    if (!adapter) {
      console.error(`[adapter-registry] Unknown adapter type: ${config.adapterType}`);
      return [];
    }
    return adapter.fetchGames(config);
  }

  /** Fetch games from all configured league adapters. */
  async fetchAll(configs: LeagueAdapterConfig[]): Promise<Map<string, NormalizedGame[]>> {
    const enabled = configs.filter((c) => c.enabled);
    const results = new Map<string, NormalizedGame[]>();

    const settled = await Promise.allSettled(
      enabled.map(async (config) => {
        const games = await this.fetchGames(config);
        return { config, games };
      }),
    );

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        const { config, games } = result.value;
        results.set(config.leagueName, games);
        console.log(`[adapter-registry] ${config.leagueName}: ${games.length} games`);
      } else {
        console.error(`[adapter-registry] Failed:`, result.reason);
      }
    }

    return results;
  }
}
