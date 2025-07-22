# Medication Manager
A simple medication tracking app!

## Setup Instructions
1. Go to the [Medication Manager](https://d3e7xe6qxi2zx7.cloudfront.net/).
2. Create an account with your email by clicking Create an account.
3. Check your email for the verification code and enter it when prompted.
4. Now in the app, you'll see a few Care Recipients that you can add medication for.
5. Click **Add Medication** to add a medication for a Care Recipient and a date and time, with optional recurrence.
6. The medication will show up on the date(s) you chose in the Medication Schedule, and on the Care Recipients side panel.
7. You can mark individual medication doses as **taken**.
8. You can also mark individual or recurring medication doses as **inactive**, for the current Care Recipient, or for all Care Recipients (say, a medication has a recall and must not be used immediately).


## Deprioritized Scope
Most of my time was spent debugging AWS Cognito issues and then DB connectivity based on the availability zones I had set. Some confusion also took time in seeing documentation and examples from SST v2 that were incompatible with v3, which took a while to understand and then fix. I'd hoped to get to these sooner, but they remain:

**Deferred items:**
1. Fixing a few logic bugs: There's a bug around the current day and the week in the calendar view.
2. Unit tests: while there is a script or two for testing out database functionality, unit tests were deferred to get the core functionality running.
3. Refactoring the code, now that it's in working order, to remove some of the cruft from prototyping various ways to do things. This includes more solid and secure config for things like environment variables in `sst.config.ts`.
4. (Possibly) Better error messages: while HTTP status codes are largely correct and the error messages basic, but adequate, with time I'd of liked to audit them and make them stronger, if applicable.


## Design Choice and Trade-offs
### Infra: [SST v3](https://sst.dev/)
This being a serverless, cloud-native web application brought to mind Serverless Stack Toolkit (SST), as it could handle the details of AWS ApiGateway, Lambda, RDS, and even user auth via Cognito. I'd never tried it before and this project felt like a good time to learn. Particularly as I learned that Homethrive uses or is looking into using it.

| Pros | Cons |
|------|------|
| No need to learn/remember many AWS implementation details | Learning curve that took some good hours. TBF, many of those hours were with AWS Cognito and RDS issues |
| It's now something I've learned and used directly ||
| Knowing it would help at Homethrive ||

### Frontend: React + NextJS + Tailwind CSS
React was part of the requirements, and I did think about whether or not to use NextJS and Tailwind CSS along with it. I chose to use it due to its "batteries included" approach to the router, first-class support for SPA/SSR, and hot reloading.

| Pros | Cons |
|------|------|
| Many required pieces work out of the box | Bulkier |
| NextJS handles performance optimization ||


### Auth: AWS Cognito
I'd never tried this before, and when I learned it took care of user storage and auth, with many customizable options, including required user details fields, I wanted to give it a shot in this serverless-oriented tech stack that is already heavily AWS-leaning. I thought about using the OpenAuth that SST also recommends, which would have been a solid basic way to roll my own UX pages/modals for signup and signin, but wanted to be free of that for this project, and see just how simple Cognito could make things. Unfortunately, there was a big learning curve to this, including me manually creating a User Pool, per internet forums and AI's recommendations, which at times conflicted with the one spun up by SST. And the process of debugging what was going on, and which settings were being used where, took hours.

Having said that, I now understand Cognito much better and how it plays with SST.

| Pros | Cons |
|------|------|
| Takes care of user provisiong | Learning curve of itself |
| Takes care of auth | Learning curve of using it with SST |
| Takes care of UI for signup/signin | |
| Many configurable options in the User Pool settings (MFA, Google, etc. IdP) | |


### Backend: AWS ApiGatewayV2 + AWS Lambda, via SST
This was also part of the requirements, but it was nice to develop fully serverless.

| Pros | Cons |
|------|------|
| Quick to setup | Learning curve. While quick in theory, it's the runtime details and config mismatches that get you. |
| Took care of provisioning, deploying, and all the gruntwork of hosting a web service ||


### Database: AWS RDS + MySQL
The data is fairly straightfoward, and using a SQL-family language makes CRUD operations simple and easy to find the relationships between them. I thought about DynamoDB but the scaling performance edge it may have over MySQL wasn't needed for this simple webapp.

| Pros | Cons |
|------|------|
| Simple for CRUD operations | RDS setup within a VPC and having to use a NAT with the right settings took time to debug |
| Good for querying relationships between entities | Not as simple "out of the box" as a NoSQL document |

<br><br><br><br>


# *Below is the SST monorepo template this project was born out of:*

<br><br>

# Monorepo Template

A template to create a monorepo SST v3 project. [Learn more](https://sst.dev/docs/set-up-a-monorepo).

## Get started

1. Use this template to [create your own repo](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).

2. Clone the new repo.

   ```bash
   git clone <REPO_URL> MY_APP
   cd MY_APP
   ```

3. Rename the files in the project to the name of your app.

   ```bash
   npx replace-in-file '/medication-manager/g' 'MY_APP' '**/*.*' --verbose
   ```

4. Deploy!

   ```bash
   npm install
   npx sst deploy
   ```

5. Optionally, enable [_git push to deploy_](https://sst.dev/docs/console/#autodeploy).

## Usage

This template uses [npm Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces). It has 3 packages to start with and you can add more it.

1. `core/`

   This is for any shared code. It's defined as modules. For example, there's the `Example` module.

   ```ts
   export module Example {
     export function hello() {
       return "Hello, world!";
     }
   }
   ```

   That you can use across other packages using.

   ```ts
   import { Example } from "@aws-monorepo/core/example";

   Example.hello();
   ```

   We also have [Vitest](https://vitest.dev/) configured for testing this package with the `sst shell` CLI.

   ```bash
   npm test
   ```

2. `functions/`

   This is for your Lambda functions and it uses the `core` package as a local dependency.

3. `scripts/`

    This is for any scripts that you can run on your SST app using the `sst shell` CLI and [`tsx`](https://www.npmjs.com/package/tsx). For example, you can run the example script using:

   ```bash
   npm run shell src/example.ts
   ```

### Infrastructure

The `infra/` directory allows you to logically split the infrastructure of your app into separate files. This can be helpful as your app grows.

In the template, we have an `api.ts`, and `storage.ts`. These export the created resources. And are imported in the `sst.config.ts`.

---

**Join our community** [Discord](https://sst.dev/discord) | [YouTube](https://www.youtube.com/c/sst-dev) | [X.com](https://x.com/SST_dev)
