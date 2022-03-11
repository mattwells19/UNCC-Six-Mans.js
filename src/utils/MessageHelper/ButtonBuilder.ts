import { InteractionButtonOptions, MessageActionRow, MessageButton, MessageOptions } from "discord.js";
import { getEnvVariable } from "../utils";

const isDev = getEnvVariable("ENVIRONMENT") === "dev";

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

// 🐧 You can remove this comment before PRing
//    This is a fancy little TS trick that allows us to enforce properties based on the existence of other properties
//    in the same object. In this case, if 'disabled' is true we require you to provide the ButtonCustomID. If
//    'disabled' is false, then we don't care about it so you don't need to provide it.
type QueueButtonOptions =
  | {
      disabled: true;
      buttonId: ButtonCustomID;
    }
  | {
      disabled: false;
    };

// 🐧 CustomButton stuff probably deserves its own file
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

const leaveButton = new CustomButton({ customId: ButtonCustomID.LeaveQueue });
const fillTeamButton = new CustomButton({ customId: ButtonCustomID.FillTeam });
const removeAllButton = new CustomButton({ customId: ButtonCustomID.RemoveAll });
const randomTeamsButton = new CustomButton({ customId: ButtonCustomID.CreateRandomTeam });
const chooseTeamsButton = new CustomButton({ customId: ButtonCustomID.ChooseTeam });
const breakMatchButton = new CustomButton({ customId: ButtonCustomID.BreakMatch });
const reportMatchButton = new CustomButton({ customId: ButtonCustomID.ReportMatch });

export default class ButtonBuilder extends MessageButton {
  // 🐧 do we still need this static variables?
  private static fillTeamButton = new CustomButton({ customId: ButtonCustomID.FillTeam });
  private static removeAllButton = new CustomButton({ customId: ButtonCustomID.RemoveAll });
  private static randomTeamsButton = new CustomButton({ customId: ButtonCustomID.CreateRandomTeam });
  private static chooseTeamsButton = new CustomButton({ customId: ButtonCustomID.ChooseTeam });
  private static breakMatchButton = new CustomButton({ customId: ButtonCustomID.BreakMatch });
  private static reportMatchButton = new CustomButton({ customId: ButtonCustomID.ReportMatch });

  static queueButtons(options: QueueButtonOptions = { disabled: false }): MessageOptions {
    const dynamicJoinButton = new CustomButton({
      customId: ButtonCustomID.JoinQueue,
      disabled: options.disabled,
      label: options.disabled && options.buttonId === ButtonCustomID.JoinQueue ? "Please wait..." : undefined,
    });
    const dynamicLeaveButton = new CustomButton({
      customId: ButtonCustomID.LeaveQueue,
      disabled: options.disabled,
      label: options.disabled && options.buttonId === ButtonCustomID.LeaveQueue ? "Please wait..." : undefined,
    });

    const components = [dynamicJoinButton, dynamicLeaveButton];
    if (isDev) {
      components.push(fillTeamButton, removeAllButton);
    }
    return {
      components: [new MessageActionRow({ components })],
    };
  }

  static fullQueueButtons(): MessageActionRow {
    const components = [chooseTeamsButton, randomTeamsButton, leaveButton];

    if (isDev) {
      components.push(removeAllButton);
    }
    return new MessageActionRow({ components: components });
  }

  static activeMatchButtons(): MessageActionRow {
    const components = [reportMatchButton];
    if (isDev) {
      components.push(breakMatchButton);
    }
    return new MessageActionRow({ components: components });
  }

  static breakMatchButtons(): MessageActionRow {
    return new MessageActionRow({ components: [breakMatchButton] });
  }
}
