require('./modules/fileStructure');
const commands = require('./commands');
const { operation } = require('./modules/options');

// Main method to run the tool
module.exports = async () => {
  const results = await commands[operation]();
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
