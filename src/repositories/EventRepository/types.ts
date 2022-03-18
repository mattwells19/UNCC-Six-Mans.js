import { DateTime } from "luxon";

export interface Event {
  id: number;
  name: string;
  startDate: DateTime;
  endDate: DateTime | null;
  mmrMult: number;
}

export interface UpdateEventInput {
  name?: string;
  startDate?: DateTime;
  endDate?: DateTime | null;
  mmrMult?: number;
}
