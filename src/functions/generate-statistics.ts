import database, {
  User,
  connect,
  disconnect,
  Statistic,
  getCursor,
} from "../database";
import { Logger } from "tslog";
import { IsNull, Not } from "typeorm";
import config from "../config";
import axios from "axios";
import { format } from "date-fns";

const log = new Logger(config.logs);

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

  if (new Date().getHours() == -1) {
    await axios.post(`${config.zenduty.url}/${config.zenduty.key}/`, {
      message: `Statistics ${format(new Date(), "yyyy-MM-dd '@' HH'h'mm")}`,
      summary: [
        `Total: ${total}`,
        `To follow: ${toFollow}`,
        `Followed: ${followed}`,
        `Unfollowed: ${unfollowed}`,
        `Running: ${running}`,
      ].join("\n"),
      alert_type: "critical",
    });
  }

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
