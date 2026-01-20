/**
 * Google Sheets Service for Telegram Patient Bot
 * Handles interaction with Google Sheets API
 */

const { google } = require('googleapis');
const { PATIENT_FIELDS, TEETH_FIELDS, EXAMINATION_FIELDS, KONDISI_GIGI_TYPES, KARIES_TYPES } = require('./constants');

class SheetsService {
  constructor(spreadsheetId, credentialsPath) {
    this.spreadsheetId = spreadsheetId;
    this.credentialsPath = credentialsPath;
    this.sheets = null;
    this.noCounter = 0; // For auto-increment No (per row)
    this.patientCounter = 0; // For auto-increment Record ID (per patient)
    this.initializationPromise = this._initialize();
  }

  async _initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: this.credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      await this._initializeCounters();
    } catch (error) {
      console.error('Failed to initialize Google Sheets API:', error);
      throw error;
    }
  }

  async _initializeCounters() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:B', // Get No and Record ID columns
      });

      const rows = response.data.values;
      if (rows && rows.length > 1) {
        // Get last No (column A)
        const lastNo = parseInt(rows[rows.length - 1][0], 10);
        if (!isNaN(lastNo)) {
          this.noCounter = lastNo;
        }

        // Get last unique Record ID (column B) and extract number
        const recordIds = rows.slice(1).map(row => row[1]).filter(Boolean);
        if (recordIds.length > 0) {
          const lastRecordId = recordIds[recordIds.length - 1];
          const match = lastRecordId.match(/P-(\d+)/);
          if (match) {
            this.patientCounter = parseInt(match[1], 10);
          }
        }
      }
    } catch (error) {
      console.log('Starting counters from 0');
      this.noCounter = 0;
      this.patientCounter = 0;
    }
  }

  /**
   * Get current date formatted as DD/MM/YYYY
   */
  getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Get current time formatted as HH:mm:ss
   */
  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Generate Record ID based on patient counter (P-001, P-002, etc.)
   */
  generateRecordId() {
    this.patientCounter++;
    return `P-${String(this.patientCounter).padStart(3, '0')}`;
  }

  /**
   * Get next auto-increment No
   */
  getNextNo() {
    this.noCounter += 1;
    return this.noCounter;
  }

  /**
   * Get image URL for kondisi gigi
   */
  getKondisiGigiImageUrl(kondisiLabel) {
    const kondisi = KONDISI_GIGI_TYPES.find(k => k.label === kondisiLabel);
    return kondisi ? kondisi.imageUrl : null;
  }

  /**
   * Get image URL for letak karies
   */
  getLetakKariesImageUrl(kariesLabel) {
    const karies = KARIES_TYPES.find(k => k.label === kariesLabel);
    return karies ? karies.imageUrl : null;
  }

  /**
   * Append patient data to Google Spreadsheet
   * Creates one row per tooth entry
   * @param {Object} patientData - Patient data object
   * @param {Array} teethData - Array of teeth data objects
   * @param {Object} examinationData - Examination data object
   */
  async appendPatientData(patientData, teethData, examinationData = {}) {
    try {
      await this.initializationPromise;

      // Generate Record ID for this patient (same for all teeth)
      const recordId = this.generateRecordId();
      const timestamp = this.getCurrentTime();
      const rows = [];
      const imageUpdates = []; // Track cells that need IMAGE formula

      // Calculate starting row (current last row + 1)
      const currentRows = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A',
      });
      let startRow = (currentRows.data.values ? currentRows.data.values.length : 0) + 1;

      // Create one row per tooth
      for (let i = 0; i < teethData.length; i++) {
        const tooth = teethData[i];
        const no = this.getNextNo();
        const rowNumber = startRow + i;
        
        // Build row: No, Record ID, Tanggal, Timestamp, Patient Fields..., Teeth Fields..., Examination Fields...
        const rowData = [no, recordId, this.getCurrentDate(), timestamp];
        
        // Add patient data
        PATIENT_FIELDS.forEach(field => {
          rowData.push(patientData[field.key] || '');
        });
        
        // Add teeth data (text values first, will update with images later)
        TEETH_FIELDS.forEach(field => {
          rowData.push(tooth[field.key] || '');
        });

        // Add examination data (same for all teeth rows)
        EXAMINATION_FIELDS.forEach(field => {
          rowData.push(examinationData[field.key] || '');
        });

        rows.push(rowData);

        // Track image updates for kondisiGigi
        const kondisiImageUrl = this.getKondisiGigiImageUrl(tooth.kondisiGigi);
        if (kondisiImageUrl) {
          // Column index: 4 (No, RecordID, Tanggal, Timestamp) + PATIENT_FIELDS.length + index of kondisiGigi in TEETH_FIELDS
          const kondisiColIndex = 4 + PATIENT_FIELDS.length + TEETH_FIELDS.findIndex(f => f.key === 'kondisiGigi');
          imageUpdates.push({
            row: rowNumber,
            col: kondisiColIndex,
            imageUrl: kondisiImageUrl
          });
        }

        // Track image updates for letakKaries
        const kariesImageUrl = this.getLetakKariesImageUrl(tooth.letakKaries);
        if (kariesImageUrl) {
          const kariesColIndex = 4 + PATIENT_FIELDS.length + TEETH_FIELDS.findIndex(f => f.key === 'letakKaries');
          imageUpdates.push({
            row: rowNumber,
            col: kariesColIndex,
            imageUrl: kariesImageUrl
          });
        }
      }

      // Append all rows (text values)
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'A:A',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: rows
        }
      });

      // Update cells with IMAGE formulas
      for (const update of imageUpdates) {
        const colLetter = this.columnIndexToLetter(update.col);
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${colLetter}${update.row}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[`=IMAGE("${update.imageUrl}")`]]
          }
        });
      }

      return { success: true, recordId, rowsInserted: rows.length };
    } catch (error) {
      console.error('Error appending patient data to Google Sheets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert column index to letter (0=A, 1=B, ..., 26=AA, etc.)
   */
  columnIndexToLetter(index) {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }
}

module.exports = SheetsService;
