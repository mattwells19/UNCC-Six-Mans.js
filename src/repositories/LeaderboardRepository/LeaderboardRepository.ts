import { Leaderboard, Prisma, PrismaClient } from "@prisma/client";
import { PlayerStats, PlayerStatsUpdates } from "./types";

export class LeaderboardRepository {
  #Leaderboard: Prisma.LeaderboardDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;

  constructor() {
    this.#Leaderboard = new PrismaClient().leaderboard;
  }

  /**
   * Gets the leaderboard stats for a specific player
   * @param id ID of the player to get stats for
   * @returns returns the player's stats if they exist, otherwise null
   */
  async getPlayerStats(id: number): Promise<Readonly<PlayerStats> | null> {
    const playerStats = await this.#Leaderboard.findUnique({
      include: {
        player: true,
      },
      where: {
        playerId: id,
      },
    });

    if (!playerStats) {
      return null;
    }

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
   * Retreives the top (n) number of players in the leaderboard
   * @param n Number of players to retrieve from the top of the leaderboard table
   * @returns An array of the top 'n' players in the leaderboard
   */
  async getTopNPlayersStats(n: number): Promise<ReadonlyArray<Readonly<PlayerStats>>> {
    const playersStats = await this.#Leaderboard.findMany({
      include: {
        player: true,
      },
      orderBy: [{ mmr: "desc" }, { wins: "desc" }],
      take: n,
    });

    return playersStats.map((playerStats) => ({
      id: playerStats.player.id,
      losses: playerStats.losses,
      matchesPlayed: playerStats.wins + playerStats.losses,
      mmr: playerStats.mmr,
      name: playerStats.player.name,
      winPerc: playerStats.wins / (playerStats.wins + playerStats.losses),
      wins: playerStats.wins,
    }));
  }

  /**
   * Retreives all entries in the leaderboard
   * @returns An array of stats for every player in the leaderboard
   */
  async getAllPlayersStats(): Promise<ReadonlyArray<Readonly<PlayerStats>>> {
    const playersStats = await this.#Leaderboard.findMany({
      include: {
        player: true,
      },
      orderBy: [{ mmr: "desc" }, { wins: "desc" }],
    });

    return playersStats.map((playerStats) => ({
      id: playerStats.player.id,
      losses: playerStats.losses,
      matchesPlayed: playerStats.wins + playerStats.losses,
      mmr: playerStats.mmr,
      name: playerStats.player.name,
      winPerc: playerStats.wins / (playerStats.wins + playerStats.losses),
      wins: playerStats.wins,
    }));
  }

  /**
   * Updates the stats for a list of players. Will update a player if they are already on the leaderboard,
   * otherwise it will add them.
   * @param playersUpdates An array of player stats to update the leaderboard with.
   */
  async updatePlayersStats(playersUpdates: Array<PlayerStatsUpdates>): Promise<void> {
    const promises: Array<Promise<Leaderboard>> = [];
    for (const playerUpdates of playersUpdates) {
      const leaderboardUpdate = this.#Leaderboard.upsert({
        create: {
          losses: playerUpdates.losses,
          mmr: playerUpdates.mmr,
          playerId: playerUpdates.id,
          // TODO: fix me
          seasonKey: "",
          wins: playerUpdates.wins,
        },
        update: {
          losses: playerUpdates.losses,
          mmr: playerUpdates.mmr,
          wins: playerUpdates.wins,
        },
        where: {
          seasonKey_playerId: {
            // TODO: fix me
            playerId: playerUpdates.id,
            seasonKey: "",
          },
        },
      });

      promises.push(leaderboardUpdate);
    }

    await Promise.all(promises);
  }
}

export default new LeaderboardRepository();
