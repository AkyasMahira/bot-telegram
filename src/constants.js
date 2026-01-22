/**
 * Constants module for Telegram Patient Bot
 * Defines patient data fields, bot messages, and callback data constants
 */

// Patient data fields
const PATIENT_FIELDS = [
  { key: "namaPasien", label: "Nama Pasien" },
  { key: "nik", label: "NIK / No. RM" },
  { key: "jenisKelamin", label: "Jenis Kelamin", type: "dropdown" },
  { key: "usia", label: "Usia" },
  { key: "namaWali", label: "Nama Wali Pasien" },
  { key: "golonganDarah", label: "Golongan Darah" },
  { key: "alamat", label: "Alamat" },
  { key: "noTelepon", label: "No. Telepon" },
  { key: "tanggalLahir", label: "Tanggal Lahir (DD-MM-YYYY)" },
  { key: "lokasiPemeriksaan", label: "Lokasi Pemeriksaan" },
  { key: "dokterPemeriksa", label: "Dokter Pemeriksa" },
];

// Teeth data fields
const TEETH_FIELDS = [
  { key: "gigiDikeluhkan", label: "Gigi yang Dikeluhkan" },
  { key: "kondisiGigi", label: "Kondisi Gigi", type: "dropdown" },
  {
    key: "letakKaries",
    label: "Letak Karies",
    type: "dropdown",
    conditional: true,
  },
  { key: "diagnosa", label: "Diagnosa" },
  { key: "tindakan", label: "Tindakan", type: "dropdown" },
  {
    key: "rekomendasiPerawatan",
    label: "Rekomendasi Perawatan",
    type: "dropdown",
  },
];

// Examination fields
const EXAMINATION_FIELDS = [
  { key: "oklusi", label: "Oklusi", type: "dropdown" },
  { key: "torusPalatinus", label: "Torus Palatinus", type: "dropdown" },
  { key: "torusMandibularis", label: "Torus Mandibularis", type: "dropdown" },
  { key: "palatum", label: "Palatum", type: "dropdown" },
  { key: "diastema", label: "Diastema" },
  { key: "gigiAnomali", label: "Gigi Anomali" },
  { key: "skorD", label: "D (Decay)" },
  { key: "skorM", label: "M (Missing)" },
  { key: "skorF", label: "F (Filled)" },
  { key: "skorDMF", label: "Skor DMF" },
  { key: "faseGeligi", label: "Fase Geligi Campuran", type: "yes_no" },
  {
    key: "molarErupsi",
    label: "4 Molar Permanen RA-RB Sudah Erupsi Sempurna",
    type: "yes_no",
  },
  {
    key: "insisifErupsi",
    label: "4 Insisif Permanen RA-RB Sudah Erupsi Sempurna",
    type: "yes_no",
  },
  {
    key: "relasiMolarKanan",
    label: "Relasi Molar Kanan Neutroklasi",
    type: "yes_no",
  },
  {
    key: "relasiMolarKiri",
    label: "Relasi Molar Kiri Neutroklasi",
    type: "yes_no",
  },
  {
    key: "kasusSederhana",
    label: "Kasus Sederhana (Dental bukan Skeletal)",
    type: "yes_no",
  },
  { key: "diastemaMultipel", label: "Diastema Multipel", type: "yes_no" },
  { key: "kondisiGigigeligi", label: "Kondisi Gigigeligi", type: "dropdown" },
  { key: "lainLain", label: "Lain-Lain / Catatan" },
  {
    key: "rekomendasiUtama",
    label: "Rekomendasi Perawatan Utama",
    type: "dropdown",
  },
  { key: "dokterPJ", label: "Dokter Gigi Penanggung Jawab Lapangan" },
];

const ALL_FIELDS = [...PATIENT_FIELDS, ...TEETH_FIELDS, ...EXAMINATION_FIELDS];

