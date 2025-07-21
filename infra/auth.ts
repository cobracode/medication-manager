// Create Cognito User Pool for authentication
export const userPool = new sst.aws.CognitoUserPool("MedicationManagerUserPool", {
  aliases: ["email"]
});

// Add a client to the user pool
export const userPoolClient = userPool.addClient("MedicationManagerWebClient");