import { BallChaser, Leaderboard } from "@prisma/client";
export interface PlayerStats {
  id: number;
  mmr: number;
  name: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  winPerc: number;
}

export interface UpdatePlayerStatsInput {
  id: number;
  mmr: number;
  wins?: number;
  losses?: number;
}

export type LeaderboardWithBallChaser = Leaderboard & { player: BallChaser };
