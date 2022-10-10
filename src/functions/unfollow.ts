import database, { User, connect, disconnect } from "../database";
import config from "../config";
import { TwitterApi } from "twitter-api-v2";
import { Logger } from "tslog";
import { MoreThan } from "typeorm";
import { subHours } from "date-fns";
import normal from "@libs/normal";

const log = new Logger();

export async function main() {
  log.info("unfollow start");
  await connect();
  await database.synchronize();

  const twitterClient = new TwitterApi(config.twitter.bearerToken).v2.readWrite;

  const users = await database.manager.find(User, {
    where: {
      follow: MoreThan(subHours(new Date(), normal(24))),
      unfollow: undefined,
    },
    take: 10,
  });

  const { data: me } = await twitterClient.me();

  for (const user of users) {
    await twitterClient.unfollow(me.id, user.twitterId);
    log.debug("unfollow", user);
    user.unfollow = new Date();
    await database.manager.save(User, user);
  }

  log.info("unfollow end");
  await disconnect();
}

export default {
  handler: "src/functions/unfollow.main",
  maximumRetryAttempts: 0,
  events: [
    {
      schedule: {
        rate: ["rate(1 hour)"],
      },
    },
  ],
};
