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
});
