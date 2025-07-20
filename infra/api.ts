import { bucket } from "./storage";

export const myApi = new sst.aws.Function("HelloWorldFunction", {
  url: true,
  link: [bucket],
  handler: "packages/functions/src/api.helloWorld"
});
