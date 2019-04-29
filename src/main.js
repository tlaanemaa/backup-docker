#!/usr/bin/env node
require('./modules/folderStructure');
const { operation, containers: containerNames } = require('./modules/options');
const { getContainers, restoreContainer, backupContainer } = require('./modules/docker');
const { getAllInspects, asyncTryLog } = require('./modules/utils');

// Main backup function
const backup = async () => {
  const containers = containerNames.length
    ? containerNames
    : await asyncTryLog(() => getContainers(), true);

  return Promise.all(containers.map(
    container => asyncTryLog(() => backupContainer(container)),
  ));
};

// Main restore function
const restore = async () => {
  const containers = containerNames.length
    ? containerNames
    : await asyncTryLog(() => getAllInspects(), true);

  return Promise.all(containers.map(
    container => asyncTryLog(() => restoreContainer(container)),
  ));
};

// Main method to run the tool
const main = () => {
  const operations = { backup, restore };
  return operations[operation]();
};

// Decide if we should run or export the method, based on if we're in testing env or not
if (process.env.NODE_ENV === 'test') {
  module.exports = main;
} else {
  main();
}
