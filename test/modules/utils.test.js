/* eslint-disable global-require */
jest.mock('fs');
jest.mock('../../src/modules/options.js');

beforeEach(() => jest.resetModules());

describe('tryExit', () => {
  it('should log and exit on error', () => {
    global.console.error = jest.fn();
    global.process.exit = jest.fn();
    const { tryExit } = require('../../src/modules/utils');

    tryExit(() => {
      throw new Error('Mock error!');
    });

    expect(global.console.error).toHaveBeenCalledWith('Mock error!');
    expect(global.process.exit).toHaveBeenCalledWith(1);
  });
});
