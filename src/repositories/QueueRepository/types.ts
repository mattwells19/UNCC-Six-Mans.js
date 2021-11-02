import { DateTime } from "luxon";
import { Team } from "../../types/common";
import {
  NotionBooleanElement,
  NotionNumberElement,
  NotionSelectElement,
  NotionTextElement,
  NotionDateElement,
} from "../helpers/NotionTypes";

export interface BallChaserPageProperties {
  ID: NotionTextElement;
  MMR: NotionNumberElement;
  Name: NotionTextElement;
  isCap: NotionBooleanElement;
  Team: NotionSelectElement<Team>;
  QueueTime: NotionDateElement;
}

export interface UpdateBallChaserOptions {
  id: string;
  mmr?: number;
  name?: string;
  isCap?: boolean;
  team?: Team | null;
  queueTime?: DateTime | null;
}
