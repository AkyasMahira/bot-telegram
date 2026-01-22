/**
 * Google Sheets Service for Telegram Patient Bot
 * Handles interaction with Google Sheets API
 */

const { google } = require("googleapis");
const {
  PATIENT_FIELDS,
  TEETH_FIELDS,
  EXAMINATION_FIELDS,
  KONDISI_GIGI_TYPES,
  KARIES_TYPES,
} = require("./constants");

class SheetsService {
  constructor(spreadsheetId, credentialsPath) {
    this.spreadsheetId = spreadsheetId;
    this.credentialsPath = credentialsPath;
    this.sheets = null;
    this.noCounter = 0;
    this.sheetName = "Database"; // Pastikan nama sheet di Google Sheets "Database"
    this.initializationPromise = this._initialize();
  }

  async _initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: this.credentialsPath,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: "v4", auth: authClient });

      await this._initializeCounters();
    } catch (error) {
      console.error("Failed to initialize Google Sheets API:", error);
      throw error;
    }
  }

  async _initializeCounters() {
    try {
      // Baca kolom A dari sheet Database untuk counter
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
      });

      const rows = response.data.values;
      if (rows && rows.length > 1) {
        const lastNo = parseInt(rows[rows.length - 1][0], 10);
        if (!isNaN(lastNo)) {
          this.noCounter = lastNo;
        }
      }
    } catch (error) {
      console.log("Starting counters from 0 (or sheet not found)");
      this.noCounter = 0;
    }
  }

  getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  generateRecordId() {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    return `RMD-${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  getNextNo() {
    this.noCounter += 1;
    return this.noCounter;
  }

  getKondisiGigiImageUrl(kondisiLabel) {
    const kondisi = KONDISI_GIGI_TYPES.find((k) => k.label === kondisiLabel);
    return kondisi ? kondisi.imageUrl : null;
  }

  getLetakKariesImageUrl(kariesLabel) {
    const karies = KARIES_TYPES.find((k) => k.label === kariesLabel);
    return karies ? karies.imageUrl : null;
  }

  /**
   * Append patient data to Google Spreadsheet (Sheet: Database)
   */
  async appendPatientData(patientData, teethData, examinationData = {}) {
    try {
      await this.initializationPromise;
      await this._initializeCounters();

      const recordId = this.generateRecordId();
      const timestamp = this.getCurrentTime();
      const rows = [];

      // CONFIGURATION: Field mana yang mau dipindah posisinya ke belakang
      const SPECIAL_PATIENT_FIELDS = [
        "namaWali",
        "tanggalLahir",
        "lokasiPemeriksaan",
      ];
      // Diagnosa & Tindakan juga dipindah ke paling belakang (setelah Lokasi)
      const SPECIAL_TEETH_FIELDS = ["diagnosa", "tindakan"];

      // --- TAHAP 1: Susun Data ---
      for (let i = 0; i < teethData.length; i++) {
        const tooth = teethData[i];
        const no = this.getNextNo();

        // 1. Metadata (A-D)
        const rowData = [no, recordId, this.getCurrentDate(), timestamp];

        // 2. Patient Fields (Isi E-..., lewati yang Special)
        PATIENT_FIELDS.forEach((field) => {
          if (!SPECIAL_PATIENT_FIELDS.includes(field.key)) {
            rowData.push(patientData[field.key] || "");
          }
        });

        // 3. Teeth Fields (Isi kolom tengah, lewati Diagnosa & Tindakan)
        TEETH_FIELDS.forEach((field) => {
          // Kita skip diagnosa & tindakan disini agar tidak "nyelip" di tengah
          if (!SPECIAL_TEETH_FIELDS.includes(field.key)) {
            rowData.push(tooth[field.key] || "");
          }
        });

        // 4. Examination Fields (Isi kolom selanjutnya)
        EXAMINATION_FIELDS.forEach((field) => {
          rowData.push(examinationData[field.key] || "");
        });

        // 5. Custom Patient Fields (Taruh di Belakang: AA, AB, AC)
        rowData.push(patientData["namaWali"] || "-");
        rowData.push(patientData["tanggalLahir"] || "-");
        rowData.push(patientData["lokasiPemeriksaan"] || "-");

        // 6. Custom Teeth Fields (Taruh Paling Belakang: AD, AE)
        rowData.push(tooth["diagnosa"] || "-"); // Masuk setelah Lokasi Pemeriksaan
        rowData.push(tooth["tindakan"] || "-"); // Masuk setelah Diagnosa

        rows.push(rowData);
      }

      // --- TAHAP 2: Upload Data Teks ---
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        resource: { values: rows },
      });

      // --- TAHAP 3: Update Gambar ---
      const updatedRange = response.data.updates.updatedRange;
      const match = updatedRange.match(/[A-Z]+(\d+):/);
      let startRow = match ? parseInt(match[1], 10) : 0;

      if (startRow > 0) {
        const imageUpdates = [];

        // Hitung Offset Kolom
        // 4 Metadata + (Total Patient Fields - 3 Special Patient Fields)
        const columnOffset =
          4 + (PATIENT_FIELDS.length - SPECIAL_PATIENT_FIELDS.length);

        for (let i = 0; i < teethData.length; i++) {
          const tooth = teethData[i];
          const currentRow = startRow + i;

          // Gambar Kondisi Gigi
          const kondisiImageUrl = this.getKondisiGigiImageUrl(
            tooth.kondisiGigi,
          );
          if (kondisiImageUrl) {
            // Kita cari index originalnya di array TEETH_FIELDS
            // Karena 'diagnosa' dan 'tindakan' ada SETELAH 'kondisiGigi' dan 'letakKaries' di constants.js,
            // maka urutan index untuk gambar AMAN (tidak bergeser).
            const colIndex =
              columnOffset +
              TEETH_FIELDS.findIndex((f) => f.key === "kondisiGigi");
            imageUpdates.push({
              range: `${this.sheetName}!${this.columnIndexToLetter(colIndex)}${currentRow}`,
              values: [[`=IMAGE("${kondisiImageUrl}")`]],
            });
          }

          // Gambar Letak Karies
          const kariesImageUrl = this.getLetakKariesImageUrl(tooth.letakKaries);
          if (kariesImageUrl) {
            const colIndex =
              columnOffset +
              TEETH_FIELDS.findIndex((f) => f.key === "letakKaries");
            imageUpdates.push({
              range: `${this.sheetName}!${this.columnIndexToLetter(colIndex)}${currentRow}`,
              values: [[`=IMAGE("${kariesImageUrl}")`]],
            });
          }
        }

        // Eksekusi Update Gambar
        if (imageUpdates.length > 0) {
          const data = imageUpdates.map((update) => ({
            range: update.range,
            values: update.values,
          }));

          await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              valueInputOption: "USER_ENTERED",
              data: data,
            },
          });
        }
      }

      return { success: true, recordId, rowsInserted: rows.length };
    } catch (error) {
      console.error("Error appending patient data to Google Sheets:", error);
      return { success: false, error: error.message };
    }
  }

  columnIndexToLetter(index) {
    let letter = "";
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }
}

module.exports = SheetsService;
