const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const folderStructure = require('./folderStructure');

// Promisified fs helpers
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);


// Ensure folder existence
const ensureFolderExistsSync = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

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
const loadInspect = (name) => {
  const filePath = path.resolve(folderStructure.containers, `${name}.json`);
  return readFile(filePath);
};

// Write container inspects
const saveInspect = (inspect) => {
  const name = inspect.Name.replace(/^\//g, '');
  const filePath = path.resolve(folderStructure.containers, `${name}.json`);
  const inspectString = JSON.stringify(inspect, null, 2);
  return writeFile(filePath, inspectString);
};

// Exports
module.exports = {
  ensureFolderExistsSync,
  formatContainerName,
  getAllInspects,
  loadInspect,
  saveInspect,
};
