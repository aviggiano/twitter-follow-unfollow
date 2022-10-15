import database, { User, connect, disconnect, Cursor } from "../database";
import config from "../config";
import { TTweetv2UserField, TwitterApi, UserV2 } from "twitter-api-v2";
import { Logger } from "tslog";
import shouldFollow from "../libs/shouldFollow";
import { IsNull, Not } from "typeorm";
import waitFor from "../libs/waitFor";

const log = new Logger();

export async function main() {
  log.info("to-follow start");
  await connect();
  await database.synchronize();

  const users = await database.manager.find(User);

  const twitterClient = new TwitterApi(config.twitter.auth.bearerToken).v2
    .readOnly;

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

  let usersShouldFollow: UserV2[] = [];
  const meFollowing: UserV2[] = [];
  const toFollowFollowers: UserV2[] = [];

  let cursor = await database.manager.findOne(Cursor, {
    where: {
      id: Not(IsNull()),
    },
  });
  if (!cursor) {
    await database.manager.save(Cursor, {});
    cursor = (await database.manager.findOne(Cursor, {})) as Cursor;
  }
  while (true) {
    log.debug(cursor);
    const {
      data: meFollowingData,
      meta: { next_token: meToken },
    } = await twitterClient.following(me.id, {
      "user.fields": fields,
      pagination_token: cursor.me || undefined,
    });
    meFollowing.push(...meFollowingData);
    cursor.me = meToken;
    log.debug("me", meFollowingData.length, meFollowing.length, meToken);
    await database.manager.save(Cursor, cursor);

    const {
      data: toFollowFollowersData,
      meta: { next_token: toFollowToken },
    } = await twitterClient.followers(toFollow.id, {
      "user.fields": fields,
      pagination_token: cursor.toFollow || undefined,
    });
    toFollowFollowers.push(...toFollowFollowersData);
    cursor.toFollow;
    log.debug(
      "toFollow",
      toFollowFollowersData.length,
      toFollowFollowers.length,
      toFollowToken
    );
    await database.manager.save(Cursor, cursor);

    const difference = toFollowFollowers
      .filter(
        (toUser) => !meFollowing.map((meUser) => meUser.id).includes(toUser.id)
      )
      .filter((e) => !users.map((user) => user.id.toString()).includes(e.id));

    log.debug("difference", difference.length);

    usersShouldFollow = difference.filter(shouldFollow);
    log.debug("usersShouldFollow", usersShouldFollow.length);

    if (usersShouldFollow.length > 100 || (!cursor.me && !cursor.toFollow)) {
      break;
    }
    await waitFor(10e3);
  }

  const newUsers = usersShouldFollow.map((x) => ({
    twitterId: x.id,
    twitterUsername: x.username,
  }));

  await database.manager.save(User, newUsers);
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
