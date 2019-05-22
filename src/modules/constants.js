const path = require('path');
const { directory } = require('./options');

module.exports = {
  // Folder paths
  folders: {
    containers: path.resolve(directory, 'containers'),
    volumes: path.resolve(directory, 'volumes'),
  },

  // Name of the image we will use for volume operations
  volumeOperationsImage: 'ubuntu',

  // Volume backup directory mount path inside the container.
  dockerBackupMountDir: '/__volume_backup_mount__',

  // Volume mount directory inside the container when backing it up
  dockerBackupVolumeDir: '/__volume__',
};
