const Docker = require('dockerode');
const { parseRepositoryTag } = require('dockerode/lib/util');
const createLimiter = require('limit-async');
const { folders } = require('./constants');
const { volumeArchives, volumeInspects } = require('./fileStructure');
const { containerInspect2Config, volumeInspect2Config } = require('./inspect2config');
const {
  socketPath,
  operateOnContainers,
  operateOnVolumes,
  nfsVolumeContents,
  nonPersistentVolumes,
} = require('./options');
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
    filters: { status: ['running'] },
  });
  return containers.map(container => container.Id);
};

// Check if a volume already exists
const volumeExists = async (name) => {
  try {
    const volume = docker.getVolume(name);
    await volume.inspect();
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

// Helper to only pull if it doesn't exist
const ensureImageExists = async (name) => {
  const exists = await imageExists(name);
  if (!exists) await pullImage(name);
};

// Helper to pull volume image
const ensureVolumeImageExists = () => ensureImageExists(volumeOperationsImage);

// Helper to start container and log
const startContainer = async (id) => {
  // eslint-disable-next-line no-console
  console.log(`Starting container ${id}...`);
  const container = docker.getContainer(id);
  try {
    await container.start();
  } catch (e) {
    // Ignore 300 code errors
    if (typeof e.statusCode === 'number' && e.statusCode >= 400) {
      throw (e);
    }
  }
};

// Helper to stop container, wait and log
const stopContainer = async (id) => {
  // eslint-disable-next-line no-console
  console.log(`Stopping container ${id}...`);
  const container = docker.getContainer(id);
  try {
    await container.stop();
    await container.wait();
  } catch (e) {
    // Ignore 300 code errors
    if (typeof e.statusCode === 'number' && e.statusCode >= 400) {
      throw (e);
    }
  }
};

// Helper to detect volumes
const isVolume = mount => mount.Name && mount.Type === 'volume';

// Helper to detect NFS volumes
const isNfsVolume = inspect => inspect.Options && typeof inspect.Options.type === 'string' && !!inspect.Options.type.match(/nfs/i);

// Helper to detect non-persistent volumes
const isNonPersistentVolume = inspect => inspect.Labels == null;

// Backup volume as a tar file
const volumesAlreadyBackedUp = [];
const backupVolume = volumeLimit(async (name) => {
  // Skip volumes we've already backed up
  if (volumesAlreadyBackedUp.includes(name)) return;
  volumesAlreadyBackedUp.push(name);

  const volume = docker.getVolume(name);
  const inspect = await volume.inspect();

  // Skip non-persistent volumes completely
  if (!nonPersistentVolumes && isNonPersistentVolume(inspect)) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Saving volume inspect for ${name}...`);
  await saveVolumeInspect(inspect);

  // Skip NFS volume contents
  if (!nfsVolumeContents && isNfsVolume(inspect)) {
    return;
  }

  // Get containers attached to this volume so we can stop them
  const containers = await docker.listContainers({
    filters: {
      volume: [name],
      status: ['running'],
    },
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
      volumes.map(volume => backupVolume(volume.Name)),
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
const volumesAlreadyRestored = [];
const restoreVolume = volumeLimit(async (name) => {
  // Skip volumes we've already backed up
  if (volumesAlreadyRestored.includes(name)) return;
  volumesAlreadyRestored.push(name);

  const inspect = await loadVolumeInspect(name);

  const volumeAlreadyExists = await volumeExists(name);
  if (!volumeAlreadyExists) {
    // eslint-disable-next-line no-console
    console.log(`Creating volume ${inspect.Name}...`);
    await docker.createVolume(volumeInspect2Config(inspect));
  }

  if (volumeArchives.includes(name)) {
    // Get containers attached to this volume so we can stop them
    const containers = await docker.listContainers({
      filters: {
        volume: [name],
        status: ['running'],
      },
    });

    // Stop these containers so they wouldn't change their data
    await Promise.all(
      containers.map(container => stopContainer(container.Id)),
    );

    // eslint-disable-next-line no-console
    console.log(`Restoring contents of ${inspect.Name}...`);

    await docker.run(
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
  }
});

// Restore (create) container by id
const restoreContainer = containerLimit(async (name) => {
  // eslint-disable-next-line no-console
  console.log(`== Restoring container: ${name} ==`);

  const inspect = await loadContainerInspect(name);

  // Restore volumes
  if (operateOnVolumes) {
    // Extract and filter volumes to know if we have anything to restore
    const volumes = inspect.Mounts
      .filter(mount => isVolume(mount) && volumeInspects.includes(mount.Name));

    // Only go ahead if we actually have backup files to restore
    if (volumes.length) {
      // Go over the container's volumes and restore their contents
      await Promise.all(
        volumes.map(volume => restoreVolume(volume.Name)),
      );
    }
  }

  // Restore container
  if (operateOnContainers) {
    // Pull the image if it doesn't exist
    await ensureImageExists(inspect.Config.Image);

    // eslint-disable-next-line no-console
    console.log('Creating container...');
    const container = await docker.createContainer(containerInspect2Config(inspect));
    const newInspect = await container.inspect();

    // Start the container if it was backed up in a running state and is not currently running
    if (inspect.State.Running) {
      await startContainer(newInspect.Id);
    }
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
