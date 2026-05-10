const TelegramPatientBot = require('./bot');
const SessionManager = require('./sessionManager');
const SheetsService = require('./sheetsService');
const axios = require('axios');

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
    console.log('✓ Bot is running and listening for messages');

    // Uptime Kuma Push Monitoring
    const KUMA_PUSH_URL = process.env.UPTIME_KUMA_URL;

    if (KUMA_PUSH_URL) {
      console.log('✓ Uptime Kuma monitoring activated');

      setInterval(async () => {
        try {
          await axios.get(KUMA_PUSH_URL);
          console.log('✓ Ping sent to Uptime Kuma');
        } catch (err) {
          console.error('Kuma Push Error:', err.message);
        }
      }, 60000); // setiap 60 detik
    }

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