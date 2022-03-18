import { Message } from "discord.js";
import { ActiveMatchBuilder, BallChaserQueueBuilder } from "../../../.jest/Builder";
import { Team } from "../../types/common";
import { isQueueEmbed, isActiveMatchEmbed } from "../discordUtils";
import MessageBuilder from "../MessageBuilder";

jest.mock("../utils");

describe("Check Embed tests", () => {
  const ballChasers = BallChaserQueueBuilder.many(1);
  const activeMatchBlue = ActiveMatchBuilder.many(1, { team: Team.Blue });
  const activeMatchOrange = ActiveMatchBuilder.many(1, { team: Team.Orange });
  const activeMatch = [...activeMatchBlue, ...activeMatchOrange];

  it.each([MessageBuilder.queueMessage(ballChasers), MessageBuilder.fullQueueMessage(ballChasers)])(
    "identifies embed as queue embed",
    (messageOptions) => {
      // this is why I hate testing Discord stuff
      expect(isQueueEmbed(messageOptions as unknown as Message)).toBeTruthy();
    }
  );

  it("identifies embed as not a queue embed", () => {
    const messageOptions = MessageBuilder.activeMatchMessage(activeMatch);
    expect(isQueueEmbed(messageOptions as unknown as Message)).toBeFalsy();
  });

  it("identifies embed as an active match embed", () => {
    const messageOptions = MessageBuilder.activeMatchMessage(activeMatch);
    expect(isActiveMatchEmbed(messageOptions as unknown as Message)).toBeTruthy();
  });

  it.each([MessageBuilder.queueMessage(ballChasers), MessageBuilder.fullQueueMessage(ballChasers)])(
    "identifies embed as not an active match embed",
    (messageOptions) => {
      expect(isActiveMatchEmbed(messageOptions as unknown as Message)).toBeFalsy();
    }
  );
});
