import database, { User, connect, disconnect, getCursor } from "../database";
import config from "../config";
import { TwitterApi } from "twitter-api-v2";
import { Logger } from "tslog";
import { IsNull, LessThan } from "typeorm";
import { subDays } from "date-fns";

const log = new Logger(config.logs);

export async function main() {
  log.info("unfollow start");
  await connect();
  await database.synchronize();

  const cursor = await getCursor(database);
  if (!cursor.running) {
    log.info("not runnning");
    return;
  }

  const client = new TwitterApi({
    appKey: config.twitter.auth.appKey,
    appSecret: config.twitter.auth.appSecret,
    accessToken: config.twitter.auth.accessToken,
    accessSecret: config.twitter.auth.accessSecret,
  });

  const twitterClient = client.v2.readWrite;

  const users = await database.manager.find(User, {
    where: {
      follow: LessThan(subDays(new Date(), 7)),
      unfollow: IsNull(),
    },
    take: 1,
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
        rate: ["rate(6 hours)"],
      },
    },
  ],
};
