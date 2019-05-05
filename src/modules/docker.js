const Docker = require('dockerode');
const { parseRepositoryTag } = require('dockerode/lib/util');
const createLimiter = require('limit-async');
const { socketPath, onlyContainers, onlyVolumes } = require('./options');
const folderStructure = require('./folderStructure');
const inspect2Config = require('./inspect2config');
const {
  formatContainerName,
  saveInspect,
  loadInspect,
  getVolumeFilesSync,
  round,
} = require('./utils');

// Name of the image we will use for volume operations
const volumeOperationsImage = 'ubuntu';

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

// If we know that we will operate on volumes, get all volume files in advance
// Also initialize a variable for pulling the volume operations image if needed
const volumeFiles = operateOnVolumes ? getVolumeFilesSync() : [];
let volumeImagePromise = Promise.resolve();

// Get all containers
const getContainers = async (all = true) => {
  const containers = await docker.listContainers({ all });
  return containers.map(container => container.Id);
};

// Helper to check if an image exists locally
const imageExists = async (name) => {
  try {
    const image = docker.getImage(name);
    await image.inspect();
    return true;
  } catch (e) {
    return false;
  }
};

// Helper to pull an image and log
const pullImage = name => new Promise((resolve, reject) => {
  // TODO: Remove this once dockerode supports default tags
  const imageName = parseRepositoryTag(name).tag ? name : `${name}:latest`;
  // eslint-disable-next-line no-console
  console.log(`Pulling image: ${imageName}`);
  docker.pull(
    imageName,
    (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      const onProgress = (event) => {
        let progress = '';
        if (
          event.progressDetail
          && event.progressDetail.current
          && event.progressDetail.total
        ) {
          progress = ` (${round(event.progressDetail.current / event.progressDetail.total * 100, 2)})%`;
        }

        // eslint-disable-next-line no-console
        console.log(event.status + progress);
      };

      const onFinished = (finalErr, finalStream) => {
        if (finalErr) {
          reject(finalErr);
          return;
        }

        resolve(finalStream);
      };
      docker.modem.followProgress(stream, onFinished, onProgress);
    },
  );
});

// Helper to only pull if it doesn't exist
const ensureImageExists = async (name) => {
  const exists = await imageExists(name);
  if (!exists) {
    return pullImage(name);
  }
  return null;
};

// Helper to start container and log
const startContainer = (container) => {
  // eslint-disable-next-line no-console
  console.log('Starting container...');
  return container.start();
};

// Helper to stop container, wait and log
const stopContainer = async (container) => {
  // eslint-disable-next-line no-console
  console.log('Stopping container...');
  await container.stop();
  return container.wait();
};

// Backup volume as a tar file
const backupVolume = volumeLimit((containerName, volumeName, mountPoint) => docker.run(
  volumeOperationsImage,
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
  // Wait for the volume operations image to be downloaded before proceeding
  await volumeImagePromise;

  // eslint-disable-next-line no-console
  console.log(`== Backing up container: ${id} ==`);

  const container = docker.getContainer(id);
  const inspect = await container.inspect();
  const name = formatContainerName(inspect.Name);
  const isRunning = inspect.State.Running;

  // Backup volumes
  if (operateOnVolumes) {
    // Extract and filter volumes to know if we have anything to backup
    const volumes = inspect.Mounts
      .filter(mount => mount.Name && mount.Type === 'volume');

    // Only go ahead if we actually have any volumes
    if (volumes.length) {
      // Stop container, and wait for it to stop, if it's running
      // so it wouldn't change files while we copy them
      if (isRunning) {
        await stopContainer(container);
      }

      // Go over the container's volumes and back them up
      // eslint-disable-next-line no-console
      console.log('Starting volume backup...');
      await Promise.all(
        volumes.map(volume => backupVolume(name, volume.Name, volume.Destination)),
      );

      // Start container if it was running
      if (isRunning) {
        await startContainer(container);
      }
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
  volumeOperationsImage,
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
  // Wait for the volume operations image to be downloaded before proceeding
  await volumeImagePromise;

  // eslint-disable-next-line no-console
  console.log(`== Restoring container: ${name} ==`);
  const backupInspect = await loadInspect(name);

  // Restore container
  let container = null;
  if (operateOnContainers) {
    // Pull the image if it doesn't exist
    await ensureImageExists(backupInspect.Config.Image);

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
    // Extract and filter volumes to know if we have anything to restore
    const volumes = inspect.Mounts
      .filter(mount => mount.Name && mount.Type === 'volume' && volumeFiles.includes(mount.Name));

    // Only go ahead if we actually have backup files to restore
    if (volumes.length) {
      // Stop container, and wait for it to stop, if it's running
      // so it wouldn't change files while we copy them
      if (isRunning) {
        await stopContainer(container);
      }

      // Go over the container's volumes and restore their contents
      // eslint-disable-next-line no-console
      console.log('Starting volume restore...');
      await Promise.all(
        volumes.map(volume => restoreVolume(name, volume.Name, volume.Destination)),
      );

      // Start container if it was running
      if (isRunning) {
        await startContainer(container);
      }
    }
  }

  // Start the container if it was backed up in a running state and is not currently running
  if (
    operateOnContainers
    && backupInspect.State.Running
    && !inspect.State.Running
  ) {
    await startContainer(container);
  }

  return true;
});

// Start pulling the volume operations image if we plan to work on volumes
if (operateOnVolumes) {
  volumeImagePromise = ensureImageExists(volumeOperationsImage);
}

// Exports
module.exports = {
  getContainers,
  backupContainer,
  restoreContainer,
  pullImage,
};
