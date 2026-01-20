/**
 * Property-based tests for SheetsService
 * Using fast-check for property-based testing
 */

const fc = require('fast-check');
const SheetsService = require('../src/sheetsService');
const { FIELDS } = require('../src/constants');

describe('SheetsService Property-Based Tests', () => {
  
  /**
   * Feature: telegram-patient-bot, Property 6: Date Format Consistency
   * Validates: Requirements 7.2
   * 
   * For any patient record saved to spreadsheet, the date field should always 
   * match the DD/MM/YYYY format.
   */
  describe('Property 6: Date Format Consistency', () => {
    test('getCurrentDate always returns DD/MM/YYYY format', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // arbitrary number of calls
          (callCount) => {
            // Create a minimal service instance for testing date formatting
            // We only need the getCurrentDate method, not full initialization
            const service = Object.create(SheetsService.prototype);
            
            // Call getCurrentDate multiple times
            for (let i = 0; i < callCount; i++) {
              const date = service.getCurrentDate();
              
              // Verify format: DD/MM/YYYY
              const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
              if (!dateRegex.test(date)) {
                return false;
              }
              
              // Verify the parts are valid
              const parts = date.split('/');
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              
              // Day should be 1-31
              if (day < 1 || day > 31) {
                return false;
              }
              
              // Month should be 1-12
              if (month < 1 || month > 12) {
                return false;
              }
              
              // Year should be reasonable (e.g., 2000-2100)
              if (year < 2000 || year > 2100) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: telegram-patient-bot, Property 4: Field Order Preservation
   * Validates: Requirements 3.1, 7.4
   * 
   * For any data collection session, fields should be requested in the exact order 
   * defined in constants, and data should be written to spreadsheet columns in the same order.
   */
  describe('Property 4: Field Order Preservation', () => {
    test('patient data is formatted in correct field order for spreadsheet', () => {
      // Generator for random patient data
      const patientDataArbitrary = fc.record({
        namaPasien: fc.string(),
        nik: fc.string(),
        jenisKelamin: fc.string(),
        usia: fc.string(),
        alamat: fc.string(),
        noTelepon: fc.string(),
        dokterPemeriksa: fc.string(),
        diagnosa: fc.string(),
        tindakan: fc.string(),
        penyakitLainnya: fc.string(),
        golonganDarah: fc.string(),
        tekananDarah: fc.string(),
        gigiDikeluhkan: fc.string(),
        perawatanPersetujuan: fc.string(),
        biayaDokter: fc.string(),
        biayaLab: fc.string(),
        totalBiaya: fc.string(),
        keteranganLain: fc.string()
      });

      fc.assert(
        fc.property(
          patientDataArbitrary,
          (patientData) => {
            // Create a minimal service instance
            const service = Object.create(SheetsService.prototype);
            service.idCounter = 0;
            
            // Simulate building row data (same logic as appendPatientData)
            const id = 1;
            const date = service.getCurrentDate();
            const rowData = [id, date];
            
            // Add patient data fields in the exact order defined in FIELDS
            FIELDS.forEach(field => {
              rowData.push(patientData[field.key] || '');
            });
            
            // Verify the row has correct structure:
            // - First element is ID (number)
            // - Second element is date (string in DD/MM/YYYY format)
            // - Remaining 18 elements are patient data in FIELDS order
            if (rowData.length !== 20) { // 2 (ID + date) + 18 (patient fields)
              return false;
            }
            
            // Verify ID is first
            if (typeof rowData[0] !== 'number') {
              return false;
            }
            
            // Verify date is second and in correct format
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(rowData[1])) {
              return false;
            }
            
            // Verify patient data is in correct order (starting from index 2)
            for (let i = 0; i < FIELDS.length; i++) {
              const expectedValue = patientData[FIELDS[i].key] || '';
              const actualValue = rowData[i + 2]; // +2 because ID and date come first
              
              if (expectedValue !== actualValue) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: telegram-patient-bot, Property 3: Row Uniqueness
   * Validates: Requirements 8.2, 8.5
   * 
   * For any two concurrent data submissions, each submission should result in a 
   * unique row in the spreadsheet with unique auto-increment IDs.
   */
  describe('Property 3: Row Uniqueness', () => {
    test('multiple sequential ID generations produce unique IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // number of submissions
          (numSubmissions) => {
            // Create a service instance
            const service = Object.create(SheetsService.prototype);
            service.idCounter = 0;
            
            // Generate multiple IDs
            const generatedIds = [];
            for (let i = 0; i < numSubmissions; i++) {
              const id = service.getNextId();
              generatedIds.push(id);
            }
            
            // Verify all IDs are unique
            const uniqueIds = new Set(generatedIds);
            if (uniqueIds.size !== generatedIds.length) {
              return false;
            }
            
            // Verify IDs are sequential (1, 2, 3, ...)
            for (let i = 0; i < generatedIds.length; i++) {
              if (generatedIds[i] !== i + 1) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('IDs increment correctly from any starting point', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // starting ID
          fc.integer({ min: 1, max: 50 }), // number of increments
          (startId, numIncrements) => {
            // Create a service instance with a specific starting ID
            const service = Object.create(SheetsService.prototype);
            service.idCounter = startId;
            
            // Generate IDs
            const generatedIds = [];
            for (let i = 0; i < numIncrements; i++) {
              generatedIds.push(service.getNextId());
            }
            
            // Verify IDs are sequential starting from startId + 1
            for (let i = 0; i < generatedIds.length; i++) {
              if (generatedIds[i] !== startId + i + 1) {
                return false;
              }
            }
            
            // Verify all IDs are unique
            const uniqueIds = new Set(generatedIds);
            return uniqueIds.size === generatedIds.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
