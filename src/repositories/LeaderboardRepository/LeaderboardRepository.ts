import getEnvVariable from "../../utils/getEnvVariable";
import NotionClient from "../helpers/NotionClient";
import NotionElementHelper from "../helpers/NotionElementHelper";
import {
  LeaderboardPageResponseProperties,
  LeaderboardPageRequestProperties,
  PlayerStats,
  PlayerStatsUpdates,
} from "./types";

export class LeaderboardRepository {
  #Client: NotionClient<LeaderboardPageResponseProperties, LeaderboardPageRequestProperties>;

  constructor() {
    const databaseId = getEnvVariable("notion_leaderboard_id");
    this.#Client = new NotionClient(databaseId);
  }

  /**
   * Gets the leaderboard stats for a specific player
   * @param id ID of the player to get stats for
   * @returns returns the player's stats if they exist, otherwise null
   */
  async getPlayerStats(id: string): Promise<Readonly<PlayerStats> | null> {
    const page = await this.#Client.getById(id);

    if (!page) {
      return null;
    }

    const pageProps = page.properties;
    return {
      id: NotionElementHelper.textFromNotionTextElement(pageProps.ID),
      losses: NotionElementHelper.numberFromNotionNumberElement(pageProps.Losses),
      matchesPlayed: NotionElementHelper.numberFromNotionFormulaElement(pageProps.MatchesPlayed),
      mmr: NotionElementHelper.numberFromNotionNumberElement(pageProps.MMR),
      name: NotionElementHelper.textFromNotionTextElement(pageProps.Name),
      winPerc: NotionElementHelper.numberFromNotionFormulaElement(pageProps.WinPerc),
      wins: NotionElementHelper.numberFromNotionNumberElement(pageProps.Wins),
    };
  }

  /**
   * Retreives the top (n) number of players in the leaderboard
   * @param n Number of players to retrieve from the top of the leaderboard table
   * @returns An array of the top 'n' players in the leaderboard
   */
  async getTopNPlayersStats(n: number): Promise<ReadonlyArray<Readonly<PlayerStats>>> {
    const pages = await this.#Client.getAll({
      page_size: n,
      sorts: [
        { direction: "descending", property: "MMR" },
        { direction: "descending", property: "Wins" },
      ],
    });

    return pages.map(({ properties: pageProps }) => ({
      id: NotionElementHelper.textFromNotionTextElement(pageProps.ID),
      losses: NotionElementHelper.numberFromNotionNumberElement(pageProps.Losses),
      matchesPlayed: NotionElementHelper.numberFromNotionFormulaElement(pageProps.MatchesPlayed),
      mmr: NotionElementHelper.numberFromNotionNumberElement(pageProps.MMR),
      name: NotionElementHelper.textFromNotionTextElement(pageProps.Name),
      winPerc: NotionElementHelper.numberFromNotionFormulaElement(pageProps.WinPerc),
      wins: NotionElementHelper.numberFromNotionNumberElement(pageProps.Wins),
    }));
  }

  /**
   * Retreives all entries in the leaderboard
   * @returns An array of stats for every player in the leaderboard
   */
  async getAllPlayersStats(): Promise<ReadonlyArray<Readonly<PlayerStats>>> {
    const pages = await this.#Client.getAll({
      sorts: [
        { direction: "descending", property: "MMR" },
        { direction: "descending", property: "Wins" },
      ],
    });

    return pages.map(({ properties: pageProps }) => ({
      id: NotionElementHelper.textFromNotionTextElement(pageProps.ID),
      losses: NotionElementHelper.numberFromNotionNumberElement(pageProps.Losses),
      matchesPlayed: NotionElementHelper.numberFromNotionFormulaElement(pageProps.MatchesPlayed),
      mmr: NotionElementHelper.numberFromNotionNumberElement(pageProps.MMR),
      name: NotionElementHelper.textFromNotionTextElement(pageProps.Name),
      winPerc: NotionElementHelper.numberFromNotionFormulaElement(pageProps.WinPerc),
      wins: NotionElementHelper.numberFromNotionNumberElement(pageProps.Wins),
    }));
  }

  /**
   * Updates the stats for a list of players. Will update a player if they are already on the leaderboard,
   * otherwise it will add them.
   * @param playersUpdates An array of player stats to update the leaderboard with.
   */
  async updatePlayersStats(playersUpdates: Array<PlayerStatsUpdates>): Promise<void> {
    const promises: Array<Promise<void>> = [];
    for (const playerUpdates of playersUpdates) {
      const page = await this.#Client.getById(playerUpdates.id);

      const propertiesUpdate: LeaderboardPageRequestProperties = {
        ID: NotionElementHelper.notionTextElementFromText(playerUpdates.id),
        Losses: NotionElementHelper.notionNumberElementFromNumber(playerUpdates.losses),
        MMR: NotionElementHelper.notionNumberElementFromNumber(playerUpdates.mmr),
        Name: NotionElementHelper.notionTextElementFromText(playerUpdates.name),
        Wins: NotionElementHelper.notionNumberElementFromNumber(playerUpdates.wins),
      };

      // if the page already exists, update it; otherwise insert as a new page
      promises.push(page ? this.#Client.update(page.id, propertiesUpdate) : this.#Client.insert(propertiesUpdate));
    }

    await Promise.all(promises);
  }
}

export default new LeaderboardRepository();
