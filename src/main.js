const { operation, containers: containerNames } = require('./modules/options');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getAllInspects, asyncTryLog } = require('./modules/utils');

// Main backup function
const backup = async () => {
  const containers = containerNames.length
    ? containerNames
    : await asyncTryLog(() => getContainers(), true);

  return Promise.all(containers.map(
    container => asyncTryLog(() => backupContainer(container)),
  ));
};

// Main restore function
const restore = async () => {
  const containers = containerNames.length
    ? containerNames
    : await asyncTryLog(() => getAllInspects(), true);

  return Promise.all(containers.map(
    container => asyncTryLog(() => restoreContainer(container)),
  ));
};

// Main method to run the tool
module.exports = async () => {
  const operations = { backup, restore };
  const results = await operations[operation]();

  // Check if we had any errors and log them again if there are
  const errors = results.filter(result => result instanceof Error);
  if (errors.length) {
    // eslint-disable-next-line no-console
    console.error('\nThe following errors occurred during the run (this does not include errors from the tar command used for volume backup/restore):');
    // eslint-disable-next-line no-console
    errors.map(err => console.error(err.message));
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('== Done ==');
  process.exit(0);
  return results;
};
