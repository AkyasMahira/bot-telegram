/**
 * Constants module for Telegram Patient Bot
 * Defines patient data fields, bot messages, and callback data constants
 */

// Patient data fields - basic info (collected once per patient)
const PATIENT_FIELDS = [
  { key: "namaPasien", label: "Nama Pasien" },
  { key: "nik", label: "NIK / No. RM" },
  { key: "jenisKelamin", label: "Jenis Kelamin", type: "dropdown" },
  { key: "tanggalLahir", label: "Tanggal Lahir (DD-MM-YYYY)" }, 
  { key: "usia", label: "Usia" },
  { key: "namaWali", label: "Nama Wali Pasien" },
  { key: "golonganDarah", label: "Golongan Darah" },
  { key: "alamat", label: "Alamat" },
  { key: "noTelepon", label: "No. Telepon" },
  { key: "lokasiPemeriksaan", label: "Lokasi Pemeriksaan" }, 
  { key: "dokterPemeriksa", label: "Dokter Pemeriksa" },
];

// Teeth data fields - collected per tooth (can be multiple)
const TEETH_FIELDS = [
  { key: "gigiDikeluhkan", label: "Gigi yang Dikeluhkan" },
  { key: "kondisiGigi", label: "Kondisi Gigi", type: "dropdown" },
  {
    key: "letakKaries",
    label: "Letak Karies",
    type: "dropdown",
    conditional: true,
  },
  {
    key: "rekomendasiPerawatan",
    label: "Rekomendasi Perawatan",
    type: "dropdown",
  },
];

// Examination fields - collected once after all teeth data (setelah user bilang "Tidak" untuk tambah gigi)
const EXAMINATION_FIELDS = [
  { key: "oklusi", label: "Oklusi", type: "dropdown" },
  { key: "torusPalatinus", label: "Torus Palatinus", type: "dropdown" },
  { key: "torusMandibularis", label: "Torus Mandibularis", type: "dropdown" },
  { key: "palatum", label: "Palatum", type: "dropdown" },
  { key: "diastema", label: "Diastema" },
  { key: "gigiAnomali", label: "Gigi Anomali" },
  { key: "skorD", label: "D (Decay)" },
  { key: "skorM", label: "M (Missin)" },
  { key: "skorF", label: "F (Filled)" },
  { key: "skorDMF", label: "Skor DMF" },
];

// All fields combined for summary display
const ALL_FIELDS = [...PATIENT_FIELDS, ...TEETH_FIELDS, ...EXAMINATION_FIELDS];

// Bot messages
const MESSAGES = {
  // Welcome messages
  ASK_DOCTOR_NAME: "Masukkan Nama Dokter Pemeriksa",
  WELCOME:
    "Hai dokter {name}, semangat kerjanya hari ini🤗!\nKetik /newpatient untuk memulai pendataan.",
  CONTINUE_SESSION:
    "Anda memiliki input data yang belum selesai. Ingin melanjutkan?",

  // Prompts
  FIRST_FIELD_PROMPT: "Masukkan Nama Pasien:",
  FIELD_PROMPT_PREFIX: "Masukkan ",
  EDIT_FIELD_PROMPT_PREFIX: "Masukkan ",
  EDIT_FIELD_PROMPT_SUFFIX: " yang baru",

  // Teeth prompts
  ASK_ADD_MORE_TEETH: "Apakah ada gigi lain yang mau ditambahkan?",

  // Confirmations
  SUMMARY_HEADER:
    "📋 *Ringkasan Data Pasien*\n\nSilakan periksa data berikut:\n\n",
  SUMMARY_QUESTION: "\nApakah data sudah benar?",
  SUCCESS:
    "✅ Data berhasil disimpan ke Google Sheets!\n\nKetik /start untuk memulai ulang pencatatan.",
  CANCELLED: "❌ Input data dibatalkan. Data tidak disimpan.",

  // Errors
  ERROR_SAVE_FAILED: "Data gagal di simpan di google sheets",
  ERROR_NO_ACTIVE_SESSION: "Tidak ada sesi aktif. Ketik /start untuk memulai.",
  ERROR_ALREADY_HAS_SESSION:
    "Anda sudah memiliki sesi aktif. Selesaikan atau gunakan /exit untuk membatalkan.",

  // Instructions
  SELECT_FIELD_TO_EDIT: "Pilih field yang ingin diubah:",
  SELECT_LETAK_KARIES: "Pilih Letak Karies:",
  SELECT_KONDISI_GIGI: "Pilih Kondisi Gigi:",
  SELECT_REKOMENDASI: "Pilih Rekomendasi Perawatan:",
  SELECT_OKLUSI: "Pilih Oklusi:",
  SELECT_TORUS_PALATINUS: "Pilih Torus Palatinus:",
  SELECT_TORUS_MANDIBULARIS: "Pilih Torus Mandibularis:",
  SELECT_PALATUM: "Pilih Palatum:",
};

