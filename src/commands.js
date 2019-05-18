const { containers: containerNames } = require('./modules/options');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getContanerInspectFilesSync, logAndReturnErrors } = require('./modules/utils');

// Main backup function
const backup = async () => {
  // Get all container names if needed
  const containers = containerNames.length
    ? containerNames
    : await getContainers();

  // Backup containers
  return Promise.all(containers.map(
    async container => ({
      name: container,
      result: await logAndReturnErrors(backupContainer)(container),
    }),
  ));
};

// Main restore function
const restore = async () => {
  // Get all container names if needed
  const containers = containerNames.length
    ? containerNames
    : getContanerInspectFilesSync();

  // Restore containers
  return Promise.all(containers.map(
    async container => ({
      name: container,
      result: await logAndReturnErrors(restoreContainer)(container),
    }),
  ));
};

module.exports = {
  backup,
  restore,
};
