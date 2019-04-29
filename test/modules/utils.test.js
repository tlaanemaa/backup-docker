/* eslint-disable global-require */
jest.mock('fs');
jest.mock('../../src/modules/options.js');

beforeEach(() => jest.resetModules());

describe('asyncTryLog', () => {
  it('should log and exit on error', () => {
    global.console.error = jest.fn();
    global.process.exit = jest.fn();
    const { asyncTryLog } = require('../../src/modules/utils');

    asyncTryLog(() => {
      throw new Error('Mock error!');
    }, true);

    expect(global.console.error).toHaveBeenCalledWith('Mock error!');
    expect(global.process.exit).toHaveBeenCalledWith(1);
  });

  it('should log and return error', async () => {
    global.console.error = jest.fn();
    global.process.exit = jest.fn();
    const { asyncTryLog } = require('../../src/modules/utils');

    const mockError = new Error('Mock error!');
    const result = await asyncTryLog(() => {
      throw mockError;
    });

    expect(global.console.error).toHaveBeenCalledWith('Mock error!');
    expect(global.process.exit).toHaveBeenCalledTimes(0);
    expect(result).toBe(mockError);
  });
});
