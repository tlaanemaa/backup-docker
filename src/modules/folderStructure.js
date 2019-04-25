const path = require('path');
const fs = require('fs');

const cwd = process.cwd();

// Ensure folder existence
const ensureFolderExistsSync = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const structure = {
  root: path.resolve(cwd, 'docker-backups'),
  containers: path.resolve(cwd, 'docker-backups', 'containers'),
  volumes: path.resolve(cwd, 'docker-backups', 'volumes'),
};

ensureFolderExistsSync(structure.root);
ensureFolderExistsSync(structure.containers);
ensureFolderExistsSync(structure.volumes);

module.exports = structure;
