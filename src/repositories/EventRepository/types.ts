export interface Event {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date | null;
  mmrMult: number;
}

export interface UpdateEventInput {
  name?: string;
  mmrMult?: number;
}
