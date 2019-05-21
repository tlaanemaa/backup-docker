const Docker = require('dockerode');
const { parseRepositoryTag } = require('dockerode/lib/util');
const createLimiter = require('limit-async');
const { socketPath, operateOnContainers, operateOnVolumes } = require('./options');
const { folders } = require('./constants');
const { volumeArchives } = require('./fileStructure');
const { containerInspect2Config, volumeInspect2Config } = require('./inspect2config');
const {
  saveContainerInspect,
  saveVolumeInspect,
  loadContainerInspect,
  loadVolumeInspect,
  round,
} = require('./utils');

// Name of the image we will use for volume operations
const volumeOperationsImage = 'ubuntu';

// Volume backup directory mount path inside the container.
const dockerBackupMountDir = '/__volume_backup_mount__';

// Volume mount directory inside the container when backing it up
const dockerBackupVolumeDir = '/__volume__';

// Create docker instance using the provided socket path if available
const docker = socketPath ? new Docker({ socketPath }) : new Docker();

// Construct async limits to avoid doing too many concurrent operations
const containerLimit = createLimiter(1);
const volumeLimit = createLimiter(1);

// Get all containers
const getAllContainers = async () => {
  const containers = await docker.listContainers({ all: true });
  return containers.map(container => container.Id);
};

// Get running containers
const getRunningContainers = async () => {
  const containers = await docker.listContainers({
    filters: [
      { status: 'running' },
    ],
  });
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
  // https://github.com/apocas/dockerode/pull/518
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
          progress = ` (${round(event.progressDetail.current / event.progressDetail.total * 100, 2)}%)`;
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
  if (!exists) await pullImage(name);
};

// Helper to pull volume image
const ensureVolumeImageExists = () => ensureImageExists(volumeOperationsImage);

// Helper to start container and log
const startContainer = (id) => {
  // eslint-disable-next-line no-console
  console.log(`Starting container ${id}...`);
  const container = docker.getContainer(id);
  return container.start();
};

// Helper to stop container, wait and log
const stopContainer = async (id) => {
  // eslint-disable-next-line no-console
  console.log(`Stopping container ${id}...`);
  const container = docker.getContainer(id);
  await container.stop();
  return container.wait();
};

// Helper to detect volumes
const isVolume = mount => mount.Name && mount.Type === 'volume';

// Helper to detect NFS volumes
const isNfsVolume = inspect => inspect.Options && !!inspect.Options.type.match(/nfs/i);

// Helper to detect non-persistent volumes
const isNonPersistentVolume = inspect => inspect.Labels != null;

// Backup volume as a tar file
const volumesAlreadyBackedUp = [];
const backupVolume = volumeLimit(async (name) => {
  // Skip volumes we've already backed up
  if (volumesAlreadyBackedUp.includes(name)) return;
  volumesAlreadyBackedUp.push(name);

  const volume = docker.getVolume(name);
  const inspect = await volume.inspect();

  // Skip non-persistent volumes completely
  if (isNonPersistentVolume(inspect)) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Saving volume inspect for ${name}...`);
  await saveVolumeInspect(inspect);

  // Skip NFS volume contents
  if (isNfsVolume(inspect)) {
    return;
  }

  // Get containers attached to this volume so we can stop them
  const containers = await docker.listContainers({
    filters: [
      { volume: name },
      { status: 'running' },
    ],
  });

  // Stop these containers so they wouldn't change their data
  await Promise.all(
    containers.map(container => stopContainer(container.Id)),
  );

  // eslint-disable-next-line no-console
  console.log(`Starting volume backup for ${name}...`);
  await docker.run(
    volumeOperationsImage,
    ['tar', 'cvf', `${dockerBackupMountDir}/${name}.tar`, dockerBackupVolumeDir],
    process.stdout,
    {
      HostConfig: {
        AutoRemove: true,
        Binds: [
          `${folders.volumes}:${dockerBackupMountDir}`,
          `${name}:${dockerBackupVolumeDir}`,
        ],
      },
    },
  );
});

// Back up single container by id
const backupContainer = containerLimit(async (id) => {
  // eslint-disable-next-line no-console
  console.log(`== Backing up container: ${id} ==`);

  const container = docker.getContainer(id);
  const inspect = await container.inspect();

  // Backup volumes
  if (operateOnVolumes) {
    // Extract and filter volumes to know if we have anything to backup
    const volumes = inspect.Mounts.filter(mount => isVolume(mount));

    // Backup volumes
    await Promise.all(
      volumes.map(volume => backupVolume(volume.Name, [inspect.Id])),
    );
  }

  // Backup container
  if (operateOnContainers) {
    // eslint-disable-next-line no-console
    console.log('Saving container inspect...');
    await saveContainerInspect(inspect);
  }

  return true;
});

// Restore volume contents from a tar archive
const restoreVolume = volumeLimit(async (name) => {
  const inspect = await loadVolumeInspect(name);

  // eslint-disable-next-line no-console
  console.log(`Creating volume ${inspect.Name}...`);
  await docker.createVolume(volumeInspect2Config(inspect));

  // eslint-disable-next-line no-console
  console.log(`Restoring contents of ${inspect.Name}...`);
  return docker.run(
    volumeOperationsImage,
    ['tar', 'xvf', `${dockerBackupMountDir}/${name}.tar`, '--strip', '1', '--directory', dockerBackupVolumeDir],
    process.stdout,
    {
      HostConfig: {
        AutoRemove: true,
        Binds: [
          `${folders.volumes}:${dockerBackupMountDir}`,
          `${name}:${dockerBackupVolumeDir}`,
        ],
      },
    },
  );
});

// Restore (create) container by id
const restoreContainer = containerLimit(async (name) => {
  // eslint-disable-next-line no-console
  console.log(`== Restoring container: ${name} ==`);
  const backupInspect = await loadContainerInspect(name);

  // Restore container
  let container = null;
  if (operateOnContainers) {
    // Pull the image if it doesn't exist
    await ensureImageExists(backupInspect.Config.Image);

    // eslint-disable-next-line no-console
    console.log('Creating container...');
    container = await docker.createContainer(containerInspect2Config(backupInspect));
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
      .filter(mount => mount.Name && mount.Type === 'volume' && volumeArchives.includes(mount.Name));

    // Only go ahead if we actually have backup files to restore
    if (volumes.length) {
      // Stop container, and wait for it to stop, if it's running
      // so it wouldn't change files while we copy them
      if (isRunning) {
        await stopContainer(container.Id);
      }

      // Go over the container's volumes and restore their contents
      await Promise.all(
        volumes.map(volume => restoreVolume(volume.Name)),
      );

      // Start container if it was running
      if (isRunning) {
        await startContainer(container.Id);
      }
    }
  }

  // Start the container if it was backed up in a running state and is not currently running
  if (
    operateOnContainers
    && backupInspect.State.Running
    && !inspect.State.Running
  ) {
    await startContainer(container.Id);
  }

  return true;
});

// Exports
module.exports = {
  getAllContainers,
  getRunningContainers,
  startContainer,
  backupContainer,
  restoreContainer,
  pullImage,
  ensureImageExists,
  ensureVolumeImageExists,
};
