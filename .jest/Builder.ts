import { BallChaser, Team } from "../src/types/common";
import * as faker from "faker";
import { DateTime } from "luxon";

abstract class Builder<T> {
  abstract isEqual(a: T, b: T): boolean;

  abstract single(overrides?: Partial<T>): T;

  many(count: number, overrides?: Partial<T>): Array<T> {
    const items: Array<T> = [];

    for (let i = 0; i < count; i++) {
      let isNotUnique = true;
      let hardStopCounter = 0;
      let item: T;

      do {
        if (hardStopCounter === 1000) {
          throw new Error(
            "Generated too many items without finding a unique instance. You may need to adjust your isEqual implementation."
          );
        }

        hardStopCounter++;
        item = this.single(overrides);
        isNotUnique = items.some((i) => this.isEqual(item, i));
      } while (isNotUnique);

      items.push(item);
    }

    return items;
  }
}

class BallChaserBuilderClass extends Builder<BallChaser> {
  isEqual(a: BallChaser, b: BallChaser) {
    return a.id === b.id;
  }

  single(overrides?: Partial<BallChaser>) {
    return {
      id: faker.datatype.number(),
      isCap: faker.datatype.boolean(),
      mmr: faker.datatype.number(),
      name: faker.random.word(),
      queueTime: DateTime.fromJSDate(faker.date.future()).set({ millisecond: 0, second: 0 }),
      team: faker.random.arrayElement([Team.Blue, Team.Orange]),
      ...overrides,
    };
  }
}
export const BallChaserBuilder = new BallChaserBuilderClass();
