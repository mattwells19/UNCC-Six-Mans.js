import { Prisma, PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";
import { Event, UpdateEventInput } from "./types";

class EventRepository {
  #Event: Prisma.EventDelegate<Prisma.RejectPerOperation>;
  #CurrentEventCache: Event | null;

  constructor() {
    this.#Event = new PrismaClient().event;
    this.#CurrentEventCache = null;
  }

  /**
   * @deprecated
   * FOR TESTING PURPOSES ONLY
   * DO NOT USE
   */
  resetCache(): void {
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
      endDate: currentEventResult.endDate ? DateTime.fromJSDate(currentEventResult.endDate) : null,
      id: currentEventResult.id,
      mmrMult: currentEventResult.mmrMult.toNumber(),
      name: currentEventResult.name,
      startDate: DateTime.fromJSDate(currentEventResult.startDate),
    };

    this.#CurrentEventCache = currentEvent;

    return currentEvent;
  }

  async updateCurrentEvent(eventUpdates: UpdateEventInput): Promise<void> {
    await this.getCurrentEvent().then((currEvent) => {
      return this.#Event.update({
        data: {
          endDate: eventUpdates.endDate?.toISO(),
          mmrMult: eventUpdates.mmrMult,
          name: eventUpdates.name,
          startDate: eventUpdates.startDate?.toISO(),
        },
        where: {
          id: currEvent.id,
        },
      });
    });
  }
}

export default new EventRepository();
