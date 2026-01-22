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
    this.sheetName = "Database";
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
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
      });
      const rows = response.data.values;
      if (rows && rows.length > 1) {
        const lastNo = parseInt(rows[rows.length - 1][0], 10);
        if (!isNaN(lastNo)) this.noCounter = lastNo;
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

  async appendPatientData(patientData, teethData, examinationData = {}) {
    try {
      await this.initializationPromise;
      await this._initializeCounters();

      const recordId = this.generateRecordId();
      const timestamp = this.getCurrentTime();
      const rows = [];

      const SPECIAL_PATIENT_FIELDS = [
        "namaWali",
        "tanggalLahir",
        "lokasiPemeriksaan",
      ];
      const SPECIAL_TEETH_FIELDS = ["diagnosa", "tindakan"];
      const SPECIAL_EXAM_FIELDS = [
        "faseGeligi",
        "molarErupsi",
        "insisifErupsi",
        "relasiMolarKanan",
        "relasiMolarKiri",
        "kasusSederhana",
        "diastemaMultipel",
        "kondisiGigigeligi",
        "lainLain",
        "rekomendasiUtama",
        "dokterPJ",
      ];

      for (let i = 0; i < teethData.length; i++) {
        const tooth = teethData[i];
        const no = this.getNextNo();
        const rowData = [no, recordId, this.getCurrentDate(), timestamp];

        PATIENT_FIELDS.forEach((field) => {
          if (!SPECIAL_PATIENT_FIELDS.includes(field.key))
            rowData.push(patientData[field.key] || "");
        });

        TEETH_FIELDS.forEach((field) => {
          if (!SPECIAL_TEETH_FIELDS.includes(field.key))
            rowData.push(tooth[field.key] || "");
        });

        EXAMINATION_FIELDS.forEach((field) => {
          if (!SPECIAL_EXAM_FIELDS.includes(field.key))
            rowData.push(examinationData[field.key] || "");
        });

        rowData.push(patientData["namaWali"] || "-");
        rowData.push(patientData["tanggalLahir"] || "-");
        rowData.push(patientData["lokasiPemeriksaan"] || "-");
        rowData.push(tooth["diagnosa"] || "-");
        rowData.push(tooth["tindakan"] || "-");
        rowData.push(examinationData["faseGeligi"] || "-");
        rowData.push(examinationData["molarErupsi"] || "-");
        rowData.push(examinationData["insisifErupsi"] || "-");
        rowData.push(examinationData["relasiMolarKanan"] || "-");
        rowData.push(examinationData["relasiMolarKiri"] || "-");
        rowData.push(examinationData["kasusSederhana"] || "-");
        rowData.push(examinationData["diastemaMultipel"] || "-");
        rowData.push(examinationData["kondisiGigigeligi"] || "-");
        rowData.push(examinationData["lainLain"] || "-");
        rowData.push(examinationData["rekomendasiUtama"] || "-");
        rowData.push(examinationData["dokterPJ"] || "-");

        rows.push(rowData);
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        resource: { values: rows },
      });

      const updatedRange = response.data.updates.updatedRange;
      const match = updatedRange.match(/[A-Z]+(\d+):/);
      let startRow = match ? parseInt(match[1], 10) : 0;

      if (startRow > 0) {
        const imageUpdates = [];
        const columnOffset =
          4 + (PATIENT_FIELDS.length - SPECIAL_PATIENT_FIELDS.length);

        for (let i = 0; i < teethData.length; i++) {
          const tooth = teethData[i];
          const currentRow = startRow + i;

          const kondisiImageUrl = this.getKondisiGigiImageUrl(
            tooth.kondisiGigi,
          );
          if (kondisiImageUrl) {
            const colIndex =
              columnOffset +
              TEETH_FIELDS.findIndex((f) => f.key === "kondisiGigi");
            imageUpdates.push({
              range: `${this.sheetName}!${this.columnIndexToLetter(colIndex)}${currentRow}`,
              values: [[`=IMAGE("${kondisiImageUrl}")`]],
            });
          }

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

        if (imageUpdates.length > 0) {
          await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              valueInputOption: "USER_ENTERED",
              data: imageUpdates.map((u) => ({
                range: u.range,
                values: u.values,
              })),
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
