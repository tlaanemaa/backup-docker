/* eslint-disable global-require */
jest.mock('command-line-args');
jest.mock('command-line-usage');

beforeEach(() => jest.resetModules());

describe('options', () => {
  it('should return object with options', () => {
    const commandLineArgs = require('command-line-args');
    commandLineArgs.args = ['backup', 'banana'];

    const options = require('../../src/modules/options');

    expect(options.operation).toBe('backup');
    expect(options.containers).toBe('banana');
  });

  it('should show error on wrong enum value', () => {
    const commandLineArgs = require('command-line-args');
    commandLineArgs.args = ['banana', 'banana'];
    global.console.error = jest.fn();
    global.process.exit = jest.fn();

    expect(() => require('../../src/modules/options'))
      .toThrow('Invalid value: banana. Available options are: ["backup","restore"]');
    expect(global.console.error).toHaveBeenCalledTimes(1);
    expect(global.console.error).toHaveBeenCalledWith(
      'Invalid value: banana. Available options are: ["backup","restore"]',
      '\nUse the --help option to see docs',
    );
    expect(global.process.exit).toHaveBeenCalledWith(1);
  });

  it('should show error if no operation name is provided', () => {
    const commandLineArgs = require('command-line-args');
    commandLineArgs.args = [];
    global.console.error = jest.fn();
    global.process.exit = jest.fn();

    expect(() => require('../../src/modules/options'))
      .toThrow('Operation name must be provided!');
    expect(global.console.error).toHaveBeenCalledTimes(1);
    expect(global.console.error).toHaveBeenCalledWith(
      'Operation name must be provided!',
      '\nUse the --help option to see docs',
    );
    expect(global.process.exit).toHaveBeenCalledWith(1);
  });
});
