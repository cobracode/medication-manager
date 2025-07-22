import { bucket } from "./storage";
import { mysql } from "./db";
import { vpc } from "./vpc";

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
  link: [mysql, bucket],
});

// User Profile Lambda
const userFunction = new sst.aws.Function("UserFunction", {
  vpc,
  handler: "packages/functions/src/user.handler", 
  link: [mysql, bucket],
});

// API Gateway with Cognito JWT authentication and CORS
export const medicationApi = new sst.aws.ApiGatewayV2("MedicationApi", {
  vpc,
  cors: {
    allowOrigins: ["https://d3e7xe6qxi2zx7.cloudfront.net", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
  
});

/*
1. add authorizer
2. connect it to each route


*/


// FROM DOCS
// const authorizer = api.addAuthorizer({
//   name: "myCognitoAuthorizer",
//   jwt: {
//     issuer: $interpolate`https://cognito-idp.${aws.getArnOutput(userPool).region}.amazonaws.com/${userPool.id}`,
//     audiences: [userPoolClient.id]
//   }
// });


// Create JWT Authorizer for Cognito - TEMP TURNING OFF TO SEE IF IT WORKS
// const cognitoAuthorizer = medicationApi.addAuthorizer({
//   name: "CognitoJwtAuthorizer",
//   jwt: {
//       // issuer: $interpolate`https://cognito-idp.us-west-1.amazonaws.com/${userPool.id}`,
//       issuer: $interpolate`https://cognito-idp.${aws.getArnOutput(userPool).region}.amazonaws.com/${userPool.id}`,
//       audiences: [userPoolClient.id]
//     }
// });
  
// const myAuthorizer = api.addAuthorizer({
//   name: "MyAuthorizer",
//   userPools: [userPool.arn]
// });

// api.route("GET /bar", "route.handler", {
//   auth: {
//     jwt: {
//       issuer:
//         "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Rq4d8zILG",
//       audiences: ["user@example.com"],
//     },
//   },
// });

// API Routes with Cognito JWT Authorization
// medicationApi.route("GET /care-recipients", careRecipientsFunction.arn, {
//   auth: { jwt: {
//     issuer: $interpolate`https://cognito-idp.us-west-1.amazonaws.com/${userPool.id}`,
//     audiences: [userPoolClient.id]
//    } }
// });


// idea: take off auth and see if we can hit the endpoint
medicationApi.route("GET /care-recipients", careRecipientsFunction.arn);
medicationApi.route("POST /care-recipients", careRecipientsFunction.arn);
medicationApi.route("PUT /care-recipients/{id}", careRecipientsFunction.arn);
medicationApi.route("DELETE /care-recipients/{id}", careRecipientsFunction.arn);

medicationApi.route("GET /medications", medicationsFunction.arn);
medicationApi.route("POST /medications", medicationsFunction.arn);
medicationApi.route("PUT /medications/{id}", medicationsFunction.arn,);
medicationApi.route("PATCH /medications/{id}/complete", medicationsFunction.arn);
medicationApi.route("PATCH /medications/{id}/inactive", medicationsFunction.arn);
medicationApi.route("DELETE /medications/{id}", medicationsFunction.arn);

medicationApi.route("GET /user/profile", userFunction.arn);
medicationApi.route("PUT /user/profile", userFunction.arn);








// ROUTES WITH AUTH
// medicationApi.route("GET /care-recipients", careRecipientsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("POST /care-recipients", careRecipientsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("PUT /care-recipients/{id}", careRecipientsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("DELETE /care-recipients/{id}", careRecipientsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });

// medicationApi.route("GET /medications", medicationsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("POST /medications", medicationsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("PUT /medications/{id}", medicationsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("PATCH /medications/{id}/complete", medicationsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("DELETE /medications/{id}", medicationsFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });

// medicationApi.route("GET /user/profile", userFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });
// medicationApi.route("PUT /user/profile", userFunction.arn, {
//   auth: { jwt: { authorizer: cognitoAuthorizer.id } }
// });

// Keep legacy function for now
export const myApi = new sst.aws.Function("HelloWorldFunction", {
  url: true,
  link: [bucket],
  handler: "packages/functions/src/api.helloWorld"
});
