/**
 * Unit tests for SheetsService
 * Requirements: 7.2, 7.6
 */

const SheetsService = require('../src/sheetsService');
const { FIELDS } = require('../src/constants');

describe('SheetsService Unit Tests', () => {
  
  describe('getCurrentDate', () => {
    test('should format date as DD/MM/YYYY', () => {
      const service = Object.create(SheetsService.prototype);
      const date = service.getCurrentDate();
      
      // Verify format matches DD/MM/YYYY
      expect(date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      
      // Verify it's a valid date
      const parts = date.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(year).toBeGreaterThanOrEqual(2000);
    });

    test('should pad single digit day and month with zero', () => {
      const service = Object.create(SheetsService.prototype);
      const date = service.getCurrentDate();
      
      const parts = date.split('/');
      // Each part should be exactly 2 digits for day/month, 4 for year
      expect(parts[0]).toHaveLength(2);
      expect(parts[1]).toHaveLength(2);
      expect(parts[2]).toHaveLength(4);
    });
  });

  describe('getNextId', () => {
    test('should increment ID correctly', () => {
      const service = Object.create(SheetsService.prototype);
      service.idCounter = 0;
      
      const id1 = service.getNextId();
      const id2 = service.getNextId();
      const id3 = service.getNextId();
      
      expect(id1).toBe(1);
      expect(id2).toBe(2);
      expect(id3).toBe(3);
    });

    test('should increment from any starting value', () => {
      const service = Object.create(SheetsService.prototype);
      service.idCounter = 100;
      
      const id1 = service.getNextId();
      const id2 = service.getNextId();
      
      expect(id1).toBe(101);
      expect(id2).toBe(102);
    });
  });

  describe('Row data formatting', () => {
    test('should format row data in correct field order', () => {
      const service = Object.create(SheetsService.prototype);
      service.idCounter = 0;
      
      // Sample patient data
      const patientData = {
        namaPasien: 'John Doe',
        nik: '1234567890',
        jenisKelamin: 'Laki-laki',
        usia: '30',
        alamat: 'Jl. Test No. 123',
        noTelepon: '08123456789',
        dokterPemeriksa: 'Dr. Smith',
        diagnosa: 'Flu',
        tindakan: 'Istirahat',
        penyakitLainnya: 'Tidak ada',
        golonganDarah: 'O',
        tekananDarah: '120/80',
        gigiDikeluhkan: 'Tidak ada',
        perawatanPersetujuan: 'Ya',
        biayaDokter: '100000',
        biayaLab: '50000',
        totalBiaya: '150000',
        keteranganLain: 'Tidak ada'
      };
      
      // Simulate row building (same logic as appendPatientData)
      const id = service.getNextId();
      const date = service.getCurrentDate();
      const rowData = [id, date];
      
      FIELDS.forEach(field => {
        rowData.push(patientData[field.key] || '');
      });
      
      // Verify structure
      expect(rowData).toHaveLength(20); // 2 + 18 fields
      expect(rowData[0]).toBe(1); // ID
      expect(rowData[1]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/); // Date
      expect(rowData[2]).toBe('John Doe'); // First field: namaPasien
      expect(rowData[3]).toBe('1234567890'); // Second field: nik
      expect(rowData[19]).toBe('Tidak ada'); // Last field: keteranganLain
    });

    test('should handle missing fields with empty strings', () => {
      const service = Object.create(SheetsService.prototype);
      service.idCounter = 0;
      
      // Partial patient data
      const patientData = {
        namaPasien: 'Jane Doe',
        nik: '9876543210'
        // Other fields missing
      };
      
      const id = service.getNextId();
      const date = service.getCurrentDate();
      const rowData = [id, date];
      
      FIELDS.forEach(field => {
        rowData.push(patientData[field.key] || '');
      });
      
      // Verify structure
      expect(rowData).toHaveLength(20);
      expect(rowData[2]).toBe('Jane Doe');
      expect(rowData[3]).toBe('9876543210');
      // All other fields should be empty strings
      for (let i = 4; i < 20; i++) {
        expect(rowData[i]).toBe('');
      }
    });
  });

  describe('Error handling', () => {
    test('should handle initialization errors gracefully', async () => {
      // Create service with invalid credentials path
      const service = new SheetsService('test-id', '/invalid/path/to/credentials.json');
      
      // The initialization should fail, but not crash
      // We expect the initializationPromise to reject
      await expect(service.initializationPromise).rejects.toThrow();
    });
  });
});
