const path = require('path');
const { directory } = require('./options');

module.exports = {
  folders: {
    containers: path.resolve(directory, 'containers'),
    volumes: path.resolve(directory, 'volumes'),
  },
};
