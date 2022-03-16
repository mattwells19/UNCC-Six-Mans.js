import { PrismaClient } from "@prisma/client";
import { Event } from "../types";
import * as faker from "faker";
import EventRepository from "../EventRepository";
import assert from "assert";

let prisma: PrismaClient;

beforeEach(() => {
  jest.clearAllMocks();
  EventRepository.resetCache();
});

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
  await prisma.event.deleteMany();
});

afterEach(async () => {
  await prisma.event.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("EventRepository tests", () => {
  it("throws if there's no current event", async () => {
    await prisma.event.create({
      data: {
        name: "Not Current Season",
        endDate: faker.date.past(),
      },
    });

    await expect(EventRepository.getCurrentEvent()).rejects.toThrowError();
  });

  it("returns the correct current event", async () => {
    await prisma.event.createMany({
      data: [
        {
          name: "Actual Current Season",
          endDate: null,
        },
        {
          name: "Not Current Season",
          endDate: faker.date.past(),
        },
      ],
    });

    const actual = await EventRepository.getCurrentEvent();
    expect(actual).toEqual<Event>({
      id: expect.any(Number),
      name: "Actual Current Season",
      endDate: null,
      mmrMult: 1.0,
      startDate: expect.any(Date),
    });
  });

  it("updates the current event", async () => {
    const addedEvent = await prisma.event.create({
      data: {
        name: "Current Season",
        endDate: null,
      },
    });
    expect(addedEvent.mmrMult.equals(1.0)).toBeTruthy();

    const newName = faker.random.word();
    const newMmrMult = faker.datatype.number({ min: 0, max: 10, precision: 2 });

    await EventRepository.updateCurrentEvent({
      name: newName,
      mmrMult: newMmrMult,
    });

    const actualUpdatedEvent = await prisma.event.findUnique({
      where: {
        id: addedEvent.id,
      },
    });

    assert(actualUpdatedEvent);

    // expect to change
    expect(actualUpdatedEvent.name).toBe(newName);
    expect(actualUpdatedEvent.mmrMult.equals(newMmrMult)).toBeTruthy();

    // expect to stay the same
    expect(actualUpdatedEvent.endDate).toEqual(addedEvent.endDate);
    expect(actualUpdatedEvent.startDate).toEqual(addedEvent.startDate);
  });
});
