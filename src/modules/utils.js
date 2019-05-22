const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { folders } = require('./constants');

// Promisified fs helpers
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// Format container names
const formatName = name => name.replace(/^\//g, '');

// Get contents of a folder synchronously
const getFilesSync = (folder, extension) => {
  const files = fs.readdirSync(folder);
  return files.filter(file => path.extname(file) === extension);
};

// Get all inspect backups synchronously
const getInspectFilesSync = dir => getFilesSync(dir, '.json')
  .map(file => path.basename(file, path.extname(file)));

// Specific helpers for containers and volumes
const getContainerInspectFilesSync = () => getInspectFilesSync(folders.containers);
const getVolumeInspectFilesSync = () => getInspectFilesSync(folders.volumes);

// Load inspects
const loadInspect = async (name, dir) => {
  const filePath = path.resolve(dir, `${name}.json`);
  const inspect = await readFile(filePath);
  return JSON.parse(inspect);
};

// Specific helpers for containers and volumes
const loadContainerInspect = inspect => loadInspect(inspect, folders.containers);
const loadVolumeInspect = inspect => loadInspect(inspect, folders.volumes);

// Write inspects
const saveInspect = (inspect, dir) => {
  const name = formatName(inspect.Name);
  const filePath = path.resolve(dir, `${name}.json`);
  const inspectString = JSON.stringify(inspect, null, 2);
  return writeFile(filePath, inspectString);
};

// Specific helpers for containers and volumes
const saveContainerInspect = inspect => saveInspect(inspect, folders.containers);
const saveVolumeInspect = inspect => saveInspect(inspect, folders.volumes);

// Get all volume backups synchronously
const getVolumeArchivesSync = () => getFilesSync(folders.volumes, '.tar')
  .map(file => path.basename(file, path.extname(file)));

// Helper to catch errors, log and then return them
const logAndReturnErrors = func => async (...args) => {
  try {
    return await func(...args);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    return e;
  }
};

// Rounding function
const round = (num, decimalPoints = 0) => {
  const multiplier = 10 ** decimalPoints;
  return Math.round(num * multiplier) / multiplier;
};

// Exports
module.exports = {
  formatName,
  getContainerInspectFilesSync,
  getVolumeInspectFilesSync,
  loadContainerInspect,
  loadVolumeInspect,
  saveContainerInspect,
  saveVolumeInspect,
  getVolumeArchivesSync,
  logAndReturnErrors,
  round,
};
