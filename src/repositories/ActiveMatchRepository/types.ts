import { Team } from "../../types/common";

export interface PlayerInActiveMatch {
  id: number;
  team: Team;
  reported: Team | null;
  matchId: string;
}
