const fs = jest.genMockFromModule('fs');

fs.writeFile = jest.fn().mockImplementation((x, y, callback) => callback());
fs.readFile = jest.fn().mockImplementation((x, y, callback) => callback());
fs.readdir = jest.fn().mockImplementation((x, y, callback) => callback());
fs.access = jest.fn().mockImplementation((x, y, callback) => callback());

module.exports = fs;
