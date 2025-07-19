/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "medication-manager-monorepo",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "sst-user",
          region: "us-west-1"
        }
      }
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    const api = await import("./infra/api");

    return {
      "bucket-name": storage.bucket.name,
      "api-arn": api.myApi.arn
    };
  },
});
