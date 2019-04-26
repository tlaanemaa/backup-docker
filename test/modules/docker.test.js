jest.mock('fs');
jest.mock('dockerode');
jest.mock('../../src/modules/options.js');

const fs = require('fs');
const dockerode = require('dockerode');
const docker = require('../../src/modules/docker');

beforeEach(() => {
  fs.writeFile.mockClear();
  dockerode.prototype.run.mockClear();
});

describe('getContainers', () => {
  it('should return an array of container ids', async () => {
    const containers = await docker.getContainers();
    expect(containers).toEqual([1, 2, 3]);
  });
});

describe('backupContainer', () => {
  it('should should write inspect file', async () => {
    await docker.backupContainer(3);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/folder/containers/banana.json',
      JSON.stringify(dockerode.mockInspection, null, 2),
      expect.any(Function),
    );
  });

  it('should should write inspect file', async () => {
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
});
