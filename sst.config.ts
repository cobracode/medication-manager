/// <reference path="./.sst/platform/config.d.ts" />

const LOCAL_PORT = 3000;
const LOCAL_APP_URL = `http://localhost:${LOCAL_PORT}`;
const PROD_APP_URL = "https://dshmeepf8hsf0.cloudfront.net";

// Switch between envs
// const USE_APP_URL = LOCAL_APP_URL;
const USE_APP_URL = PROD_APP_URL;

const environment = {
  APP_URL: USE_APP_URL,
  LOCAL_PORT,
  AWS_COGNITO_CLIENT_ID: "6q4gvq3h4e3nlkhg7up41l1fle",
  AWS_COGNITO_DOMAIN: "https://medication-manager.auth.us-west-1.amazoncognito.com",
  AWS_COGNITO_ISSUER: "https://cognito-idp.us-west-1.amazonaws.com/us-west-1_ws3E81kzB",
  AWS_LOGOUT_URI: USE_APP_URL,
  AWS_REGION: "us-west-1",
  SST_USER: "sst-user"
};

export default $config({
  app(input) {
    return {
      name: "medication-manager-monorepo",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws", // must use the literal here to satisfy the type
      providers: {
        aws: {
          profile: environment.SST_USER,
          region: "us-west-1" // must use the literal here to satisfy the aws.Region type
        }
      }
    };
  },
  async run() {
    const auth = await import("./infra/auth");
    const api = await import("./infra/api");
    const mysql = await import("./infra/db");
    const db = await import("./infra/db");

    const webapp = new sst.aws.Nextjs("WebApp", {
      path: "packages/web",
      link: [api.medicationApi],
      environment: {
        NEXT_PUBLIC_COGNITO_CLIENT_ID: environment.AWS_COGNITO_CLIENT_ID,
        NEXT_PUBLIC_COGNITO_DOMAIN: environment.AWS_COGNITO_DOMAIN,
        NEXT_PUBLIC_COGNITO_ISSUER: environment.AWS_COGNITO_ISSUER,
        NEXT_PUBLIC_LOGOUT_URI: environment.AWS_LOGOUT_URI,
        NEXT_PUBLIC_APP_URL: USE_APP_URL, // Updated for production deployment
        NEXT_PUBLIC_API_URL: api.medicationApi.url
      }
    });

    return {
      "medication-api-url": api.medicationApi.url,
      // FOR DEBUGGING ---
      // "webapp-url": webapp.url,
      // "webapp-urn": webapp.urn,
      // "webapp-sst-link": webapp.getSSTLink.toString(),
      // mysql: mysql.mysql.host,
      // "mysql-id": mysql.mysql.id,
      // "mysql-database-get": mysql.mysql.database,
      // "cognito-user-pool-id": auth.userPool.id,
      // "cognito-client-id": auth.userPoolClient.id,
      // "userpool-id": auth.userPool.id,
      // "userpool-urn": auth.userPool.urn,
      // "userpool-arn": auth.userPool.arn,
      // "userpoolclient-id": auth.userPoolClient.id,
      // "userpoolclient-urn": auth.userPoolClient.urn,
      // "mysql-user": db.mysql.username,
      // "mysql-password": db.mysql.password,
      // "mysql-database": db.mysql.database,
      // "mysql-host": db.mysql.host  
    };
  },
});
