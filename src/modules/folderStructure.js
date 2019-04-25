const path = require('path');
const { ensureFolderExistsSync } = require('./utils');

const cwd = process.cwd();

const structure = {
  root: path.resolve(cwd, 'docker-backups'),
  containers: path.resolve(cwd, 'docker-backups', 'containers'),
  volumes: path.resolve(cwd, 'docker-backups', 'volumes'),
};

ensureFolderExistsSync(structure.root);
ensureFolderExistsSync(structure.containers);
ensureFolderExistsSync(structure.volumes);

module.exports = structure;
