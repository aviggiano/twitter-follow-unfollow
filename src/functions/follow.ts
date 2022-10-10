import database, { User, connect, disconnect } from "../database";
import config from "../config";
import { TwitterApi } from "twitter-api-v2";
import { Logger } from "tslog";

const log = new Logger();

export async function main() {
  log.info("follow start");
  await connect();
  await database.synchronize();

  const twitterClient = new TwitterApi(config.twitter.bearerToken).v2.readWrite;

  const users = await database.manager.find(User, {
    where: {
      follow: undefined,
      unfollow: undefined,
    },
    take: 10,
  });

  const { data: me } = await twitterClient.me();

  for (const user of users) {
    await twitterClient.follow(me.id, user.twitterId);
    log.debug("follow", user);
    user.follow = new Date();
    await database.manager.save(User, user);
  }

  log.info("follow end");
  await disconnect();
}

export default {
  handler: "src/functions/follow.main",
  maximumRetryAttempts: 0,
  events: [
    {
      schedule: {
        rate: ["rate(1 hour)"],
      },
    },
  ],
};