// Callback data constants for inline keyboards
const CALLBACK_DATA = {
  // Confirmation callbacks
  CONFIRM_YES: "confirm_yes",
  CONFIRM_NO: "confirm_no",
  CONFIRM_CHANGE: "confirm_change",

  // Session resume callbacks
  RESUME_CONTINUE: "resume_continue",
  RESUME_START_NEW: "resume_start_new",

  // Edit callbacks prefix
  EDIT_FIELD_PREFIX: "edit_",
  EDIT_BACK: "edit_back",

  // Karies callbacks prefix (for /letak_karies command)
  KARIES_PREFIX: "karies_",

  // Field input callbacks prefix
  FIELD_KARIES_PREFIX: "field_karies_",
  FIELD_KONDISI_PREFIX: "field_kondisi_",
  FIELD_REKOMENDASI_PREFIX: "field_rekom_",
  FIELD_OKLUSI_PREFIX: "field_oklusi_",
  FIELD_TORUS_P_PREFIX: "field_torusp_",
  FIELD_TORUS_M_PREFIX: "field_torusm_",
  FIELD_PALATUM_PREFIX: "field_palatum_",
  FIELD_JENIS_KELAMIN_PREFIX: "field_jk_", // NEW: Added prefix for Gender

  // Add more teeth callbacks
  ADD_TEETH_YES: "add_teeth_yes",
  ADD_TEETH_NO: "add_teeth_no",
};

// Jenis Kelamin
const JENIS_KELAMIN_TYPES = [
  { key: "LAKI-LAKI", label: "LAKI-LAKI" },
  { key: "PEREMPUAN", label: "PEREMPUAN" },
];

// Oklusi options
const OKLUSI_TYPES = [
  { key: "normal_bite", label: "Normal Bite" },
  { key: "cross_bite", label: "Cross Bite" },
  { key: "steep_bite", label: "Steep Bite" },
];

// Torus Palatinus options
const TORUS_PALATINUS_TYPES = [
  { key: "tidak_ada", label: "Tidak Ada" },
  { key: "kecil", label: "Kecil" },
  { key: "sedang", label: "Sedang" },
  { key: "besar", label: "Besar" },
  { key: "multiple", label: "Multiple" },
];

// Torus Mandibularis options
const TORUS_MANDIBULARIS_TYPES = [
  { key: "tidak_ada", label: "Tidak Ada" },
  { key: "kiri", label: "Kiri" },
  { key: "kanan", label: "Kanan" },
  { key: "kedua_sisi", label: "Kedua Sisi" },
];

// Palatum options
const PALATUM_TYPES = [
  { key: "dalam", label: "Dalam" },
  { key: "sedang", label: "Sedang" },
  { key: "rendah", label: "Rendah" },
];

