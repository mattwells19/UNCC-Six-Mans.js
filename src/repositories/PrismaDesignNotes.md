```ts
type Team = "Blue" | "Orange";

type ActiveMatch = {
  // composite key = matchId + playerId?
  // foreign key = playerId from Ballchaser
  [matchId: number]: {
    [playerId: number /* Pick<Ballchaser, "id"> */]: {
      team: Team;
      reported: Team | null;
      brokenQueue: boolean;
    };
  };
};

type Queue = {
  // primary key = playerId
  // foreign key = playerId from Ballchaser
  [playerId: number /* Pick<Ballchaser, "id"> */]: {
    mmr?: number; // need to get from Leaderboard if exists
    queueTime: Date; // on join, take current time and add 60 minutes
    isCap: boolean; // default false
    team: Team | null; // default null
  };
};

type Leaderboard = {
  // composite key = seasonKey + playerId?
  // foreign key = playerId from Ballchaser
  [seasonKey: string]: {
    [playerId: number /* Pick<Ballchaser, "id"> */]: {
      mmr: number;
      wins: number;
      losses: number;
    }
  }
};

type Ballchaser = {
  // primary key = playerId
  [playerId: number]: {
    name: string;
  }
}
```