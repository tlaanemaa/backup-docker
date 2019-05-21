const program = require('commander');
const { version, name } = require('../../package.json');

const commandArgs = {};

// Main shared options
program
  .name(name)
  .version(version, '-v, --version')
  .description('A simple command line tool to backup and restore docker container inspection results and their volumes.\nRead more at: https://www.npmjs.com/package/backup-docker')
  .option('-d, --directory [directory]', 'directory name to save to or look for container backups', process.cwd())
  .option('-s, --socket-path [socket-path]', 'docker socket path')
  .option('--only-containers', 'backup/restore containers only')
  .option('--only-volumes', 'backup/restore volumes only. If used with the restore command then the container is expected to already exist and the container names, if not provided, are still taken from backups');

// Backup command
program
  .command('backup [containers...]')
  .description('backup given or all containers in docker instance')
  .option('--nfs-volume-contents', 'also backup the contents of nfs volumes')
  .option('--non-persistent-volumes', 'also backup non-persistent (unnamed) volumes')
  .action(async (containers) => {
    commandArgs.operation = 'backup';
    commandArgs.containers = containers;
  });

// Restore command
program
  .command('restore [containers...]')
  .description('restore given or all containers in docker instance')
  .action(async (containers) => {
    commandArgs.operation = 'restore';
    commandArgs.containers = containers;
  });

// Unknown command handler
program
  .command('*', { noHelp: true })
  .action((command) => {
    throw new Error(`Unknown command: ${command}\nUse --help to see usage information`);
  });

// Parse args
program.parse(process.argv);

// Show help if no operation is provided
if (!commandArgs.operation) {
  program.help();
}

const options = { ...commandArgs, ...program.opts() };

// Convert volume and container switches to more easily usable values
module.exports = {
  ...options,
  operateOnContainers: options.onlyContainers || (!options.onlyContainers && !options.onlyVolumes),
  operateOnVolumes: options.onlyVolumes || (!options.onlyVolumes && !options.onlyContainers),
};
