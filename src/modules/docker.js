const Docker = require('dockerode');
const folderStructure = require('./folderStructure');
const { formatContainerName, saveInspect, loadInspect } = require('./utils');
const inspect2Config = require('./inspect2config');

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
const backupContainer = async (id) => {
  const container = docker.getContainer(id);
  const inspect = await container.inspect();
  const name = formatContainerName(inspect.Name);

  await Promise.all(
    inspect.Mounts
      .filter(mount => mount.Name)
      .map(mount => backupVolume(name, mount.Name, mount.Destination)),
  );

  return saveInspect(inspect);
};

// Restore (create) container by id
const restoreContainer = async (name) => {
  const inspect = await loadInspect(name);
  return docker.createContainer(inspect2Config(inspect));
};

// Exports
module.exports = {
  docker,
  getContainers,
  backupContainer,
  restoreContainer,
};
