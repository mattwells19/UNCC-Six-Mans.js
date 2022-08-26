import { Prisma, PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";
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

  async createEvent(eventName: string): Promise<void> {
    await this.#Event.create({
      data: {
        name: eventName,
      },
    });
  }

  async endCurrentEvent(): Promise<void> {
    await this.#Event.update({
      data: {
        endDate: DateTime.now().toString(),
      },
      where: {
        id: (await this.getCurrentEvent()).id,
      },
    });
  }
}

export default new EventRepository();
