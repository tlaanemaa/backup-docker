const Docker = require('dockerode');
const limit = require('limit-async')(1);
const folderStructure = require('./folderStructure');
const inspect2Config = require('./inspect2config');
const {
  formatContainerName,
  saveInspect,
  loadInspect,
  volumeFileExists,
} = require('./utils');

const docker = new Docker();

// Get all containers
const getContainers = async (all = true) => {
  const containers = await docker.listContainers({ all });
  return containers.map(container => container.Id);
};

// Backup volume as a tar file
const backupVolume = (containerName, volumeName, mountPoint) => docker.run(
  'ubuntu',
  ['tar', 'cvf', `/backup/${volumeName}.tar`, mountPoint],
  process.stdout,
  {
    HostConfig: {
      AutoRemove: true,
      Binds: [`${folderStructure.volumes}:/backup`],
      VolumesFrom: [containerName],
    },
  },
);

// Back up single container by id
const backupContainer = limit(async (id) => {
  // eslint-disable-next-line no-console
  console.log(`Backing up container: ${id}`);
  const container = docker.getContainer(id);
  const inspect = await container.inspect();
  const name = formatContainerName(inspect.Name);
  const isRunning = inspect.State.Running;

  if (isRunning) {
    await container.pause();
  }

  await Promise.all(
    inspect.Mounts
      .filter(mount => mount.Name)
      .map(mount => backupVolume(name, mount.Name, mount.Destination)),
  );

  if (isRunning) {
    await container.unpause();
  }

  return saveInspect(inspect);
});

// Restore volume contents from a tar archive
const restoreVolume = (containerName, tarName, mountPoint) => docker.run(
  'ubuntu',
  ['tar', 'xvf', `/backup/${tarName}.tar`, '--strip', '1', '--directory', mountPoint],
  process.stdout,
  {
    HostConfig: {
      AutoRemove: true,
      Binds: [`${folderStructure.volumes}:/backup`],
      VolumesFrom: [containerName],
    },
  },
);

// Restore (create) container by id
const restoreContainer = limit(async (name) => {
  // eslint-disable-next-line no-console
  console.log(`Restoring container: ${name}`);
  const inspect = await loadInspect(name);
  await docker.createContainer(inspect2Config(inspect));

  return Promise.all(
    inspect.Mounts
      .filter(mount => mount.Name && volumeFileExists(mount.Name))
      .map(mount => restoreVolume(name, mount.Name, mount.Destination)),
  );
});

// Exports
module.exports = {
  docker,
  getContainers,
  backupContainer,
  restoreContainer,
};
