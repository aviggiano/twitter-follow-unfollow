import type { AWS } from "@serverless/typescript";

import hello from "@functions/hello";
import follow from "@functions/follow";
import unfollow from "@functions/unfollow";
import toFollow from "@functions/to-follow";
import generateStatistics from "@functions/generate-statistics";

const serverlessConfiguration: AWS = {
  service: "twitter-follow-unfollow",
  frameworkVersion: "2",
  plugins: ["serverless-plugin-typescript", "serverless-dotenv-plugin"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    timeout: 15 * 60,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    lambdaHashingVersion: "20201221",
  },
  functions: { hello, toFollow, follow, unfollow, generateStatistics },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
