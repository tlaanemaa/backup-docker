/* eslint-disable global-require */
jest.mock('fs');
jest.mock('dockerode');
jest.mock('../../src/modules/options.js');

beforeEach(() => jest.resetModules());

describe('getAllContainers', () => {
  it('should return an array of container ids', async () => {
    const docker = require('../../src/modules/docker');

    const containers = await docker.getAllContainers();

    expect(containers).toEqual(['banana', 'mango', 'orange']);
  });
});

describe('backupContainer', () => {
  it('should write inspect file', async () => {
    const fs = require('fs');
    const dockerode = require('dockerode');
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);

    expect(fs.writeFile).toHaveBeenCalledTimes(3);
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/folder/containers/banana.json',
      JSON.stringify(dockerode.mockInspection, null, 2),
      expect.any(Function),
    );
  });

  it('should tar volumes, stop container and start it again', async () => {
    const dockerode = require('dockerode');
    dockerode.mockContainer.stop = jest.fn();
    dockerode.mockInspection.Id = 3;
    dockerode.mockInspection.Mounts = [{ Name: 'mount1', Destination: 'dest1', Type: 'volume' }];
    dockerode.prototype.listContainers = () => Promise.resolve([{ Id: 3, Names: '/banana' }]);
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);

    expect(dockerode.mockContainer.stop).toHaveBeenCalledTimes(1);
    expect(dockerode.prototype.run).toHaveBeenCalledTimes(1);
    expect(dockerode.prototype.run).toHaveBeenLastCalledWith(
      'ubuntu:latest',
      ['tar', 'cvf', '/__volume_backup_mount__/mount1.tar', '/__volume__'],
      expect.any(Object),
      {
        HostConfig: {
          AutoRemove: true,
          Binds: [
            '/folder/volumes:/__volume_backup_mount__',
            'mount1:/__volume__',
          ],
        },
      },
    );
  });

  it('should only write container inspect when only is containers', async () => {
    const fs = require('fs');
    const dockerode = require('dockerode');
    const options = require('../../src/modules/options');
    options.operateOnVolumes = false;
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);

    expect(dockerode.prototype.run).toHaveBeenCalledTimes(0);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('should only write volumes and their inspects when only is volumes', async () => {
    const fs = require('fs');
    const dockerode = require('dockerode');
    const options = require('../../src/modules/options');
    options.operateOnContainers = false;
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);

    expect(dockerode.prototype.run).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });

  it('should not stop container when there are no volumes', async () => {
    const dockerode = require('dockerode');
    dockerode.mockInspection.Mounts = [];
    dockerode.mockContainer.stop = jest.fn();
    const options = require('../../src/modules/options');
    options.operateOnContainers = false;
    const docker = require('../../src/modules/docker');

    await docker.backupContainer(3);

    expect(dockerode.prototype.run).toHaveBeenCalledTimes(0);
    expect(dockerode.mockContainer.stop).toHaveBeenCalledTimes(0);
  });
});

