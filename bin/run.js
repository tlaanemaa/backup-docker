#!/usr/bin/env node

const logAndExit = (err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
};

// Global error handlers
process.on('uncaughtException', logAndExit);
process.on('unhandledRejection', logAndExit);

(async () => {
  // eslint-disable-next-line global-require
  await require('..')();

  // Safeguard against hanging application
  process.exit();
})();
