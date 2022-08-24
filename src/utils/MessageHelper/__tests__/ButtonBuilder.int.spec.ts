import ButtonBuilder from "../ButtonBuilder";

jest.mock("../../utils");

describe("Building Buttons", () => {
  it("return queue buttons", () => {
    const result = ButtonBuilder.queueButtons();
    expect(result).toMatchSnapshot();
  });
  it("return full queue buttons", () => {
    const result = ButtonBuilder.fullQueueButtons();
    expect(result).toMatchSnapshot();
  });
  it("return break match buttons", () => {
    const result = ButtonBuilder.breakMatchButtons();
    expect(result).toMatchSnapshot();
  });
  it("return active match buttons", () => {
    const result = ButtonBuilder.activeMatchButtons();
    expect(result).toMatchSnapshot();
  });
  it("return new season buttons", () => {
    const result = ButtonBuilder.newSeasonButtons();
    expect(result).toMatchSnapshot();
  });
});
