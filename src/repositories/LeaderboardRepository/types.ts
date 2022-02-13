export interface PlayerStats {
  id: number;
  mmr: number;
  name: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  winPerc: number;
}

export interface PlayerStatsUpdates {
  id: number;
  mmr: number;
  name: string;
  wins: number;
  losses: number;
}
