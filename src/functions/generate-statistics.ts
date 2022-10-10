import database, { User, connect, disconnect, Statistic } from "../database";
import { Logger } from "tslog";

const log = new Logger();

export async function main() {
  log.info("generate-statistics start");
  await connect();
  await database.synchronize();

  const [users] = await Promise.all([database.manager.count(User)]);

  await database.manager.save(Statistic, {
    users,
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
