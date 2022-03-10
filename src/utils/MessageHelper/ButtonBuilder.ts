import {
  ButtonInteraction,
  InteractionButtonOptions,
  MessageActionRow,
  MessageButton,
  MessageOptions,
} from "discord.js";
import { getEnvVariable } from "../utils";

export const enum ButtonCustomID {
  JoinQueue = "joinQueue",
  LeaveQueue = "leaveQueue",
  CreateRandomTeam = "randomizeTeams",
  ChooseTeam = "chooseTeam",
  FillTeam = "fillTeam",
  ReportMatch = "reportMatch",
  RemoveAll = "removeAll",
  BreakMatch = "breakMatch",
}

interface CustomButtonOptions extends Partial<Omit<InteractionButtonOptions, "customId">> {
  customId: ButtonCustomID;
}

class CustomButton extends MessageButton {
  constructor(customOptions: CustomButtonOptions) {
    const options: InteractionButtonOptions = (() => {
      switch (customOptions.customId) {
        case ButtonCustomID.JoinQueue:
          return {
            label: "Join",
            style: "SUCCESS",
            ...customOptions,
          };
        case ButtonCustomID.LeaveQueue:
          return {
            label: "Leave",
            style: "DANGER",
            ...customOptions,
          };
        case ButtonCustomID.CreateRandomTeam:
          return {
            label: "Random",
            style: "PRIMARY",
            ...customOptions,
          };
        case ButtonCustomID.ChooseTeam:
          return {
            label: "Captains",
            style: "PRIMARY",
            ...customOptions,
          };
        case ButtonCustomID.FillTeam:
          return {
            label: "DEV: Fill Queue",
            style: "DANGER",
            ...customOptions,
          };
        case ButtonCustomID.ReportMatch:
          return {
            label: "Report Match",
            style: "SUCCESS",
            ...customOptions,
          };
        case ButtonCustomID.RemoveAll:
          return {
            label: "DEV: Remove All",
            style: "DANGER",
            ...customOptions,
          };
        case ButtonCustomID.BreakMatch:
          return {
            label: "DEV: Break Match",
            style: "DANGER",
            ...customOptions,
          };
      }
    })();

    super(options);
  }
}

const joinButton = new CustomButton({ customId: ButtonCustomID.JoinQueue });
const leaveButton = new CustomButton({ customId: ButtonCustomID.LeaveQueue });
const fillTeamButton = new CustomButton({ customId: ButtonCustomID.FillTeam });
const removeAllButton = new CustomButton({ customId: ButtonCustomID.RemoveAll });
const randomTeamsButton = new CustomButton({ customId: ButtonCustomID.CreateRandomTeam });
const chooseTeamsButton = new CustomButton({ customId: ButtonCustomID.ChooseTeam });
const breakMatchButton = new CustomButton({ customId: ButtonCustomID.BreakMatch });
const reportMatchButton = new CustomButton({ customId: ButtonCustomID.ReportMatch });

export default class ButtonBuilder extends MessageButton {
  private static readonly isDev = getEnvVariable("ENVIRONMENT") === "dev";
  private static joinButton = new CustomButton({ customId: ButtonCustomID.JoinQueue });
  private static leaveButton = new CustomButton({ customId: ButtonCustomID.LeaveQueue });
  private static fillTeamButton = new CustomButton({ customId: ButtonCustomID.FillTeam });
  private static removeAllButton = new CustomButton({ customId: ButtonCustomID.RemoveAll });
  private static randomTeamsButton = new CustomButton({ customId: ButtonCustomID.CreateRandomTeam });
  private static chooseTeamsButton = new CustomButton({ customId: ButtonCustomID.ChooseTeam });
  private static breakMatchButton = new CustomButton({ customId: ButtonCustomID.BreakMatch });
  private static reportMatchButton = new CustomButton({ customId: ButtonCustomID.ReportMatch });

  static disabledQueueButtons(buttonInteraction: ButtonInteraction): MessageOptions {
    const waitLabel = "Please wait...";
    const joinButton = new CustomButton({ customId: ButtonCustomID.JoinQueue });
    const leaveButton = new CustomButton({ customId: ButtonCustomID.LeaveQueue });

    switch (buttonInteraction.customId) {
      case ButtonCustomID.JoinQueue: {
        joinButton.label = waitLabel;
        break;
      }
      case ButtonCustomID.LeaveQueue: {
        leaveButton.label = waitLabel;
        break;
      }
    }
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })],
    };
  }

  static enabledQueueButtons(): MessageOptions {
    const joinButton = new CustomButton({ customId: ButtonCustomID.JoinQueue });
    const leaveButton = new CustomButton({ customId: ButtonCustomID.LeaveQueue });
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })],
    };
  }

  static queueButtons(): MessageActionRow {
    const components = [joinButton, leaveButton];
    if (this.isDev) {
      components.push(fillTeamButton, removeAllButton);
    }
    return new MessageActionRow({ components: components });
  }

  static fullQueueButtons(): MessageActionRow {
    const components = [chooseTeamsButton, randomTeamsButton, leaveButton];

    if (this.isDev) {
      components.push(removeAllButton);
    }
    return new MessageActionRow({ components: components });
  }

  static activeMatchButtons(): MessageActionRow {
    const components = [reportMatchButton];
    if (this.isDev) {
      components.push(breakMatchButton);
    }
    return new MessageActionRow({ components: components });
  }

  static breakMatchButtons(): MessageActionRow {
    return new MessageActionRow({ components: [breakMatchButton] });
  }
}
