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
  .option('--only-volumes', 'backup/restore volumes only. If used with the restore command then the container is expected to already exist');

// Backup command
program
  .command('backup [containers...]')
  .description('backup given or all containers in docker instance')
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
    // eslint-disable-next-line no-console
    console.error(`Unknown operation: ${command}`, '\nUse --help to see all options');
    process.exit(1);
  });

// Parse args
program.parse(process.argv);

// Show help if no operation is provided
if (!commandArgs.operation) {
  program.outputHelp();
  process.exit(1);
}

module.exports = { ...commandArgs, ...program.opts() };
