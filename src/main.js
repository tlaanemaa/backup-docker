require('./modules/folderStructure');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getAllContainerConfigs } = require('./modules/utils');

// Grab command args
const [operation, ...containerNames] = process.argv.slice(2);

// Helper to print command line args
// eslint-disable-next-line no-console
const printUsage = () => console.log('Usage: backup-docker <backup|restore> [<container-name, container-name, ...>]');

// Main backup function
const backup = async () => {
  const containers = containerNames.length ? containerNames : await getContainers();
  return Promise.all(containers.map(backupContainer));
};

// Main restore function
const restore = async () => {
  const containers = containerNames.length ? containerNames : await getAllContainerConfigs();
  return Promise.all(containers.map(restoreContainer));
};

// Run the operation requested in an async wrapper
(async () => {
  try {
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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
  }
})();
