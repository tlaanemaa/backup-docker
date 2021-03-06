/* eslint-disable global-require */
jest.mock('fs');
jest.mock('dockerode');
jest.mock('../src/modules/options.js');
jest.mock('../src/modules/docker.js');

beforeEach(() => jest.resetModules());

describe('backup', () => {
  it('should backup all containers if called without any', async () => {
    const options = require('../src/modules/options');
    options.containers = [];
    const docker = require('../src/modules/docker');
    const main = require('../src/main');

    const result = await main();

    expect(result).toEqual([
      { name: 6, result: true },
      { name: 7, result: true },
      { name: 8, result: true },
    ]);
    expect(docker.getAllContainers).toHaveBeenCalledTimes(1);
    expect(docker.backupContainer).toHaveBeenCalledTimes(3);
    expect(docker.backupContainer).toHaveBeenLastCalledWith(8);
  });

  it('should backup the given container', async () => {
    const options = require('../src/modules/options');
    options.containers = ['pear'];
    const docker = require('../src/modules/docker');
    const main = require('../src/main');

    await main();

    expect(docker.getAllContainers).toHaveBeenCalledTimes(0);
    expect(docker.backupContainer).toHaveBeenCalledTimes(1);
    expect(docker.backupContainer).toHaveBeenLastCalledWith('pear');
  });

  it('should print summary', async () => {
    global.console.log = jest.fn();
    const options = require('../src/modules/options');
    options.containers = ['pear'];
    const docker = require('../src/modules/docker');
    docker.backupContainer = () => { throw new Error('Mock backup error'); };
    const main = require('../src/main');

    await main();

    expect(global.console.log).toHaveBeenLastCalledWith('  ✖ pear: Mock backup error');
  });

  it('should not print anything if the run result is empty', async () => {
    const docker = require('../src/modules/docker');
    docker.getAllContainers = jest.fn().mockResolvedValue([]);
    global.console.log = jest.fn();
    const main = require('../src/main');

    await main();

    expect(global.console.log).toHaveBeenLastCalledWith('== Done ==');
  });

  it('should not pull volume image unless its needed', async () => {
    const options = require('../src/modules/options');
    options.operateOnVolumes = false;
    const docker = require('../src/modules/docker');
    const main = require('../src/main');

    await main();

    expect(docker.ensureVolumeImageExists).toHaveBeenCalledTimes(0);
  });
});

describe('restore', () => {
  it('should restore all containers if called without any', async () => {
    const fs = require('fs');
    const options = require('../src/modules/options');
    options.operation = 'restore';
    options.containers = [];
    const docker = require('../src/modules/docker');
    const main = require('../src/main');

    const result = await main();

    expect(result).toEqual([
      { name: 'a', result: true },
      { name: 'b', result: true },
      { name: 'c', result: true },
    ]);
    expect(fs.readdirSync).toHaveBeenCalledTimes(3);
    expect(fs.readdirSync).toHaveBeenCalledWith('/folder/containers');
    expect(docker.restoreContainer).toHaveBeenCalledTimes(3);
    expect(docker.restoreContainer).toHaveBeenLastCalledWith('c');
  });

  it('should restore the given container', async () => {
    const fs = require('fs');
    const options = require('../src/modules/options');
    options.operation = 'restore';
    options.containers = ['mango'];
    const docker = require('../src/modules/docker');
    const main = require('../src/main');

    await main();

    expect(fs.readdir).toHaveBeenCalledTimes(0);
    expect(docker.restoreContainer).toHaveBeenCalledTimes(1);
    expect(docker.restoreContainer).toHaveBeenLastCalledWith('mango');
  });

  it('should print summary', async () => {
    global.console.log = jest.fn();
    const options = require('../src/modules/options');
    options.operation = 'restore';
    options.containers = ['pear'];
    const docker = require('../src/modules/docker');
    docker.restoreContainer = () => { throw new Error('Mock restore error'); };
    const main = require('../src/main');

    await main();

    expect(global.console.log).toHaveBeenLastCalledWith('  ✖ pear: Mock restore error');
  });
});
