import database, {
  User,
  connect,
  disconnect,
  Cursor,
  getCursor,
} from "../database";
import config from "../config";
import { TTweetv2UserField, TwitterApi, UserV2 } from "twitter-api-v2";
import { Logger } from "tslog";
import shouldFollow from "../libs/shouldFollow";
import waitFor from "../libs/waitFor";

const log = new Logger(config.logs);

const RUNS = 5;

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

  const cursor = await getCursor(database);

  for (let i = 0; i < RUNS; i++) {
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

    await waitFor(1e3);
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
        rate: [config.rate.toFollow],
      },
    },
  ],
};
