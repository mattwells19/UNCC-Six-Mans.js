import { BallChaserQueueBuilder } from "../../../../.jest/Builder";
import MessageBuilder from "../MessageBuilder";

jest.mock("../../utils");

describe("Building Buttons", () => {
  const mockBallChasers = BallChaserQueueBuilder.many(6);
  it("return queue buttons", () => {
    const result = MessageBuilder.queueMessage(mockBallChasers);
    expect(result).toMatchSnapshot();
  });
  it("return full queue buttons", () => {
    const result = MessageBuilder.fullQueueMessage(mockBallChasers);
    expect(result).toMatchSnapshot();
  });
  it("return break match buttons", () => {
    const result = MessageBuilder.captainChooseMessage(true, mockBallChasers);
    expect(result).toMatchSnapshot();
  });
  it("return active match buttons", () => {
    const activeMatch = mockBallChasers.map((p) => ({ id: p.id, team: p.team! }));
    const result = MessageBuilder.activeMatchMessage(activeMatch);
    expect(result).toMatchSnapshot();
  });
});
