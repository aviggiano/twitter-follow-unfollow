import database, { User, connect, disconnect } from "../database";
import config from "../config";
import { TTweetv2UserField, TwitterApi, UserV2 } from "twitter-api-v2";
import { Logger } from "tslog";
import shouldFollow from "@libs/shouldFollow";

const log = new Logger();

export async function main() {
  log.info("to-follow start");
  await connect();
  await database.synchronize();

  const twitterClient = new TwitterApi(config.twitter.bearerToken).v2.readWrite;

  const { data: toFollow } = await twitterClient.userByUsername(
    config.twitter.toFollowUsername
  );
  log.debug(toFollow);
  const { data: me } = await twitterClient.userByUsername(
    config.twitter.meUsername
  );
  log.debug(me);

  const fields: TTweetv2UserField[] = [
    "created_at",
    "description",
    "id",
    "name",
    "profile_image_url",
    "public_metrics",
    "username",
  ];

  let final: UserV2[] = [];
  const meFollowing: UserV2[] = [];
  const toFollowFollowers: UserV2[] = [];

  let meFollowingNext = undefined;
  let toFollowFollowersNext = undefined;
  while (true) {
    if (meFollowingNext || meFollowing.length === 0) {
      const {
        data: meFollowingData,
        meta: { next_token: meToken },
      } = await twitterClient.following(me.id, {
        "user.fields": fields,
        pagination_token: meFollowingNext,
      });
      meFollowing.push(...meFollowingData);
      meFollowingNext = meToken as string;
      log.debug("me", meFollowingData.length, meFollowing.length, meToken);
    }

    if (toFollowFollowersNext || toFollowFollowers.length === 0) {
      const {
        data: toFollowFollowersData,
        meta: { next_token: toFollowToken },
      } = await twitterClient.followers(toFollow.id, {
        "user.fields": fields,
        pagination_token: toFollowFollowersNext,
      });
      toFollowFollowers.push(...toFollowFollowersData);
      toFollowFollowersNext = toFollowToken as string;
      log.debug(
        "toFollow",
        toFollowFollowersData.length,
        toFollowFollowers.length,
        toFollowToken
      );
    }

    const difference = toFollowFollowers.filter(
      (x) => !meFollowing.map((e) => e.id).includes(x.id)
    );
    log.debug("difference", difference.length);

    final = difference.filter(shouldFollow);
    log.debug("final", final.length);

    if (final.length > 100 || (!meFollowingNext && !toFollowFollowersNext)) {
      break;
    }
  }

  const users = final.map((x) => ({
    twitterId: x.id,
    twitterUsername: x.username,
  }));

  await database.manager.save(User, users);
  await disconnect();
}

export default {
  handler: "src/functions/to-follow.main",
  maximumRetryAttempts: 0,
  events: [
    {
      schedule: {
        rate: ["rate(24 hours)"],
      },
    },
  ],
};
