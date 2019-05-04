const { containers: containerNames } = require('./modules/options');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getInspectFilesSync, logAndReturnErrors } = require('./modules/utils');

// Main backup function
const backup = async () => {
  // Get all container names if needed
  const containers = containerNames.length
    ? containerNames
    : () => getContainers();

  // Backup containers
  return Promise.all(containers.map(
    logAndReturnErrors(backupContainer),
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
    logAndReturnErrors(restoreContainer),
  ));
};

module.exports = {
  backup,
  restore,
};
