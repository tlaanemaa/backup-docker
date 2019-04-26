/* eslint-disable global-require */
jest.mock('fs');
jest.mock('dockerode');
jest.mock('../../src/modules/options.js');

beforeEach(() => jest.resetModules());

describe('getContainers', () => {
  it('should return an array of container ids', async () => {
    const docker = require('../../src/modules/docker');

    const containers = await docker.getContainers();
    expect(containers).toEqual([1, 2, 3]);
  });
});

describe('backupContainer', () => {
  it('should should write inspect file', async () => {
    const fs = require('fs');
    const dockerode = require('dockerode');
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/folder/containers/banana.json',
      JSON.stringify(dockerode.mockInspection, null, 2),
      expect.any(Function),
    );
  });

  it('should should tar volumes', async () => {
    const dockerode = require('dockerode');
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);
    expect(dockerode.prototype.run).toHaveBeenCalledTimes(2);
    expect(dockerode.prototype.run).toHaveBeenLastCalledWith(
      'ubuntu',
      ['tar', 'cvf', '/__volume_backup_mount__/mount2.tar', 'dest2'],
      expect.any(Object),
      {
        HostConfig: {
          AutoRemove: true,
          Binds: ['/folder/volumes:/__volume_backup_mount__'],
          VolumesFrom: ['banana'],
        },
      },
    );
  });

  it('should only write inspect when only is containers', async () => {
    const fs = require('fs');
    const dockerode = require('dockerode');
    const options = require('../../src/modules/options');
    options.only = 'containers';
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);
    expect(dockerode.prototype.run).toHaveBeenCalledTimes(0);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('should only write volumes when only is volumes', async () => {
    const fs = require('fs');
    const dockerode = require('dockerode');
    const options = require('../../src/modules/options');
    options.only = 'volumes';
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);
    expect(dockerode.prototype.run).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(0);
  });
});
