/* eslint-disable prettier/prettier */
import { execSync } from 'child_process';
import { DEFAULT_WORKSPACES } from './utils';

const ERR_MSG =
  'To avoid possible issues it is only allowed to publish a package from the latest version of the master branch.';

const workspaces = process.argv.slice(2)?.length ? process.argv.slice(2) : DEFAULT_WORKSPACES;

function npmPublish(packageName: string): void {
  console.log('Publishing NPM package.');
  switch (packageName) {
    case '@livit/portal.cms.payload-openapi':
      {
        console.log(`Building package ${packageName}`);
        execSync(`npm run build -w ${packageName}`, { stdio: 'inherit' });
        execSync(`npm publish -w ${packageName} --access public`, { stdio: 'inherit' });
      }
      break;
    case '@livit/portal.cms.payload-swagger':
      {
        console.log(`Building dependancy for ${packageName}`);
        execSync(`npm run build -w @livit/portal.cms.payload-openapi`, { stdio: 'inherit' });
        console.log(`Building package ${packageName}`);
        execSync(`npm run build -w ${packageName}`, { stdio: 'inherit' });
        execSync(`npm publish -w ${packageName} --access public`, { stdio: 'inherit' });
      }
      break;
  }
}

void (async () => {
  try {
    console.log('Fetching refs from origin.');
    execSync('git fetch', { stdio: 'inherit' });

    console.log('Checking if local working directory is in sync with origin/master.');
    const gitStatus = execSync('git status --branch --porcelain').toString().trimEnd();
    if (!gitStatus.startsWith('## master...')) {
      console.error(`You are not on the master branch. ${ERR_MSG}`);
      process.exit(1);
    }
    // this will not match if the local is ahead or behind the origin, the HEAD is detached or if there are any staged, unstaged or untracked changes in the working directory
    if (gitStatus !== '## master...origin/master') {
      console.error(`Your working directory is not in sync with origin/master. ${ERR_MSG}`);
      process.exit(1);
    }

    console.log('Installing package dependencies.');
    console.log(workspaces);
    execSync('npm install', { stdio: 'inherit' });
    for (const workspace of workspaces) {
      npmPublish(workspace);
    }
  } catch (e) {
    console.error(`An unexpected error occurred: ${e as string}`);
    process.exit(1);
  }
})();
