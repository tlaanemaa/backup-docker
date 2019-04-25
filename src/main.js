require('./modules/folderStructure');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getAllContainerConfigs } = require('./modules/utils');

// Grab command args
const [operation, ...containerNames] = process.argv.slice(2);

// Main backup function
const backup = async () => {
  try {
    const containers = containerNames.length ? containerNames : await getContainers();
    // eslint-disable-next-line no-console
    console.log('Backing up the following container inspections:', containers.join(', '));
    return await Promise.all(containers.map(backupContainer));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    return null;
  }
};

// Main restore function
const restore = async () => {
  try {
    const containers = containerNames.length ? containerNames : await getAllContainerConfigs();
    // eslint-disable-next-line no-console
    console.log('Restoring the following containers:', containers.join(', '));
    return await Promise.all(containers.map(restoreContainer));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    return null;
  }
};

// Run the operation requested
switch (operation) {
  case 'backup':
    backup();
    break;

  case 'restore':
    restore();
    break;

  default:
    throw new Error('Invalid operation!');
}
