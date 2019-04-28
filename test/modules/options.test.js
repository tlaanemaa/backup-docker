/* eslint-disable global-require */
beforeEach(() => jest.resetModules());

describe('options', () => {
  it('should return object with options on backup', () => {
    global.process.argv = ['node', 'dummy.js', 'backup', 'banana'];

    const options = require('../../src/modules/options');

    expect(options.operation).toBe('backup');
    expect(options.containers).toEqual(['banana']);
  });

  it('should return object with options on restore', () => {
    global.process.argv = ['node', 'dummy.js', 'restore', 'mango'];

    const options = require('../../src/modules/options');

    expect(options.operation).toBe('restore');
    expect(options.containers).toEqual(['mango']);
  });

  it('should show error and exit on unknown operation', () => {
    global.process.argv = ['node', 'dummy.js', 'dance', 'mango'];
    global.console.error = jest.fn();
    global.process.exit = jest.fn();

    require('../../src/modules/options');

    expect(global.console.error).toHaveBeenCalledTimes(1);
    expect(global.console.error).toHaveBeenCalledWith(
      'Unknown operation: dance',
      '\nUse --help to see all options',
    );
    expect(global.process.exit).toHaveBeenCalledTimes(1);
    expect(global.process.exit).toHaveBeenCalledWith(1);
  });

  // it('should show error on wrong enum value', () => {
  //   commandLineArgs.args = ['banana', 'banana'];
  //   global.console.error = jest.fn();
  //   global.process.exit = jest.fn();

  //   expect(() => require('../../src/modules/options'))
  //     .toThrow('Invalid value: banana. Available options are: ["backup","restore"]');
  //   expect(global.console.error).toHaveBeenCalledTimes(1);
  //   expect(global.console.error).toHaveBeenCalledWith(
  //     'Invalid value: banana. Available options are: ["backup","restore"]',
  //     '\nUse the --help option to see docs',
  //   );
  //   expect(global.process.exit).toHaveBeenCalledWith(1);
  // });

  // it('should show error if no operation name is provided', () => {
  //   const commandLineArgs = require('command-line-args');
  //   commandLineArgs.args = [];
  //   global.console.error = jest.fn();
  //   global.process.exit = jest.fn();

  //   expect(() => require('../../src/modules/options'))
  //     .toThrow('Operation name must be provided!');
  //   expect(global.console.error).toHaveBeenCalledTimes(1);
  //   expect(global.console.error).toHaveBeenCalledWith(
  //     'Operation name must be provided!',
  //     '\nUse the --help option to see docs',
  //   );
  //   expect(global.process.exit).toHaveBeenCalledWith(1);
  // });
});
