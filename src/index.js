const TelegramPatientBot = require('./bot');
const SessionManager = require('./sessionManager');
const SheetsService = require('./sheetsService');


async function main() {
  try {
    console.log('Starting Telegram Patient Bot...');

    const config = require('./config');
    console.log('✓ Configuration loaded and validated');

    const sessionManager = new SessionManager();
    console.log('✓ Session Manager initialized');

    const sheetsService = new SheetsService(
      config.spreadsheetId,
      config.googleCredentialsPath
    );
    console.log('✓ Sheets Service initialized');

    await sheetsService.initializationPromise;
    console.log('✓ Google Sheets API connection established');

    const bot = new TelegramPatientBot(
      config.telegramToken,
      sessionManager,
      sheetsService
    );

    bot.start();
    console.log('Bot is running and listening for messages');
    console.log('Press Ctrl+C to stop the bot');

  } catch (error) {
    console.error('Failed to start bot:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main();
