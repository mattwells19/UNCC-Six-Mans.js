import { Team } from "../../types/common";

export interface PlayerInActiveMatch {
  id: string;
  team: Team;
  reportedTeam: Team | null;
  matchId: string;
}

export interface UpdatePlayerInActiveMatchInput {
  reportedTeam?: Team;
  brokenQueue?: boolean;
}

export type NewActiveMatchInput = {
  id: string;
  team: Team;
};
