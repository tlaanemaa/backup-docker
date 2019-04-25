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
  // eslint-disable-next-line no-console
  console.log('Backing up the following container inspections:', containers.join(', '));
  return Promise.all(containers.map(backupContainer));
};

// Main restore function
const restore = async () => {
  const containers = containerNames.length ? containerNames : await getAllContainerConfigs();
  // eslint-disable-next-line no-console
  console.log('Restoring the following containers:', containers.join(', '));
  return Promise.all(containers.map(restoreContainer));
};

// Run the operation requested
try {
  switch (operation) {
    case 'backup':
      backup();
      break;

    case 'restore':
      restore();
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
