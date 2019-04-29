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
    /*
      This test runs over both the unknown an omitted operation scenarios because
      both use process.exit(1) but since we mock it, it will run over it and not exit.
      Thus triggering both paths, which in real usage is not possible
    */
    global.process.argv = ['node', 'dummy.js', 'dance', 'mango'];
    global.console.error = jest.fn();
    global.process.exit = jest.fn();
    const { Command } = require('commander');
    Command.prototype.outputHelp = jest.fn();

    require('../../src/modules/options');

    expect(global.console.error).toHaveBeenCalledTimes(1);
    expect(global.console.error).toHaveBeenCalledWith(
      'Unknown operation: dance',
      '\nUse --help to see all options',
    );
    expect(global.process.exit).toHaveBeenCalledTimes(2);
    expect(global.process.exit).toHaveBeenCalledWith(1);
    expect(Command.prototype.outputHelp).toHaveBeenCalledTimes(1);
  });

  it('should show help and exit if operation is omitted', () => {
    global.process.argv = ['node', 'dummy.js'];
    global.console.error = jest.fn();
    global.process.exit = jest.fn();
    const { Command } = require('commander');
    Command.prototype.outputHelp = jest.fn();

    require('../../src/modules/options');

    expect(global.console.error).toHaveBeenCalledTimes(0);
    expect(global.process.exit).toHaveBeenCalledTimes(1);
    expect(global.process.exit).toHaveBeenCalledWith(1);
    expect(Command.prototype.outputHelp).toHaveBeenCalledTimes(1);
  });
});