// Kondisi Gigi options (will show images in Google Sheets)
const KONDISI_GIGI_TYPES = [
  {
    key: "Fraktur Gigi",
    label: "Fraktur",
    hasKariesLocation: false,
    imageUrl:
      "https://drive.google.com/uc?id=1QmXiaoU7zTGYQZahJHtZCUmBh6Jf0GmW",
  },
  {
    key: "Akar Tertinggal",
    label: "Sisa Akar",
    hasKariesLocation: false,
    imageUrl:
      "https://drive.google.com/uc?id=17pTTa1PKzwZy2AJx78yqR92Jl28E9osm",
  },
  {
    key: "Tambalan",
    label: "Tambalan",
    hasKariesLocation: false,
    imageUrl:
      "https://drive.google.com/uc?id=1qtzqF_i2xeDgk60fpRM1fOy4YFFJYPOW",
  },
  {
    key: "Gigi Hilang (Ekstraksi)",
    label: "Gigi Hilang",
    hasKariesLocation: false,
    imageUrl:
      "https://drive.google.com/uc?id=1Pz81FL3CEeDhcDRDbC8u00V1Qb8K0iUR",
  },
  {
    key: "Impaksi",
    label: "Impaksi",
    hasKariesLocation: false,
    imageUrl:
      "https://drive.google.com/uc?id=1gUuWzdL73Jw1NJDXyse7RDZb4FBg10eC",
  },
  {
    key: "Sehat",
    label: "Gigi Sehat",
    hasKariesLocation: false,
    imageUrl:
      "https://drive.google.com/uc?id=1MaUQssH6QWnEoOAL3IOiDQZrmQOaMci4",
  },
  {
    key: "karies",
    label: "Karies",
    hasKariesLocation: true,
    imageUrl: null, // Karies uses letak karies image instead
  },
];

// Karies types with their image file paths
const KARIES_TYPES = [
  {
    key: "D",
    label: "D-car",
    file: "D-car.jpeg",
    imageUrl:
      "https://drive.google.com/uc?export=view&id=1RUcHKcumJLI33BdEI1NAmYQoRJYnV-hI",
  },
  {
    key: "L",
    label: "L-car",
    file: "L-car.jpeg",
    imageUrl:
      "https://drive.google.com/uc?export=view&id=1YqkM3QxMjgAX-jj2ud3DutY8O0CMty5x",
  },
  {
    key: "M",
    label: "M-car",
    file: "M-car.jpeg",
    imageUrl:
      "https://drive.google.com/uc?export=view&id=1B0-vG7584zjxlM0EMr3brUC6o-Ma4u-M",
  },
  {
    key: "O",
    label: "O-car",
    file: "O-car.jpeg",
    imageUrl:
      "https://drive.google.com/uc?export=view&id=18tO2WkHWCwIUr09oDXY9x0sIQVSBJ2W0",
  },
  {
    key: "V",
    label: "V-car",
    file: "V-car.jpeg",
    imageUrl:
      "https://drive.google.com/uc?export=view&id=1qg_M5fEU4NX6vG8vZLyCIo9dC_pTdnPt",
  },
];

// Rekomendasi Perawatan options
const REKOMENDASI_PERAWATAN = [
  { key: "cabut", label: "Cabut gigi" },
  { key: "saluran_akar", label: "Perawatan saluran akar" },
  { key: "tambal", label: "Tambal gigi" },
  { key: "scalling", label: "Scalling" },
  { key: "odontektomi", label: "Odontektomi" },
  { key: "dhe", label: "DHE" },
];

module.exports = {
  PATIENT_FIELDS,
  TEETH_FIELDS,
  EXAMINATION_FIELDS,
  ALL_FIELDS,
  MESSAGES,
  CALLBACK_DATA,
  KONDISI_GIGI_TYPES,
  KARIES_TYPES,
  REKOMENDASI_PERAWATAN,
  OKLUSI_TYPES,
  TORUS_PALATINUS_TYPES,
  TORUS_MANDIBULARIS_TYPES,
  PALATUM_TYPES,
  JENIS_KELAMIN_TYPES, // NEW: Added to export
};
