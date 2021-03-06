import { Prisma, PrismaClient } from "@prisma/client";
import { Event } from "./types";

class EventRepository {
  #Event: Prisma.EventDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  #CurrentEventCache: Event | null;

  constructor() {
    this.#Event = new PrismaClient().event;
    this.#CurrentEventCache = null;
  }

  async getCurrentEvent(): Promise<Event> {
    if (this.#CurrentEventCache) {
      return this.#CurrentEventCache;
    }

    const currentEventResult = await this.#Event.findFirst({
      where: {
        endDate: null,
      },
    });

    if (!currentEventResult) {
      throw new Error("No current event. There should always be an active event.");
    }

    const currentEvent: Event = {
      endDate: currentEventResult.endDate,
      id: currentEventResult.id,
      mmrMult: currentEventResult.mmrMult.toNumber(),
      name: currentEventResult.name,
      startDate: currentEventResult.startDate,
    };

    this.#CurrentEventCache = currentEvent;

    return currentEvent;
  }
}

export default new EventRepository();