const MESSAGES = {
  ASK_DOCTOR_NAME: "Masukkan Nama Dokter Pemeriksa",
  WELCOME:
    "Hai dokter {name}, semangat kerjanya hari ini🤗!\nKetik /newpatient untuk memulai pendataan.",
  CONTINUE_SESSION:
    "Anda memiliki input data yang belum selesai. Ingin melanjutkan?",
  FIRST_FIELD_PROMPT: "Masukkan Nama Pasien:",
  FIELD_PROMPT_PREFIX: "Masukkan ",
  EDIT_FIELD_PROMPT_PREFIX: "Masukkan ",
  EDIT_FIELD_PROMPT_SUFFIX: " yang baru",
  ASK_ADD_MORE_TEETH: "Apakah ada gigi lain yang mau ditambahkan?",
  SUMMARY_HEADER:
    "📋 *Ringkasan Data Pasien*\n\nSilakan periksa data berikut:\n\n",
  SUMMARY_QUESTION: "\nApakah data sudah benar?",
  SUCCESS:
    "✅ Data berhasil disimpan ke Google Sheets!\n\nKetik /start untuk memulai ulang pencatatan.",
  CANCELLED: "❌ Input data dibatalkan. Data tidak disimpan.",
  ERROR_SAVE_FAILED: "Data gagal di simpan di google sheets",
  ERROR_NO_ACTIVE_SESSION: "Tidak ada sesi aktif. Ketik /start untuk memulai.",
  ERROR_ALREADY_HAS_SESSION:
    "Anda sudah memiliki sesi aktif. Selesaikan atau gunakan /exit untuk membatalkan.",
  SELECT_FIELD_TO_EDIT: "Pilih field yang ingin diubah:",
  SELECT_LETAK_KARIES: "Pilih Letak Karies:",
  SELECT_KONDISI_GIGI: "Pilih Kondisi Gigi:",
  SELECT_REKOMENDASI: "Pilih Rekomendasi Perawatan:",
  SELECT_OKLUSI: "Pilih Oklusi:",
  SELECT_TORUS_PALATINUS: "Pilih Torus Palatinus:",
  SELECT_TORUS_MANDIBULARIS: "Pilih Torus Mandibularis:",
  SELECT_PALATUM: "Pilih Palatum:",
};

const CALLBACK_DATA = {
  CONFIRM_YES: "confirm_yes",
  CONFIRM_NO: "confirm_no",
  CONFIRM_CHANGE: "confirm_change",
  RESUME_CONTINUE: "resume_continue",
  RESUME_START_NEW: "resume_start_new",
  EDIT_FIELD_PREFIX: "edit_",
  EDIT_BACK: "edit_back",
  EDIT_ADD_TOOTH: "edit_add_tooth",
  KARIES_PREFIX: "karies_",
  FIELD_KARIES_PREFIX: "field_karies_",
  FIELD_KONDISI_PREFIX: "field_kondisi_",
  FIELD_REKOMENDASI_PREFIX: "field_rekom_",
  FIELD_OKLUSI_PREFIX: "field_oklusi_",
  FIELD_TORUS_P_PREFIX: "field_torusp_",
  FIELD_TORUS_M_PREFIX: "field_torusm_",
  FIELD_PALATUM_PREFIX: "field_palatum_",
  FIELD_JENIS_KELAMIN_PREFIX: "field_jk_",
  FIELD_TINDAKAN_PREFIX: "field_tindakan_",
  FIELD_YN_PREFIX: "field_yn_",
  FIELD_YA_TIDAK_PREFIX: "field_yatidak_",
  FIELD_KONDISI_GELIGI_PREFIX: "field_kgeligi_",
  FIELD_KONDISI_GIGIGELIGI_PREFIX: "field_kondgigi_",
  FIELD_REKOM_UTAMA_PREFIX: "field_rutama_",
  FIELD_REKOMUTAMA_PREFIX: "field_rekomutama_",
  ADD_TEETH_YES: "add_teeth_yes",
  ADD_TEETH_NO: "add_teeth_no",
};

