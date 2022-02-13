import { Team } from "../../types/common";

export interface PlayerInActiveMatch {
  id: number;
  team: Team;
  reportedTeam: Team | null;
  matchId: string;
}

export interface UpdatePlayerInActiveMatchInput {
  reportedTeam: Team;
}

export type NewActiveMatchInput = {
  id: number;
  team: Team;
};
