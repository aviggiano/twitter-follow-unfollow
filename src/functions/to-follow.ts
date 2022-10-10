import database, { User, connect, disconnect } from "../database";
import config from "../config";
import { TTweetv2UserField, TwitterApi, UserV2 } from "twitter-api-v2";
import { Logger } from "tslog";
import { differenceInYears } from "date-fns";

const log = new Logger();

export async function main() {
  log.info("to-follow start");
  await connect();
  await database.synchronize();

  const twitterClient = new TwitterApi(config.twitter.bearerToken).v2.readWrite;

  const { data: toFollow } = await twitterClient.userByUsername(
    config.twitter.toFollowUsername
  );
  const { data: me } = await twitterClient.me();
  const fields: TTweetv2UserField[] = [
    "created_at",
    "description",
    "id",
    "name",
    "profile_image_url",
    "public_metrics",
    "username",
  ];

  const final: UserV2[] = [];
  let meFollowingNext = undefined;
  let toFollowFollowersNext = undefined;
  while (true) {
    const {
      data: meFollowing,
      meta: { next_token: meToken },
    } = await twitterClient.following(me.id, {
      "user.fields": fields,
      pagination_token: meFollowingNext,
    });
    meFollowingNext = meToken as string;
    const {
      data: toFollowFollowers,
      meta: { next_token: toFollowToken },
    } = await twitterClient.followers(toFollow.id, {
      "user.fields": fields,
      pagination_token: toFollowFollowersNext,
    });
    toFollowFollowersNext = toFollowToken as string;

    const difference = toFollowFollowers.filter(
      (x) => !meFollowing.map((e) => e.id).includes(x.id)
    );

    final.concat(
      ...difference.filter(
        (x) =>
          x.public_metrics?.following_count &&
          x.public_metrics?.following_count > 100 &&
          x.public_metrics?.following_count &&
          x.public_metrics?.following_count > 100 &&
          x.public_metrics?.tweet_count &&
          x.public_metrics?.tweet_count > 100 &&
          x.public_metrics?.listed_count &&
          x.public_metrics?.listed_count > 0 &&
          x.profile_image_url &&
          x.description &&
          x.created_at &&
          differenceInYears(new Date(x.created_at), new Date()) > 0
      )
    );

    if (
      final.length > 100 ||
      (meFollowing.length === 0 && toFollowFollowers.length === 0)
    ) {
      break;
    }
  }

  const users = final.map((x) => ({
    twitterId: x.id,
    twitterUsername: x.username,
  }));

  await database.manager.save(User, users);
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
