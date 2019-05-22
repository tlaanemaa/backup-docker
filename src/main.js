require('./modules/fileStructure');
const commands = require('./commands');
const { operation, operateOnVolumes } = require('./modules/options');
const { ensureVolumeImageExists, getRunningContainers, startContainer } = require('./modules/docker');

// Main method to run the tool
module.exports = async () => {
  // Make sure we have the volume operations image if we plan to use it
  if (operateOnVolumes) await ensureVolumeImageExists();

  const runningContainers = await getRunningContainers();
  const results = await commands[operation]();

  // eslint-disable-next-line no-console
  console.log('== Ensuring containers that were stopped for volume backups are started again ==');
  await Promise.all(runningContainers.map(container => startContainer(container)));

  // eslint-disable-next-line no-console
  console.log('== Done ==');

  // Print a summary of the results if there are any
  if (results.length) {
    // eslint-disable-next-line no-console
    console.log('\nSummary (does not include errors from the tar command used for volume backup/restore):');
    results.forEach(({ name, result }) => {
      const success = !(result instanceof Error);
      const mark = success ? '✔' : '✖';
      const message = success ? 'Success!' : result.message;
      // eslint-disable-next-line no-console
      console.log(`  ${mark} ${name}: ${message}`);
    });
  }

  return results;
};
