const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const folderStructure = require('./folderStructure');

// Promisified fs helpers
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readDir);


// Helper to ensure folder existence
module.exports.ensureFolderExistsSync = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

// Helper to get all container inspects files
module.exports.getAllInspects = async () => {
  const files = await readDir(folderStructure.containers);
  return files
    .filter(file => path.extname(file) === '.json')
    .map(file => path.basename(file, path.extname(file)));
};

// Helper to write container inspects
module.exports.saveInspect = (inspect) => {
  const name = inspect.Name.replace(/^\//g, '');
  const filePath = path.resolve(folderStructure.containers, `${name}.json`);
  const inspectString = JSON.stringify(inspect, null, 2);
  return writeFile(filePath, inspectString);
};

// Helper to load container inspects
module.exports.loadInspect = (name) => {
  const filePath = path.resolve(folderStructure.containers, `${name}.json`);
  return readFile(filePath);
};
