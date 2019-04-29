const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const folderStructure = require('./folderStructure');

// Promisified fs helpers
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const access = promisify(fs.access);

// Format container names
const formatContainerName = name => name.replace(/^\//g, '');

// Get all container inspects files
const getAllInspects = async () => {
  const files = await readDir(folderStructure.containers);
  return files
    .filter(file => path.extname(file) === '.json')
    .map(file => path.basename(file, path.extname(file)));
};

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

// Check if a volume backup exists
const volumeFileExists = async (name) => {
  const filePath = path.join(folderStructure.volumes, `${name}.tar`);
  try {
    await access(filePath, fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
};

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
  getAllInspects,
  loadInspect,
  saveInspect,
  volumeFileExists,
  asyncTryLog,
};
