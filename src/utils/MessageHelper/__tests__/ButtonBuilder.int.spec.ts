import ButtonBuilder from "../ButtonBuilder";

jest.mock("../../utils");

describe("Building Buttons", () => {
  // 🐧 we might be able to leverage snapshot tests for MessageBuilder stuff. All we really care about is that the label
  //    looks good, style is correct, and disabled is present when it's supposed to be. Unit tests might be overkill
  //    for this.
  it("queue is enabled", () => {
    const result = ButtonBuilder.queueButtons();

    //expect(result.components).not.toBeNull();
    //expect(result.components![0].components).toEqual(
    //  expect.arrayContaining([expect.objectContaining({ custom_id: "joinQueue" })])
    //);
    //expect(result.components![0].components[0]).toEqual(expect.objectContaining({ custom_id: "joinQueue" }));
    expect(result.components![0].components).toContainEqual(
      expect.arrayContaining([
        expect.objectContaining({ custom_id: "joinQueue" }),
        expect.objectContaining({ custom_id: "leaveQueue" }),
      ])
    );
  });
});
