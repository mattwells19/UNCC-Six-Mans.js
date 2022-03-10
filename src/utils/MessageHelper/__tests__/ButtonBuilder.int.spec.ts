import ButtonBuilder from "../ButtonBuilder";

jest.mock("../../utils");

describe("Building Buttons", () => {
  it("queue is enabled", () => {
    const result = ButtonBuilder.enabledQueueButtons();

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
