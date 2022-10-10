import * as dotenv from "dotenv";
dotenv.config();

export default {
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN!,
    toFollowUsername: process.env.TWITTER_TO_FOLLOW_USERNAME!,
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
