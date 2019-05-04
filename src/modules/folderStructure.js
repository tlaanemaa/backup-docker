const path = require('path');
const fs = require('fs');
const { directory } = require('./options');

// Ensure folder existence
const ensureFolderExistsSync = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const structure = {
  containers: path.resolve(directory, 'containers'),
  volumes: path.resolve(directory, 'volumes'),
};

ensureFolderExistsSync(structure.containers);
ensureFolderExistsSync(structure.volumes);

module.exports = structure;
