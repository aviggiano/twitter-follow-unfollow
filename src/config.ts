import * as dotenv from "dotenv";
dotenv.config();

export default {
  unfollowAfterDays: 4,
  rate: {
    unfollow: "rate(2 hours)",
    follow: "rate(4 hours)",
    generateStatistics: "rate(1 day)",
    toFollow: "rate(30 days)",
  },
  twitter: {
    auth: {
      bearerToken: process.env.TWITTER_BEARER_TOKEN!,
      appKey: process.env.TWITTER_APP_KEY!,
      appSecret: process.env.TWITTER_APP_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    },
    toFollowUsername: process.env.TWITTER_TO_FOLLOW_USERNAME!,
    meUsername: process.env.TWITTER_ME_USERNAME!,
  },
  zenduty: {
    key: process.env.ZENDUTY_KEY!,
    url: process.env.ZENDUTY_URL!,
  },
  logs: {
    colorizePrettyLogs: process.env.NODE_ENV === undefined,
  },
  postgres: {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT!),
    username: process.env.POSTGRES_USERNAME!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DATABASE!,
    logging: Boolean(process.env.POSTGRES_LOGGING ?? false),
  },
};
