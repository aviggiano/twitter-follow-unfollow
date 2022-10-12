import database, { User, connect, disconnect } from "../database";
import config from "../config";
import { TwitterApi } from "twitter-api-v2";
import { Logger } from "tslog";
import { IsNull, LessThan } from "typeorm";
import { subHours } from "date-fns";
import normal from "@libs/normal";

const log = new Logger();

export async function main() {
  log.info("unfollow start");
  await connect();
  await database.synchronize();

  const client = new TwitterApi({
    appKey: config.twitter.auth.appKey,
    appSecret: config.twitter.auth.appSecret,
    accessToken: config.twitter.auth.accessToken,
    accessSecret: config.twitter.auth.accessSecret,
  });

  const twitterClient = client.v2.readWrite;

  const users = await database.manager.find(User, {
    where: {
      follow: LessThan(subHours(new Date(), normal(24))),
      unfollow: IsNull(),
    },
    take: 15,
  });
  log.debug("users", users.length);

  const { data: me } = await twitterClient.userByUsername(
    config.twitter.meUsername
  );
  log.debug(me);

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
