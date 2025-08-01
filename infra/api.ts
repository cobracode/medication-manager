import { mysql } from "./db";
import { vpc } from "./vpc";
import { userPoolClient } from "./auth";

// Care Recipients Lambda
const careRecipientsFunction = new sst.aws.Function("CareRecipientsFunction", {
  vpc,
  handler: "packages/functions/src/care-recipients.handler",
  link: [mysql],
});

// Medications Lambda  
const medicationsFunction = new sst.aws.Function("MedicationsFunction", {
  vpc,
  handler: "packages/functions/src/medications.handler",
  link: [mysql],
});

// User Profile Lambda
const userFunction = new sst.aws.Function("UserFunction", {
  vpc,
  handler: "packages/functions/src/user.handler", 
  link: [mysql],
});

// API Gateway with Cognito JWT authentication and CORS
export const medicationApi = new sst.aws.ApiGatewayV2("MedicationApi", {
  vpc,
  cors: {
    allowOrigins: ["https://dshmeepf8hsf0.cloudfront.net", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
});

// Create JWT Authorizer for Cognito
const cognitoAuthorizer = medicationApi.addAuthorizer({
  name: "CognitoJwtAuthorizer",
  jwt: {
      // issuer: $interpolate`https://cognito-idp.${aws.getArnOutput(userPool).region}.amazonaws.com/${userPool.id}`,
      issuer: "https://cognito-idp.us-west-1.amazonaws.com/us-west-1_ws3E81kzB",
      audiences: [userPoolClient.id]
    }
});

// idea: take off auth and see if we can hit the endpoint
medicationApi.route("GET /care-recipients", careRecipientsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("POST /care-recipients", careRecipientsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("PUT /care-recipients/{id}", careRecipientsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("DELETE /care-recipients/{id}", careRecipientsFunction.arn), { auth: { jwt: { authorizer: cognitoAuthorizer.id } } };

medicationApi.route("GET /medications", medicationsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("POST /medications", medicationsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("PUT /medications/{id}", medicationsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("PATCH /medications/{id}/complete", medicationsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("PATCH /medications/{id}/inactive", medicationsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("DELETE /medications/{id}", medicationsFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });

medicationApi.route("GET /user/profile", userFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });
medicationApi.route("PUT /user/profile", userFunction.arn, { auth: { jwt: { authorizer: cognitoAuthorizer.id } } });