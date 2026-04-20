/**
 * Google Sheets Service for Telegram Patient Bot
 * Handles interaction with Google Sheets API
 */

const { google } = require("googleapis");
const { KONDISI_GIGI_TYPES, KARIES_TYPES } = require("./constants");

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
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  generateRecordId() {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, "0");
    return `RMD-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
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

  columnIndexToLetter(index) {
    let letter = "";
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  async appendPatientData(patientData, teethData, examinationData = {}) {
    try {
      await this.initializationPromise;
      await this._initializeCounters();

      // 1. AMBIL HEADER AGAR MAPPING KOLOM DINAMIS DAN AKURAT
      const headerResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:ZZ1`,
      });

      const rawHeaders = headerResponse.data.values[0] || [];
      const headers = rawHeaders.map((h) => h.toString().trim());

      const recordId = this.generateRecordId();
      const timestamp = this.getCurrentTime();
      const rows = [];

      for (let i = 0; i < teethData.length; i++) {
        const tooth = teethData[i];
        const no = this.getNextNo();

        // Buat array kosong sepanjang jumlah header di Google Sheets
        const rowData = new Array(headers.length).fill("-");

        // Fungsi bantu: cari nama kolom, lalu tembak datanya di posisi index tersebut
        const setVal = (colName, value) => {
          const idx = headers.indexOf(colName);
          if (idx !== -1) {
            rowData[idx] = value && value !== "" ? value : "-";
          }
        };

        // --- SISTEM ---
        setVal("No", no);
        setVal("RecordID", recordId);
        setVal("Tanggal", this.getCurrentDate());
        setVal("Timestamp", timestamp);

        // --- DATA PASIEN ---
        setVal("Nama Pasien", patientData.namaPasien);
        setVal("NIK / No. RM", patientData.nik);
        setVal("Jenis Kelamin", patientData.jenisKelamin);
        setVal("Usia", patientData.usia);
        setVal("Golongan Darah", patientData.golonganDarah);
        setVal("Alamat", patientData.alamat);
        setVal("No. Telepon", patientData.noTelepon);
        setVal("Dokter Pemeriksa", patientData.dokterPemeriksa);
        setVal("Wali", patientData.namaWali);
        setVal("Tanggal Lahir", patientData.tanggalLahir);
        setVal("Lokasi Pemeriksaan", patientData.lokasiPemeriksaan);

        // --- DATA GIGI ---
        setVal("Gigi yang Dikeluhkan", tooth.gigiDikeluhkan);
        setVal("Kondisi Gigi", tooth.kondisiGigi);
        setVal("Letak Karies", tooth.letakKaries);
        setVal("Diagnosa", tooth.diagnosa);
        setVal("Tindakan", tooth.tindakan);
        setVal("Rekomendasi perawatan", tooth.rekomendasiPerawatan);

        // --- DATA PEMERIKSAAN ---
        setVal("Oklusi", examinationData.oklusi);
        setVal("Torus Palatinus", examinationData.torusPalatinus);
        setVal("Torus Mandibularis", examinationData.torusMandibularis);
        setVal("Palatum", examinationData.palatum);
        setVal("Diastema", examinationData.diastema);
        setVal("Gigi Anomali", examinationData.gigiAnomali);

        // Handle DMF yang mungkin formatnya beda-beda
        setVal("D", examinationData.skorD);
        setVal("M", examinationData.skorM);
        setVal("F", examinationData.skorF);
        setVal("DMF", examinationData.skorD);
        setVal("Skor DMF", examinationData.skorM);

        setVal("Fase Geligi Campuran", examinationData.faseGeligi);
        setVal(
          "4 Molar Permanen RA-RB Sudah erupsi Sempurna",
          examinationData.molarErupsi,
        );
        setVal(
          "4 Insisif Permanen RA-RB Sudaherupsi Sempurna",
          examinationData.insisifErupsi,
        );
        setVal(
          "Relasi Molar Kanan neutroklasi",
          examinationData.relasiMolarKanan,
        );
        setVal(
          "Relasi Molar Kiri neutroklasi",
          examinationData.relasiMolarKiri,
        );
        setVal(
          "Kasus sederhana (Dental bukan Skeletal)",
          examinationData.kasusSederhana,
        );
        setVal("Diastema Multipel", examinationData.diastemaMultipel);
        setVal("Kondisi Gigigeligi", examinationData.kondisiGigiGeligi);
        setVal("Lain-Lain / Catatan", examinationData.lainLain);
        setVal("Rekomendasi Perawatan Utama", examinationData.rekomendasiUtama);
        setVal(
          "Dokter Gigi Penanggung jawab lapangan",
          examinationData.dokterPJ,
        );

        rows.push(rowData);
      }

      // 2. SIMPAN KE SPREADSHEET
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        resource: { values: rows },
      });

      // 3. INJEKSI GAMBAR JIKA ADA KONDISI GIGI
      const updatedRange = response.data.updates.updatedRange;
      const match = updatedRange.match(/[A-Z]+(\d+):/);
      let startRow = match ? parseInt(match[1], 10) : 0;

      if (startRow > 0) {
        const imageUpdates = [];

        // Cari otomatis Huruf Kolom untuk Kondisi Gigi & Karies
        const getColLetter = (colName) => {
          const idx = headers.indexOf(colName);
          return idx !== -1 ? this.columnIndexToLetter(idx) : null;
        };

        const kondisiColLetter = getColLetter("Kondisi Gigi");
        const kariesColLetter = getColLetter("Letak Karies");

        for (let i = 0; i < teethData.length; i++) {
          const tooth = teethData[i];
          const currentRow = startRow + i;

          const kondisiImageUrl = this.getKondisiGigiImageUrl(
            tooth.kondisiGigi,
          );
          if (kondisiImageUrl && kondisiColLetter) {
            imageUpdates.push({
              range: `${this.sheetName}!${kondisiColLetter}${currentRow}`,
              values: [[`=IMAGE("${kondisiImageUrl}")`]],
            });
          }

          const kariesImageUrl = this.getLetakKariesImageUrl(tooth.letakKaries);
          if (kariesImageUrl && kariesColLetter) {
            imageUpdates.push({
              range: `${this.sheetName}!${kariesColLetter}${currentRow}`,
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
}

module.exports = SheetsService;
