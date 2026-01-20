/**
 * Configuration module for Telegram Patient Bot
 * Loads and validates environment variables
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Handle Google Credentials for cloud deployment (Railway, Render, etc)
// If GOOGLE_CREDENTIALS_BASE64 is set, decode and write to file
if (process.env.GOOGLE_CREDENTIALS_BASE64) {
  try {
    const credentials = Buffer.from(
      process.env.GOOGLE_CREDENTIALS_BASE64,
      'base64'
    ).toString('utf-8');
    
    const credPath = path.join(__dirname, '..', 'credentials.json');
    fs.writeFileSync(credPath, credentials);
    
    // Set the path for Google API
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    console.log('Google credentials loaded from GOOGLE_CREDENTIALS_BASE64');
  } catch (error) {
    console.error('Failed to decode GOOGLE_CREDENTIALS_BASE64:', error);
  }
}

/**
 * Validates that a required environment variable is present
 * @param {string} name - Name of the environment variable
 * @param {string} value - Value of the environment variable
 * @throws {Error} If the variable is missing
 */
function validateRequired(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

// Load environment variables
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const spreadsheetId = process.env.SPREADSHEET_ID;
const googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Validate all required variables are present
// Requirements: 10.4
validateRequired('TELEGRAM_BOT_TOKEN', telegramToken);
validateRequired('SPREADSHEET_ID', spreadsheetId);
validateRequired('GOOGLE_APPLICATION_CREDENTIALS', googleCredentialsPath);

module.exports = {
  telegramToken,
  spreadsheetId,
  googleCredentialsPath
};