describe('restoreContainer', () => {
  it('should read inspect file', async () => {
    const dockerode = require('dockerode');
    const docker = require('../../src/modules/docker');

    await docker.restoreContainer('orange');

    expect(dockerode.prototype.createContainer).toHaveBeenCalledTimes(1);
    expect(dockerode.prototype.createContainer).toHaveBeenCalledWith({
      name: 'orange',
      HostConfig: {
        Binds: ['mount1:dest1', 'mount2:dest2'],
        NetworkMode: 'mockMode',
      },
      NetworkingConfig: {
        EndpointsConfig: {},
      },
      Image: 'mock/image',
      Volumes: {
        dest1: {},
        dest2: {},
      },
    });
  });

  it('should untar volumes, stop container and start it again', async () => {
    const fs = require('fs');
    fs.readdirSync = jest.fn().mockImplementation(() => ['mount1.tar', 'mount1.json']);
    const dockerode = require('dockerode');
    dockerode.prototype.listContainers = () => Promise.resolve([{ Id: 3, Names: '/banana' }]);
    dockerode.mockContainer.stop = jest.fn();
    const docker = require('../../src/modules/docker');

    await docker.restoreContainer('orange');

    expect(dockerode.mockContainer.stop).toHaveBeenCalledTimes(1);
    expect(dockerode.prototype.run).toHaveBeenCalledTimes(1);
    expect(dockerode.prototype.run).toHaveBeenLastCalledWith(
      'ubuntu:latest',
      ['tar', 'xvf', '/__volume_backup_mount__/mount1.tar', '--strip', '1', '--directory', '/__volume__'],
      expect.any(Object),
      {
        HostConfig: {
          AutoRemove: true,
          Binds: [
            '/folder/volumes:/__volume_backup_mount__',
            'mount1:/__volume__',
          ],
        },
      },
    );
  });

  it('should create the volume if it doesn\'t exist', async () => {
    const fs = require('fs');
    fs.readdirSync = jest.fn().mockImplementation(() => ['mount1.tar', 'mount1.json']);
    const dockerode = require('dockerode');
    dockerode.prototype.getVolume = () => null;
    const docker = require('../../src/modules/docker');

    await docker.restoreContainer('orange');

    expect(dockerode.prototype.createVolume).toHaveBeenCalledTimes(1);
    expect(dockerode.prototype.createVolume).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should start the container if it was backed up in a running state', async () => {
    const dockerode = require('dockerode');
    dockerode.mockContainer.stop = jest.fn();
    dockerode.mockContainer.start = jest.fn();
    dockerode.mockInspection.State.Running = false;
    const docker = require('../../src/modules/docker');

    await docker.restoreContainer('orange');

    expect(dockerode.mockContainer.stop).toHaveBeenCalledTimes(0);
    expect(dockerode.mockContainer.start).toHaveBeenCalledTimes(1);
  });

  it('should only restore containers when only is containers', async () => {
    const dockerode = require('dockerode');
    const options = require('../../src/modules/options');
    options.operateOnVolumes = false;
    const docker = require('../../src/modules/docker');

    await docker.restoreContainer('orange');

    expect(dockerode.prototype.run).toHaveBeenCalledTimes(0);
    expect(dockerode.prototype.createContainer).toHaveBeenCalledTimes(1);
  });

  it('should only restore volumes when only is volumes', async () => {
    const fs = require('fs');
    fs.readdirSync = jest.fn().mockImplementation(() => ['mount1.tar', 'mount2.tar', 'mount1.json', 'mount2.json']);
    const dockerode = require('dockerode');
    const options = require('../../src/modules/options');
    options.operateOnContainers = false;
    const docker = require('../../src/modules/docker');

    await docker.restoreContainer('orange');

    expect(dockerode.prototype.run).toHaveBeenCalledTimes(2);
    expect(dockerode.prototype.createContainer).toHaveBeenCalledTimes(0);
  });

  it('should only stop container when there are volume backups', async () => {
    const fs = require('fs');
    fs.readdirSync = jest.fn().mockImplementation(() => ['banana.tar', 'mango.tar']);
    const dockerode = require('dockerode');
    dockerode.mockContainer.stop = jest.fn();
    const options = require('../../src/modules/options');
    options.operateOnContainers = true;
    const docker = require('../../src/modules/docker');

    await docker.restoreContainer('orange');

    expect(dockerode.prototype.run).toHaveBeenCalledTimes(0);
    expect(dockerode.mockContainer.stop).toHaveBeenCalledTimes(0);
  });

  it('should throw error if pull fails', async () => {
    expect.assertions(1);
    const mockError = new Error('Panic!');
    const dockerode = require('dockerode');
    dockerode.prototype.pull = jest.fn().mockImplementation((_, callback) => callback(mockError));
    const docker = require('../../src/modules/docker');

    try {
      await docker.restoreContainer('orange');
    } catch (e) {
      expect(e).toBe(mockError);
    }
  });

  it('should throw error if pull onFinished callback fails', async () => {
    expect.assertions(1);
    const mockError = new Error('Panic!');
    const dockerode = require('dockerode');
    dockerode.mockOnFinishedArgs = [mockError];
    const docker = require('../../src/modules/docker');

    try {
      await docker.restoreContainer('orange');
    } catch (e) {
      expect(e).toBe(mockError);
    }
  });
});

describe('pullImage', () => {
  it('should not add tag if one is present', () => {
    const dockerode = require('dockerode');
    dockerode.prototype.pull = jest.fn();
    const docker = require('../../src/modules/docker');

    docker.pullImage('mock/image:10');

    expect(dockerode.prototype.pull).toHaveBeenCalledWith('mock/image:10', expect.any(Function));
  });

  it('should not add progress if there isn\'t any', async () => {
    const dockerode = require('dockerode');
    dockerode.mockOnProgressArgs = [{ status: 'Pulling bananas' }];
    global.console.log = jest.fn();
    const docker = require('../../src/modules/docker');

    await docker.pullImage('banana');

    expect(global.console.log).toHaveBeenCalledWith('Pulling bananas');
  });
});

describe('ensureImageExists', () => {
  it('should not pull if the image already exists', async () => {
    const dockerode = require('dockerode');
    dockerode.mockImage.inspect = () => 'mockImageInspect';
    const docker = require('../../src/modules/docker');
    docker.pullImage = jest.fn();

    const result = await docker.ensureImageExists('banana');

    expect(result).toEqual(undefined);
    expect(docker.pullImage).toHaveBeenCalledTimes(0);
  });
});

describe('wrapDockerErr', () => {
  it('should hide < 400 errors since those are actually fine', async () => {
    expect.assertions(1);
    const { wrapDockerErr } = require('../../src/modules/docker');
    const errorFunc = () => {
      const err = new Error('blah');
      err.statusCode = 304;
      throw err;
    };

    try {
      const result = await wrapDockerErr(errorFunc)();
      expect(result).toBe(undefined);
    } catch (e) {
      // Do nothing
    }
  });

  it('should throw >= 400 errors', async () => {
    expect.assertions(1);
    const { wrapDockerErr } = require('../../src/modules/docker');
    const errorFunc = () => {
      const err = new Error('blah');
      err.statusCode = 404;
      throw err;
    };

    try {
      await wrapDockerErr(errorFunc)();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('should throw errors without a statusCode', async () => {
    expect.assertions(1);
    const { wrapDockerErr } = require('../../src/modules/docker');
    const errorFunc = () => {
      throw new Error('blah');
    };

    try {
      await wrapDockerErr(errorFunc)();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});
