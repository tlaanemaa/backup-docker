const { containers: containerNames, operateOnVolumes } = require('./modules/options');
const { getContainerInspectFilesSync, logAndReturnErrors } = require('./modules/utils');
const {
  getContainers,
  restoreContainer,
  backupContainer,
  ensureVolumeImageExists,
} = require('./modules/docker');

// Main backup function
const backup = async () => {
  // Make sure we have the volume operations image if we plan to use it
  if (operateOnVolumes) await ensureVolumeImageExists();

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
  // Make sure we have the volume operations image if we plan to use it
  if (operateOnVolumes) await ensureVolumeImageExists();

  // Get all container names if needed
  const containers = containerNames.length
    ? containerNames
    : getContainerInspectFilesSync();

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
