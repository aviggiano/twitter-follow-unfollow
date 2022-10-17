import database, {
  User,
  connect,
  disconnect,
  Statistic,
  getCursor,
} from "../database";
import { Logger } from "tslog";
import { IsNull, Not } from "typeorm";

const log = new Logger();

export async function main() {
  log.info("generate-statistics start");
  await connect();
  await database.synchronize();

  const [total, toFollow, followed, unfollowed, cursor] = await Promise.all([
    database.manager.count(User),
    database.manager.count(User, {
      where: {
        follow: IsNull(),
        unfollow: IsNull(),
      },
    }),
    database.manager.count(User, {
      where: {
        follow: Not(IsNull()),
        unfollow: IsNull(),
      },
    }),
    database.manager.count(User, {
      where: {
        follow: Not(IsNull()),
        unfollow: Not(IsNull()),
      },
    }),
    getCursor(database),
  ]);
  const running = !!cursor.running;

  await database.manager.save(Statistic, {
    total,
    toFollow,
    followed,
    unfollowed,
    running,
  });

  log.info("generate-statistics end");
  await disconnect();
}

export default {
  handler: "src/functions/generate-statistics.main",
  maximumRetryAttempts: 0,
  events: [
    {
      schedule: {
        rate: ["rate(1 hour)"],
      },
    },
  ],
};
