import { NotionFormulaElement, NotionNumberElement, NotionTextElement } from "../helpers/NotionTypes";

export interface LeaderboardPageResponseProperties {
  ID: NotionTextElement;
  MMR: NotionNumberElement;
  Name: NotionTextElement;
  Wins: NotionNumberElement;
  Losses: NotionNumberElement;
  MatchesPlayed: NotionFormulaElement;
  WinPerc: NotionFormulaElement;
}

export interface LeaderboardPageRequestProperties {
  ID: NotionTextElement;
  MMR: NotionNumberElement;
  Name: NotionTextElement;
  Wins: NotionNumberElement;
  Losses: NotionNumberElement;
}

export interface PlayerStats {
  id: string;
  mmr: number;
  name: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  winPerc: number;
}

export interface PlayerStatsUpdates {
  id: string;
  mmr: number;
  name: string;
  wins: number;
  losses: number;
}
