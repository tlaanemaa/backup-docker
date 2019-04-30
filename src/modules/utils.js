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
  try {
    const files = fs.readdirSync(folder);
    return files.filter(file => path.extname(file) === extension);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    process.exit(1);
    throw e;
  }
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
const getVolumeFilesSync = () => getFilesSync(folderStructure.containers, '.tar')
  .map(file => path.basename(file, path.extname(file)));

// Helper to catch and log errors on async functions
const asyncTryLog = async (func, exit = false) => {
  try {
    return await func();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message);
    if (exit) {
      process.exit(1);
    }
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
  asyncTryLog,
};
