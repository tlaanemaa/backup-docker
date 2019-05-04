require('./modules/globalErrorHandlers');
const { operation, containers: containerNames } = require('./modules/options');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getInspectFilesSync, asyncTryLog } = require('./modules/utils');

// Main backup function
const backup = async () => {
  const containers = containerNames.length
    ? containerNames
    : () => getContainers();

  return Promise.all(containers.map(
    container => asyncTryLog(() => backupContainer(container)),
  ));
};

// Main restore function
const restore = async () => {
  const containers = containerNames.length
    ? containerNames
    : getInspectFilesSync();

  return Promise.all(containers.map(
    container => asyncTryLog(() => restoreContainer(container)),
  ));
};

// Main method to run the tool
module.exports = async () => {
  const operations = { backup, restore };
  const results = await operations[operation]();
  // eslint-disable-next-line no-console
  console.log('== Done ==');

  // Check if we had any errors and log them again if there are
  const errors = results.filter(result => result instanceof Error);
  if (errors.length) {
    throw new Error([
      '\nThe following errors occurred during the run (this does not include errors from the tar command used for volume backup/restore):',
      errors.map(e => e.message).join('\n'),
    ].join('\n'));
  }

  // Safeguard against hanging application
  process.exit(0);
  return results;
};
