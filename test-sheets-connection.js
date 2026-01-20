/**
 * Test Google Sheets Connection
 * Script sederhana untuk test koneksi ke Google Sheets
 */

require('dotenv').config();
const { google } = require('googleapis');

async function testSheetsConnection() {
  console.log('🔍 Testing Google Sheets Connection...\n');

  // Load config from .env
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  console.log('📋 Configuration:');
  console.log(`   Spreadsheet ID: ${spreadsheetId}`);
  console.log(`   Credentials: ${credentialsPath}\n`);

  // Validate config
  if (!spreadsheetId) {
    console.error('❌ Error: SPREADSHEET_ID not found in .env');
    process.exit(1);
  }

  if (!credentialsPath) {
    console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS not found in .env');
    process.exit(1);
  }

  try {
    // Initialize Google Auth
    console.log('🔐 Authenticating with Google...');
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Test 1: Get spreadsheet metadata
    console.log('📊 Test 1: Getting spreadsheet metadata...');
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    console.log('✅ Success! Spreadsheet found:');
    console.log(`   Title: ${metadata.data.properties.title}`);
    console.log(`   Locale: ${metadata.data.properties.locale}`);
    console.log(`   Sheets: ${metadata.data.sheets.length}\n`);

    // Test 2: Read data from sheet
    console.log('📖 Test 2: Reading data from sheet...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'A1:T10', // Read first 10 rows
    });

    const rows = response.data.values;
    if (rows && rows.length > 0) {
      console.log(`✅ Success! Found ${rows.length} rows`);
      console.log('   First row (headers):');
      console.log(`   ${rows[0].join(' | ')}\n`);
    } else {
      console.log('⚠️  Sheet is empty (no data found)\n');
    }

    // Test 3: Try to append test data
    console.log('✍️  Test 3: Testing write permission...');
    const testRow = [
      'TEST',
      new Date().toLocaleDateString('id-ID'),
      'Test Connection',
      'DELETE_THIS_ROW'
    ];

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'A:A',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [testRow]
      }
    });

    console.log('✅ Success! Write permission confirmed');
    console.log(`   Data written to: ${appendResponse.data.updates.updatedRange}`);
    console.log('   ⚠️  Note: A test row was added. You can delete it manually.\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('Your Google Sheets connection is working correctly.');
    console.log('The bot should be able to write patient data.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 404) {
      console.error('\n💡 Possible causes:');
      console.error('   1. Spreadsheet ID is incorrect');
      console.error('   2. Spreadsheet does not exist');
      console.error('   3. Service account does not have access to the spreadsheet');
    } else if (error.code === 403) {
      console.error('\n💡 Possible causes:');
      console.error('   1. Spreadsheet not shared with service account');
      console.error('   2. Service account does not have Editor permission');
      console.error('   3. Google Sheets API not enabled');
    } else if (error.code === 400) {
      console.error('\n💡 Possible causes:');
      console.error('   1. The document is not a Google Sheets (might be Google Docs)');
      console.error('   2. Invalid spreadsheet format');
    } else {
      console.error('\n💡 Check:');
      console.error('   1. Credentials file exists and is valid');
      console.error('   2. Internet connection is working');
      console.error('   3. Google Sheets API is enabled in Google Cloud Console');
    }
    
    console.error('\nFull error details:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testSheetsConnection();
