const { operation, containers: containerNames } = require('./modules/options');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getInspectFilesSync } = require('./modules/utils');

// Main backup function
const backup = async () => {
  // Get all container names if needed
  const containers = containerNames.length
    ? containerNames
    : () => getContainers();

  // Backup containers
  return Promise.all(containers.map(
    async (container) => {
      try {
        return await backupContainer(container);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e.message);
        return e;
      }
    },
  ));
};

// Main restore function
const restore = async () => {
  // Get all container names if needed
  const containers = containerNames.length
    ? containerNames
    : getInspectFilesSync();

  // Restore containers
  return Promise.all(containers.map(
    async (container) => {
      try {
        return await restoreContainer(container);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e.message);
        return e;
      }
    },
  ));
};

// Main method to run the tool
module.exports = async () => {
  const operations = { backup, restore };
  const results = await operations[operation]();
  // eslint-disable-next-line no-console
  console.log('== Done ==');

  // Check if we had any errors and throw them if there are
  const errors = results.filter(result => result instanceof Error);
  if (errors.length) {
    const errorHeader = '\nThe following errors occurred during the run (this does not include errors from the tar command used for volume backup/restore):';
    const errorMessages = errors.map(e => e.message).join('\n');
    throw new Error(errorHeader + errorMessages);
  }

  return results;
};
