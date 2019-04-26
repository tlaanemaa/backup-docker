const Docker = require('dockerode');
const createLimiter = require('limit-async');
const folderStructure = require('./folderStructure');
const inspect2Config = require('./inspect2config');
const {
  formatContainerName,
  saveInspect,
  loadInspect,
  volumeFileExists,
} = require('./utils');

// Volume backup directory mount path inside the container.
const dockerBackupMountDir = '/__volume_backup_mount__';

const docker = new Docker();

/*
  We want to back up and restore the containers and volumes sequentially
  to avoid triggering too many operations at once.
  To achieve that we create limits
*/
const containerLimit = createLimiter(1);
const volumeLimit = createLimiter(1);

// Get all containers
const getContainers = async (all = true) => {
  const containers = await docker.listContainers({ all });
  return containers.map(container => container.Id);
};

// Backup volume as a tar file
const backupVolume = volumeLimit((containerName, volumeName, mountPoint) => docker.run(
  'ubuntu',
  ['tar', 'cvf', `${dockerBackupMountDir}/${volumeName}.tar`, mountPoint],
  process.stdout,
  {
    HostConfig: {
      AutoRemove: true,
      Binds: [`${folderStructure.volumes}:${dockerBackupMountDir}`],
      VolumesFrom: [containerName],
    },
  },
));

// Back up single container by id
const backupContainer = containerLimit(async (id) => {
  // eslint-disable-next-line no-console
  console.log(`Backing up container: ${id}`);
  const container = docker.getContainer(id);
  const inspect = await container.inspect();
  const name = formatContainerName(inspect.Name);
  const isRunning = inspect.State.Running;

  // Pause container if it's running so it wouldn't change files while we copy them
  if (isRunning) {
    await container.pause();
  }

  // Backup volumes
  await Promise.all(
    inspect.Mounts
      .filter(mount => mount.Name)
      .map(mount => backupVolume(name, mount.Name, mount.Destination)),
  );

  // Unpause container if it was running
  if (isRunning) {
    await container.unpause();
  }

  // Backup container
  return saveInspect(inspect);
});

// Restore volume contents from a tar archive
const restoreVolume = volumeLimit((containerName, tarName, mountPoint) => docker.run(
  'ubuntu',
  ['tar', 'xvf', `${dockerBackupMountDir}/${tarName}.tar`, '--strip', '1', '--directory', mountPoint],
  process.stdout,
  {
    HostConfig: {
      AutoRemove: true,
      Binds: [`${folderStructure.volumes}:${dockerBackupMountDir}`],
      VolumesFrom: [containerName],
    },
  },
));

// Restore (create) container by id
const restoreContainer = containerLimit(async (name) => {
  // eslint-disable-next-line no-console
  console.log(`Restoring container: ${name}`);
  const inspect = await loadInspect(name);

  // Restore container
  const container = await docker.createContainer(inspect2Config(inspect));

  // Restore volumes
  await Promise.all(
    inspect.Mounts
      .filter(mount => mount.Name)
      .map(async (mount) => {
        const fileExists = await volumeFileExists(mount.Name);
        return (
          fileExists
            ? restoreVolume(name, mount.Name, mount.Destination)
            : null
        );
      }),
  );

  // Start the container if it was backed up in a running state
  if (inspect.State.Running) {
    await container.start();
  }

  return container;
});

// Exports
module.exports = {
  getContainers,
  backupContainer,
  restoreContainer,
};
