const { containers: containerNames } = require('./modules/options');
const { logAndReturnErrors } = require('./modules/utils');
const { containerInspects } = require('./modules/fileStructure.js');
const { getAllContainers, restoreContainer, backupContainer } = require('./modules/docker');

// Main backup function
const backup = async () => {
  // Get all container names if needed
  const containers = containerNames.length
    ? containerNames
    : await getAllContainers();

  // Backup containers
  return Promise.all(containers.map(
    async (container) => ({
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
    : containerInspects;

  // Restore containers
  return Promise.all(containers.map(
    async (container) => ({
      name: container,
      result: await logAndReturnErrors(restoreContainer)(container),
    }),
  ));
};

module.exports = {
  backup,
  restore,
};