const JENIS_KELAMIN_TYPES = [
  { key: "LAKI-LAKI", label: "LAKI-LAKI" },
  { key: "PEREMPUAN", label: "PEREMPUAN" },
];

const YES_NO_TYPES = [
  { key: "Ya", label: "Ya" },
  { key: "Tidak", label: "Tidak" },
];

const YA_TIDAK_OPTIONS = [
  { key: "ya", label: "Ya" },
  { key: "tidak", label: "Tidak" },
];

const OKLUSI_TYPES = [
  { key: "normal_bite", label: "Normal Bite" },
  { key: "cross_bite", label: "Cross Bite" },
  { key: "steep_bite", label: "Steep Bite" },
];

const TORUS_PALATINUS_TYPES = [
  { key: "tidak_ada", label: "Tidak Ada" },
  { key: "kecil", label: "Kecil" },
  { key: "sedang", label: "Sedang" },
  { key: "besar", label: "Besar" },
  { key: "multiple", label: "Multiple" },
];

const TORUS_MANDIBULARIS_TYPES = [
  { key: "tidak_ada", label: "Tidak Ada" },
  { key: "kiri", label: "Kiri" },
  { key: "kanan", label: "Kanan" },
  { key: "kedua_sisi", label: "Kedua Sisi" },
];

const PALATUM_TYPES = [
  { key: "dalam", label: "Dalam" },
  { key: "sedang", label: "Sedang" },
  { key: "rendah", label: "Rendah" },
];

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
  { key: "karies", label: "Karies", hasKariesLocation: true, imageUrl: null },
];

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

const TINDAKAN_TYPES = [
  { key: "sehat", label: "Sehat" },
  { key: "penambalan", label: "Penambalan" },
  { key: "pencabutan", label: "Pencabutan" },
  { key: "scaling", label: "Scaling" },
  { key: "rujuk_spesialis", label: "Rujuk Spesialis" },
  { key: "perawatan_rsgm", label: "perawatan RSGM" },
];

const REKOMENDASI_PERAWATAN = [
  { key: "cabut", label: "Cabut gigi" },
  { key: "saluran_akar", label: "Perawatan saluran akar" },
  { key: "tambal", label: "Tambal gigi" },
  { key: "scalling", label: "Scalling" },
  { key: "odontektomi", label: "Odontektomi" },
  { key: "dhe", label: "DHE" },
];

const KONDISI_GIGIGELIGI_TYPES = [
  { key: "berdesakan", label: "Berdesakan" },
  { key: "gigitan_silang", label: "Gigitan Silang" },
  { key: "protusi_anterior", label: "Protusi Anterior" },
];

const KONDISI_GIGI_GELIGI_TYPES = [
  { key: "berdesakan", label: "Berdesakan" },
  { key: "gigitan_silang", label: "Gigitan Silang" },
  { key: "protusi_anterior", label: "Protusi Anterior" },
  { key: "tidak_ada", label: "Tidak Ada" },
];

const REKOMENDASI_UTAMA_TYPES = [
  { key: "tambalan", label: "Tambalan Gigi" },
  { key: "saluran_akar", label: "Perawatan Saluran Akar" },
  { key: "pulpektomi", label: "Indikasi Pulpektomi" },
  { key: "cabut", label: "Cabut Gigi" },
  { key: "scalling", label: "Scalling" },
  { key: "odontektomi", label: "Odontektomi" },
  { key: "orto", label: "Indikasi Orto" },
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
  JENIS_KELAMIN_TYPES,
  TINDAKAN_TYPES,
  YES_NO_TYPES,
  YA_TIDAK_OPTIONS,
  KONDISI_GIGIGELIGI_TYPES,
  KONDISI_GIGI_GELIGI_TYPES,
  REKOMENDASI_UTAMA_TYPES,
};
