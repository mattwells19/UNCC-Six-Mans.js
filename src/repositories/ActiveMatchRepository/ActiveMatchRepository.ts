import { BallChaser, Team } from "../../types/common";
import getEnvVariable from "../../utils/getEnvVariable";
import generateRandomId from "../../utils/randomId";
import NotionClient from "../helpers/NotionClient";
import NotionElementHelper from "../helpers/NotionElementHelper";
import { ActiveMatchPageProperties, PlayerInActiveMatch } from "./types";

export class ActiveMatchRepository {
  #Client: NotionClient<ActiveMatchPageProperties>;

  constructor() {
    const databaseId = getEnvVariable("notion_active_match_id");
    this.#Client = new NotionClient(databaseId);
  }

  async addActiveMatch(ballChasers: Array<BallChaser>): Promise<void> {
    const insertPromises: Array<Promise<void>> = [];
    const matchId = generateRandomId();

    for (const ballChaser of ballChasers) {
      if (!ballChaser.team) {
        throw new Error(`Cannot add a player to an active match without a team: ${ballChaser.name}.`);
      }

      const newActiveMatchPage: ActiveMatchPageProperties = {
        ID: NotionElementHelper.notionTextElementFromText(ballChaser.id),
        MatchID: NotionElementHelper.notionTextElementFromText(matchId),
        Reported: NotionElementHelper.notionSelectElementFromValue<Team>(null),
        Team: NotionElementHelper.notionSelectElementFromValue<Team>(ballChaser.team),
      };

      insertPromises.push(this.#Client.insert(newActiveMatchPage));
    }

    await Promise.all(insertPromises);
  }

  async updatePlayerInActiveMatch(playerInMatchId: string, updates: Partial<PlayerInActiveMatch>): Promise<void> {
    const activeMatchPage = await this.#Client.getById(playerInMatchId);

    if (!activeMatchPage) {
      throw new Error(`Player with ID: ${playerInMatchId} is not in an active match.`);
    }

    const activeMatchProps = activeMatchPage.properties;
    const propertiesUpdate: ActiveMatchPageProperties = {
      ID: updates.id ? NotionElementHelper.notionTextElementFromText(updates.id) : activeMatchProps.ID,
      MatchID: updates.matchId
        ? NotionElementHelper.notionTextElementFromText(updates.matchId)
        : activeMatchProps.MatchID,
      Reported: updates.reported
        ? NotionElementHelper.notionSelectElementFromValue<Team>(updates.reported)
        : activeMatchProps.Reported,
      Team: updates.team ? NotionElementHelper.notionSelectElementFromValue<Team>(updates.team) : activeMatchProps.Team,
    };

    await this.#Client.update(activeMatchPage.id, propertiesUpdate);
  }

  // not sure we actually need this, but leaving it here in case we do
  // async updateAllPlayersInActiveMatch(playerInMatchId: string, updates: UpdateActiveMatchOptions): Promise<void> {
  //   const playerInActiveMatchPage = await this.#Client.getById(playerInMatchId);

  //   if (!playerInActiveMatchPage) {
  //     throw new Error(`Player with ID: ${playerInMatchId} is not in an active match.`);
  //   }

  //  const existingPlayerActiveMatchProps = playerInActiveMatchPage.properties as unknown as ActiveMatchPageProperties;

  //   const allActiveMatchPages = await this.#Client.getAll({
  //     filter: {
  //       property: "MatchID",
  //       text: {
  //         equals: NotionElementHelper.textFromNotionTextElement(existingPlayerActiveMatchProps.MatchID),
  //       },
  //     },
  //   });

  //   const updatePromises: Array<Promise<void>> = [];
  //   for (const activeMatchPage of allActiveMatchPages) {
  //     const activeMatchProps = activeMatchPage.properties as unknown as ActiveMatchPageProperties;

  //     const propertiesUpdate: ActiveMatchPageProperties = {
  //       ID: updates.id ? NotionElementHelper.notionTextElementFromText(updates.id) : activeMatchProps.ID,
  //       MatchID: updates.matchId
  //         ? NotionElementHelper.notionTextElementFromText(updates.matchId)
  //         : activeMatchProps.MatchID,
  //       Reported: updates.reported
  //         ? NotionElementHelper.notionSelectElementFromValue<Team>(updates.reported)
  //         : activeMatchProps.Reported,
  //       Team: updates.team
  //         ? NotionElementHelper.notionSelectElementFromValue<Team>(updates.team)
  //         : activeMatchProps.Team,
  //     };

  //     updatePromises.push(this.#Client.update(activeMatchPage.id, propertiesUpdate));
  //   }

  //   await Promise.all(updatePromises);
  // }

  async removeAllPlayersInActiveMatch(playerInMatchId: string): Promise<void> {
    const playerInActiveMatchPage = await this.#Client.getById(playerInMatchId);

    if (!playerInActiveMatchPage) {
      return Promise.resolve();
    }

    const activeMatchProps = playerInActiveMatchPage.properties;

    await this.#Client.findAllAndRemove({
      filter: {
        property: "MatchID",
        text: {
          equals: NotionElementHelper.textFromNotionTextElement(activeMatchProps.MatchID),
        },
      },
    });
  }

  async getAllPlayersInActiveMatch(playerInMatchId: string): Promise<ReadonlyArray<Readonly<PlayerInActiveMatch>>> {
    const playerInActiveMatchPage = await this.#Client.getById(playerInMatchId);

    if (!playerInActiveMatchPage) {
      return Promise.resolve([]);
    }

    const existingPlayerActiveMatchProps = playerInActiveMatchPage.properties;

    const allActiveMatchPages = await this.#Client.getAll({
      filter: {
        property: "MatchID",
        text: {
          equals: NotionElementHelper.textFromNotionTextElement(existingPlayerActiveMatchProps.MatchID),
        },
      },
    });

    return allActiveMatchPages.map(({ properties: pageProps }) => {
      const playerTeam = NotionElementHelper.valueFromNotionSelectElement<Team>(pageProps.Team);
      const playerId = NotionElementHelper.textFromNotionTextElement(pageProps.ID);

      if (!playerTeam) {
        throw new Error(
          `Player with ID: ${playerId} is in an active match but not on a team - THIS SHOULD BE IMPOSSIBLE`
        );
      }

      return {
        id: NotionElementHelper.textFromNotionTextElement(pageProps.ID),
        matchId: NotionElementHelper.textFromNotionTextElement(pageProps.MatchID),
        reported: NotionElementHelper.valueFromNotionSelectElement<Team>(pageProps.Reported),
        team: playerTeam,
      };
    });
  }
}

export default new ActiveMatchRepository();
