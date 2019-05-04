const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const folderStructure = require('./folderStructure');

// Promisified fs helpers
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// Format container names
const formatContainerName = name => name.replace(/^\//g, '');

// Get contents of a folder synchronously
const getFilesSync = (folder, extension) => {
  const files = fs.readdirSync(folder);
  return files.filter(file => path.extname(file) === extension);
};

// Get all container inspect backups synchronously
const getInspectFilesSync = () => getFilesSync(folderStructure.containers, '.json')
  .map(file => path.basename(file, path.extname(file)));

// Load container inspects
const loadInspect = async (name) => {
  const filePath = path.resolve(folderStructure.containers, `${name}.json`);
  const inspect = await readFile(filePath);
  return JSON.parse(inspect);
};

// Write container inspects
const saveInspect = (inspect) => {
  const name = inspect.Name.replace(/^\//g, '');
  const filePath = path.resolve(folderStructure.containers, `${name}.json`);
  const inspectString = JSON.stringify(inspect, null, 2);
  return writeFile(filePath, inspectString);
};

// Get all volume backups synchronously
const getVolumeFilesSync = () => getFilesSync(folderStructure.volumes, '.tar')
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

// Exports
module.exports = {
  formatContainerName,
  getInspectFilesSync,
  loadInspect,
  saveInspect,
  getVolumeFilesSync,
  logAndReturnErrors,
};
