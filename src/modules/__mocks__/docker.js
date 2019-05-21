module.exports.getAllContainers = jest.fn().mockResolvedValue([6, 7, 8]);
module.exports.restoreContainer = jest.fn().mockResolvedValue(true);
module.exports.backupContainer = jest.fn().mockResolvedValue(true);
module.exports.ensureVolumeImageExists = jest.fn().mockResolvedValue(null);
