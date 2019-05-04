const commands = require('./commands');
const { operation } = require('./modules/options');

// Main method to run the tool
module.exports = async () => {
  const results = await commands[operation]();
  // eslint-disable-next-line no-console
  console.log('== Done ==');

  // Check if we had any errors and throw them if we did
  const errors = results.filter(result => result instanceof Error);
  if (errors.length) {
    const errorHeader = '\nThe following errors occurred during the run (this does not include errors from the tar command used for volume backup/restore):\n';
    const errorMessages = errors.map(e => e.message).join('\n');
    throw new Error(errorHeader + errorMessages);
  }

  return results;
};
