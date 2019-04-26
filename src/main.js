require('./modules/folderStructure');
const args = require('./modules/arguments');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getAllContainerConfigs } = require('./modules/utils');

// Grab unnamed args
const [operation, ...containerNames] = args._;

// Helper to print command line args
// eslint-disable-next-line no-console
const printUsage = () => console.log('Usage: backup-docker <backup|restore> [<container-name, container-name, ...>]');

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
      // eslint-disable-next-line no-console
      console.error('Invalid operation!');
      printUsage();
  }
})();
