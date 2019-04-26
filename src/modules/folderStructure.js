const path = require('path');
const fs = require('fs');
const args = require('./arguments');

// Ensure folder existence
const ensureFolderExistsSync = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const structure = {
  containers: path.resolve(args.directory, 'containers'),
  volumes: path.resolve(args.directory, 'volumes'),
};

ensureFolderExistsSync(structure.containers);
ensureFolderExistsSync(structure.volumes);

module.exports = structure;
