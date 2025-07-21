# Medication Manager
A simple medication tracking app.

## Questions
1. Can a user mark a medication as inactive, or is that reserved for admin/someone else?
1. What scale of users is expected? (100s, 1000s, millions, billions). Assuming 0-1M
1. What scale of medications are expected? Assuming 0-100.
1. Should users be able to modify a medication schedule?
   1. If so, and they delete all scheduled doses, should that mark the medication as inactive?
1. Should the care recipients fit into explicit categories (parent, child, pet, friend, ...)?


## Steps
- [x] Setup SST skeleton
  - [x] download/install SST
  - [x] setup config file
- [x] Setup DB skeleton
  - [ ] setup data model
- [x] Setup auth
  - [x] access user info in react
  - [ ] access user info in the lambda function
- [x] Setup backend skeleton
- [x] Setup frontend skeleton
- [ ] build components
- [ ] Add tests
- [ ] Fixes
  - [ ] Fix logout 400 error
  - [ ] Fix initially selected day in calendar view


## Requirements
1. User authentication (basic auth or API key)
1. user can:
   1. add medication for a care recipient
   1. define a schedule for each medication dose
   1. view a list of upcoming medication doses
   1. mark a medication dose as taken
1. each medication must have >= 1 scheduled dose
  1. upon adding a medication, force a dose to be entered before submitting
1. medications cannot be deleted, only marked as inactive (See ?)
1. schedule must support daily and weekly reccurrence

## Data model
1. user
   1. email
   1. name
1. care recipient
   1. name
   1. relationship
1. medication
   1. name
   1. 
1. medication schedule

## UI Components
1. Signup page
1. Login page
1. form to add a medication
1. component to mark a medication as inactive
1. form to define a dose schedule
   1. probably SMTWThFS format. Verify with internet which is standard for healthcare, if any
   1. needs calendar support to show doses in the future
1. list of upcoming medication doses
   1. assuming ordered by date
   1. ?: what size? paginated?

## Tech Stack
1. Infra: SST (API Gateway, Lambda, ...)
1. Backend: Typescript (covered by SST)
1. Frontend: React SSR

--------

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
