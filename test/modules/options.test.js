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

  it('should throw error on unknown operation', () => {
    global.process.argv = ['node', 'dummy.js', 'dance', 'mango'];

    expect(() => require('../../src/modules/options'))
      .toThrow('Unknown operation: dance\nUse --help to see all options');
  });

  it('should show help if operation is omitted', () => {
    global.process.argv = ['node', 'dummy.js'];
    const { Command } = require('commander');
    Command.prototype.help = jest.fn();

    require('../../src/modules/options');

    expect(Command.prototype.help).toHaveBeenCalledTimes(1);
  });
});
