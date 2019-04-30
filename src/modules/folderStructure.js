const path = require('path');
const fs = require('fs');
const { directory } = require('./options');

// Ensure folder existence
const ensureFolderExistsSync = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    process.exit(1);
  }
};

const structure = {
  containers: path.resolve(directory, 'containers'),
  volumes: path.resolve(directory, 'volumes'),
};

ensureFolderExistsSync(structure.containers);
ensureFolderExistsSync(structure.volumes);

module.exports = structure;
