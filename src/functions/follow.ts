import database, { User, connect, disconnect, getCursor } from "../database";
import config from "../config";
import { TwitterApi } from "twitter-api-v2";
import { Logger } from "tslog";
import { IsNull } from "typeorm";

const log = new Logger(config.logs);

export async function main() {
  log.info("follow start");
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
      follow: IsNull(),
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
        rate: [config.rate.follow],
      },
    },
  ],
};
