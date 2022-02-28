import { Leaderboard, Prisma, PrismaClient } from "@prisma/client";
import { CurrentSeason, LeaderboardWithBallChaser, PlayerStats, UpdatePlayerStatsInput } from "./types";

export class LeaderboardRepository {
  #Season: Prisma.SeasonDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  #Leaderboard: Prisma.LeaderboardDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  #currentSeasonCache: CurrentSeason | null;

  constructor() {
    const prisma = new PrismaClient();
    this.#Leaderboard = prisma.leaderboard;
    this.#Season = prisma.season;
    this.#currentSeasonCache = null;
  }

  async #getCurrentSeason(): Promise<CurrentSeason> {
    if (this.#currentSeasonCache) {
      return this.#currentSeasonCache;
    }

    const currentSeason = await this.#Season.findFirst({
      select: { seasonSemester: true, seasonYear: true },
      where: { seasonEnded: null },
    });

    if (!currentSeason) {
      throw new Error("No current season.");
    }

    this.#currentSeasonCache = currentSeason;
    return currentSeason;
  }

  #calculatePlayerStats(playerStats: LeaderboardWithBallChaser): PlayerStats {
    return {
      id: playerStats.player.id,
      losses: playerStats.losses,
      matchesPlayed: playerStats.wins + playerStats.losses,
      mmr: playerStats.mmr,
      name: playerStats.player.name,
      winPerc: playerStats.wins / (playerStats.wins + playerStats.losses),
      wins: playerStats.wins,
    };
  }

  /**
   * Gets the leaderboard stats for a specific player
   * @param id ID of the player to get stats for
   * @returns returns the player's stats if they exist, otherwise null
   */
  async getPlayerStats(id: string): Promise<Readonly<PlayerStats> | null> {
    const currentSeason = await this.#getCurrentSeason();
    const playerStats = await this.#Leaderboard.findUnique({
      include: {
        player: true,
      },
      where: {
        seasonSemester_seasonYear_playerId: {
          playerId: id,
          ...currentSeason,
        },
      },
    });

    if (!playerStats) {
      return null;
    }

    return this.#calculatePlayerStats(playerStats);
  }

  /**
   * Retreives the top (n) number of players in the leaderboard
   * @param n Number of players to retrieve from the top of the leaderboard. Returns all entries if left undefined.
   * @returns An array of the top 'n' players in the leaderboard
   */
  async getPlayersStats(n?: number): Promise<ReadonlyArray<Readonly<PlayerStats>>> {
    const currentSeason = await this.#getCurrentSeason();
    const playersStats = await this.#Leaderboard.findMany({
      include: {
        player: true,
      },
      orderBy: [{ mmr: "desc" }, { wins: "desc" }],
      take: n,
      where: currentSeason,
    });

    return playersStats.map((playerStats) => this.#calculatePlayerStats(playerStats));
  }

  /**
   * Updates the stats for a list of players. Will update a player if they are already on the leaderboard,
   * otherwise it will add them.
   * @param playersUpdates An array of player stats to update the leaderboard with.
   */
  async updatePlayersStats(playersUpdates: Array<UpdatePlayerStatsInput>): Promise<void> {
    const currentSeason = await this.#getCurrentSeason();

    const promises: Array<Promise<Leaderboard>> = [];
    for (const playerUpdates of playersUpdates) {
      const leaderboardUpdate = this.#Leaderboard.upsert({
        create: {
          losses: playerUpdates.losses,
          mmr: playerUpdates.mmr,
          playerId: playerUpdates.id,
          wins: playerUpdates.wins,
          ...currentSeason,
        },
        update: {
          losses: playerUpdates.losses,
          mmr: playerUpdates.mmr,
          wins: playerUpdates.wins,
        },
        where: {
          seasonSemester_seasonYear_playerId: {
            playerId: playerUpdates.id,
            ...currentSeason,
          },
        },
      });

      promises.push(leaderboardUpdate);
    }

    await Promise.all(promises);
  }
}

export default new LeaderboardRepository();
