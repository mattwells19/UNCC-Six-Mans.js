# Getting Up and Running with NormJS

## Install NodeJS

Discord.js requires Node 16.6.0 or newer. Go to [nodejs.org](https://nodejs.org/en/), download and install NodeJS 16.6.0 or newer. Be sure to include NPM and adding Node to your PATH during installation.

- NPM stands for Node Package Manager and is a command-line tool for managing dependencies of projects.
- You can verify node is installed by opening a terminal and typing `node --version`. Verify the version matches the requirements above.

## Installing Dependencies

Once Node and NPM are installed, open a terminal and navigate to the root of this project. Run the command `npm install`. This will install all of the dependencies needed for running the project.

- To see a list of the dependencies for this project open the `package.json` in the root of this project. You'll notice two sections called `dependencies` and `devDependencies`. Dependencies are the packages that will be included when building the app for production. Dev dependencies are only used during development. This helps keep the bundle size small when deploying to production.
- You'll notice that a new folder is automatically added called `node_modules`. This folder holds the source for all of the project's dependencies. This folder should not be committed to source control.

## Running the Code

Discord bots require a token to authenticate with the Discord API. The token should **never** be put into source control. Create a file named `.env` in the root of the project. In this new file add `token=[Discord token]` where `[Discord token]` is the token for your bot.

Now that our dependencies are installed and our token is set we can run the code. Type `npm start` to start the bot. To stop the bot hit `CTRL + C` in the running terminal.

This project uses ESLint to enforce code standards and consistency. To check to see if there are any issues run the command `npm run lint`. If the report concludes without any errors or warnings then there are no issues. Otherwise, it will include the error and file name to check.

## Tests

This project uses [Jest](https://jestjs.io/) and [ts-jest](https://www.npmjs.com/package/ts-jest) for writing and running tests. Test files are denoted by files with the `.spec.ts` extension. To run tests use the command `npm run test`. This will run every test file found in the project. To run tests for a specific file use the command `npm run test [file name]`.
