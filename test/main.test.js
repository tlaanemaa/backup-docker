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

    expect(result).toEqual([true, true, true]);
    expect(docker.getContainers).toHaveBeenCalledTimes(1);
    expect(docker.backupContainer).toHaveBeenCalledTimes(3);
    expect(docker.backupContainer)
      .toHaveBeenLastCalledWith(8, expect.any(Number), expect.any(Array));
  });

  it('should backup the given container', async () => {
    const options = require('../src/modules/options');
    options.containers = ['pear'];
    const docker = require('../src/modules/docker');
    const main = require('../src/main');

    await main();

    expect(docker.getContainers).toHaveBeenCalledTimes(0);
    expect(docker.backupContainer).toHaveBeenCalledTimes(1);
    expect(docker.backupContainer)
      .toHaveBeenLastCalledWith('pear', expect.any(Number), expect.any(Array));
  });

  it('should catch errors and return false', async () => {
    expect.assertions(1);
    const options = require('../src/modules/options');
    options.containers = ['pear'];
    const docker = require('../src/modules/docker');
    docker.backupContainer = () => { throw new Error('Mock backup error'); };
    const main = require('../src/main');

    try {
      await main();
    } catch (e) {
      expect(e.message)
        .toBe('\nThe following errors occurred during the run (this does not include errors from the tar command used for volume backup/restore):\nMock backup error');
    }
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

    expect(result).toEqual([true, true, true]);
    expect(fs.readdirSync).toHaveBeenCalledTimes(1);
    expect(fs.readdirSync).toHaveBeenCalledWith('/folder/containers');
    expect(docker.restoreContainer).toHaveBeenCalledTimes(3);
    expect(docker.restoreContainer)
      .toHaveBeenLastCalledWith('c', expect.any(Number), expect.any(Array));
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
    expect(docker.restoreContainer)
      .toHaveBeenLastCalledWith('mango', expect.any(Number), expect.any(Array));
  });

  it('should catch errors and return false', async () => {
    expect.assertions(1);
    const options = require('../src/modules/options');
    options.operation = 'restore';
    options.containers = ['pear'];
    const docker = require('../src/modules/docker');
    docker.restoreContainer = () => { throw new Error('Mock restore error'); };
    const main = require('../src/main');

    try {
      await main();
    } catch (e) {
      expect(e.message)
        .toBe('\nThe following errors occurred during the run (this does not include errors from the tar command used for volume backup/restore):\nMock restore error');
    }
  });
});
