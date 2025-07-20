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
    const mysql = await import("./infra/db")

    const webapp = new sst.aws.Nextjs("WebApp", {
      path: "packages/web",
      link: [api.myApi]
    });

    return {
      "api-arn": api.myApi.arn,
      "webapp-url": webapp.url,
      "webapp-urn": webapp.urn,
      "webapp-sst-link": webapp.getSSTLink.toString(),
      "bucket-name": storage.bucket.name,
      mysql: mysql.mysql.host,
      "mysql-id": mysql.mysql.id,
      "mysql-database-get": mysql.mysql.database
    };
  },
});
