import { Team } from "../../types/common";
import { NotionSelectElement, NotionTextElement } from "../helpers/NotionTypes";

export interface ActiveMatchPageProperties {
  ID: NotionTextElement;
  MatchID: NotionTextElement;
  Team: NotionSelectElement<Team>;
  Reported: NotionSelectElement<Team>;
}

export interface PlayerInActiveMatch {
  id: string;
  team: Team;
  reported: Team | null;
  matchId: string;
}
