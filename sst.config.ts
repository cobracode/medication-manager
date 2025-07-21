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
      link: [api.myApi],
      environment: {
        NEXT_PUBLIC_COGNITO_ISSUER: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lEyFKjDvb",
        NEXT_PUBLIC_COGNITO_CLIENT_ID: "cq3ooogjeamql973kmvi10qh1",
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000' // input?.stage === "production" ? '' : ''
      }
    });

/*
// const cognitoAuthConfig = {
//   authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lEyFKjDvb",
//   client_id: "cq3ooogjeamql973kmvi10qh1",
//   redirect_uri: "http://localhost:3000/api/callback",
//   response_type: "code",
//   scope: "email openid phone",
// };

const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_COGNITO_ISSUER!, // e.g., https://cognito-idp.region.amazonaws.com/userPoolId
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/api/callback',
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  silent_redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/silent-callback',
};
*/

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
