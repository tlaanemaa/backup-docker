const fs = require('fs');
const { folders } = require('./constants');
const { getContainerInspectFilesSync, getVolumeInspectFilesSync, getVolumeArchivesSync } = require('./utils');

// Ensure folder existence
const ensureFolderExistsSync = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

ensureFolderExistsSync(folders.containers);
ensureFolderExistsSync(folders.volumes);

// Create a map of the files we have
module.exports = {
  containerInspects: getContainerInspectFilesSync(),
  volumeInspects: getVolumeInspectFilesSync(),
  volumeArchives: getVolumeArchivesSync(),
};
