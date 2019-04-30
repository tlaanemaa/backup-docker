/* eslint-disable global-require */
jest.mock('fs');
jest.mock('../../src/modules/options.js');

beforeEach(() => jest.resetModules());

describe('folderStructure', () => {
  it('should not create folder if it exists', () => {
    const fs = require('fs');
    fs.existsSync = jest.fn().mockReturnValue(true);

    require('../../src/modules/folderStructure');

    expect(fs.mkdirSync).toHaveBeenCalledTimes(0);
  });

  it('should log and exit on error', () => {
    const mockError = new Error('Mock error');
    const fs = require('fs');
    fs.mkdirSync = () => { throw mockError; };
    global.console.error = jest.fn();
    global.process.exit = jest.fn();

    require('../../src/modules/folderStructure');

    expect(global.console.error).toHaveBeenCalledWith('Mock error');
    expect(global.process.exit).toHaveBeenCalledWith(1);
  });
});
