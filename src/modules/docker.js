const Docker = require('dockerode');
const createLimiter = require('limit-async');
const { socketPath, onlyContainers, onlyVolumes } = require('./options');
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

// Create docker instance using the provided socket path if available
const docker = socketPath ? new Docker({ socketPath }) : new Docker();

// Construct async limits to avoid doing too many concurrent operations
const containerLimit = createLimiter(1);
const volumeLimit = createLimiter(1);

// Decide what we will operate on
const operateOnContainers = onlyContainers || (!onlyContainers && !onlyVolumes);
const operateOnVolumes = onlyVolumes || (!onlyVolumes && !onlyContainers);

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
  console.log(`== Backing up container: ${id} ==`);
  const container = docker.getContainer(id);
  const inspect = await container.inspect();
  const name = formatContainerName(inspect.Name);
  const isRunning = inspect.State.Running;

  // Backup volumes
  if (operateOnVolumes) {
    // Stop container, and wait for it to stop, if it's running
    // so it wouldn't change files while we copy them
    if (isRunning) {
      // eslint-disable-next-line no-console
      console.log('Stopping container...');
      await container.stop();
      await container.wait();
    }

    // Go over the container's volumes back them up
    // eslint-disable-next-line no-console
    console.log('Starting volume backup...');
    await Promise.all(
      inspect.Mounts
        .filter(mount => mount.Name)
        .map(mount => backupVolume(name, mount.Name, mount.Destination)),
    );

    // Start container if it was running
    if (isRunning) {
      // eslint-disable-next-line no-console
      console.log('Starting container...');
      await container.start();
    }
  }

  // Backup container
  if (operateOnContainers) {
    // eslint-disable-next-line no-console
    console.log('Saving container inspect...');
    await saveInspect(inspect);
  }

  return true;
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
  console.log(`== Restoring container: ${name} ==`);
  const backupInspect = await loadInspect(name);

  // Restore container
  let container = null;
  if (operateOnContainers) {
    // eslint-disable-next-line no-console
    console.log('Creating container...');
    container = await docker.createContainer(inspect2Config(backupInspect));
  } else {
    // eslint-disable-next-line no-console
    console.log('Getting container...');
    container = await docker.getContainer(name);
  }

  // Get restored (or existing if only === 'volumes) container's inspect
  const inspect = await container.inspect();
  const isRunning = inspect.State.Running;

  // Restore volumes
  if (operateOnVolumes) {
    // Stop container, and wait for it to stop, if it's running
    // so it wouldn't change files while we copy them
    if (isRunning) {
      // eslint-disable-next-line no-console
      console.log('Stopping container...');
      await container.stop();
      await container.wait();
    }

    // Go over the container's volumes, check if they have a backup file and restore if they do
    // eslint-disable-next-line no-console
    console.log('Starting volume restore...');
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

    // Start container if it was running
    if (isRunning) {
      // eslint-disable-next-line no-console
      console.log('Starting container...');
      await container.start();
    }
  }

  // Start the container if it was backed up in a running state and is not currently running
  if (
    operateOnContainers
    && backupInspect.State.Running
    && !inspect.State.Running
  ) {
    // eslint-disable-next-line no-console
    console.log('Starting container...');
    await container.start();
  }

  return true;
});

// Exports
module.exports = {
  getContainers,
  backupContainer,
  restoreContainer,
};
