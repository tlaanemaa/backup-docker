require('./modules/folderStructure');
const { operation, containers: containerNames } = require('./modules/options');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getAllContainerConfigs } = require('./modules/utils');

// Main backup function
const backup = async () => {
  const containers = containerNames.length ? containerNames : await getContainers();
  return Promise.all(containers.map(async (container) => {
    try {
      await backupContainer(container);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      return false;
    }
  }));
};

// Main restore function
const restore = async () => {
  const containers = containerNames.length ? containerNames : await getAllContainerConfigs();
  return Promise.all(containers.map(async (container) => {
    try {
      await restoreContainer(container);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      return false;
    }
  }));
};

// Run the operation requested in an async wrapper
(async () => {
  switch (operation) {
    case 'backup':
      await backup();
      break;

    case 'restore':
      await restore();
      break;

    default:
      // Do nothing
  }
})();
