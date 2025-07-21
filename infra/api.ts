import { bucket } from "./storage";
import { mysql } from "./db";

// Care Recipients Lambda
const careRecipientsFunction = new sst.aws.Function("CareRecipientsFunction", {
  handler: "packages/functions/src/care-recipients.handler",
  link: [mysql, bucket],
});

// Medications Lambda  
const medicationsFunction = new sst.aws.Function("MedicationsFunction", {
  handler: "packages/functions/src/medications.handler",
  link: [mysql, bucket],
});

// User Profile Lambda
const userFunction = new sst.aws.Function("UserFunction", {
  handler: "packages/functions/src/user.handler", 
  link: [mysql, bucket],
});

// API Gateway with Cognito authentication and CORS
export const medicationApi = new sst.aws.ApiGatewayV2("MedicationApi", {
  cors: {
    allowOrigins: ["*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  }
});

// API Routes
medicationApi.route("GET /care-recipients", careRecipientsFunction.arn);
medicationApi.route("POST /care-recipients", careRecipientsFunction.arn);
medicationApi.route("PUT /care-recipients/{id}", careRecipientsFunction.arn);
medicationApi.route("DELETE /care-recipients/{id}", careRecipientsFunction.arn);

medicationApi.route("GET /medications", medicationsFunction.arn);
medicationApi.route("POST /medications", medicationsFunction.arn);
medicationApi.route("PUT /medications/{id}", medicationsFunction.arn);
medicationApi.route("PATCH /medications/{id}/complete", medicationsFunction.arn);
medicationApi.route("DELETE /medications/{id}", medicationsFunction.arn);

medicationApi.route("GET /user/profile", userFunction.arn);
medicationApi.route("PUT /user/profile", userFunction.arn);

// Keep legacy function for now
export const myApi = new sst.aws.Function("HelloWorldFunction", {
  url: true,
  link: [bucket],
  handler: "packages/functions/src/api.helloWorld"
});
