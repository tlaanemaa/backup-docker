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

// Main method to run the tool
const main = async () => {
  const operations = { backup, restore };
  return operations[operation]();
};

// Decide if we should run or export the method, based on if we're in testing env or not
if (process.env.NODE_ENV !== 'test') {
  main();
} else {
  module.exports = main;
}
