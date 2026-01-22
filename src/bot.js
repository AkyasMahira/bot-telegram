/**
 * Bot module for Telegram Patient Bot
 * Handles bot initialization and command handlers
 */

const TelegramBot = require("node-telegram-bot-api");
const {
  MESSAGES,
  CALLBACK_DATA,
  KARIES_TYPES,
  KONDISI_GIGI_TYPES,
  REKOMENDASI_PERAWATAN,
  OKLUSI_TYPES,
  TORUS_PALATINUS_TYPES,
  TORUS_MANDIBULARIS_TYPES,
  PALATUM_TYPES,
  JENIS_KELAMIN_TYPES,
  TINDAKAN_TYPES, // <-- IMPORT BARU
  PATIENT_FIELDS,
  TEETH_FIELDS,
  EXAMINATION_FIELDS,
  ALL_FIELDS,
} = require("./constants");
const path = require("path");

/**
 * TelegramPatientBot class
 * Manages bot lifecycle and command handlers
 */
class TelegramPatientBot {
  constructor(token, sessionManager, sheetsService) {
    this.bot = new TelegramBot(token, { polling: true });
    this.sessionManager = sessionManager;
    this.sheetsService = sheetsService;
  }

  start() {
    this.registerCommands();
    this.registerCallbacks();
    this.registerErrorHandlers();
    console.log("Bot started successfully");
  }

  registerErrorHandlers() {
    this.bot.on("polling_error", (error) => {
      console.error("Telegram polling error:", error);
    });
    this.bot.on("webhook_error", (error) => {
      console.error("Telegram webhook error:", error);
    });
  }

  registerCommands() {
    this.bot.onText(/\/start/, (msg) => this.handleStartCommand(msg));
    this.bot.onText(/\/newpatient/, (msg) => this.handleNewPatientCommand(msg));
    this.bot.onText(/\/exit/, (msg) => this.handleExitCommand(msg));
    this.bot.onText(/\/letak_karies/, (msg) =>
      this.handleLetakKariesCommand(msg),
    );
    this.bot.on("message", (msg) => this.handleMessage(msg));
  }

  registerCallbacks() {
    this.bot.on("callback_query", (query) => this.handleCallbackQuery(query));
  }

  // ==================== COMMAND HANDLERS ====================

  async handleStartCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      if (this.sessionManager.hasActiveSession(userId)) {
        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Lanjutkan",
                  callback_data: CALLBACK_DATA.RESUME_CONTINUE,
                },
                {
                  text: "Mulai Baru",
                  callback_data: CALLBACK_DATA.RESUME_START_NEW,
                },
              ],
            ],
          },
        };
        await this.bot.sendMessage(chatId, MESSAGES.CONTINUE_SESSION, options);
      } else {
        const session = this.sessionManager.createSession(userId);
        session.state = "waiting_doctor_name";
        await this.bot.sendMessage(chatId, MESSAGES.ASK_DOCTOR_NAME);
      }
    } catch (error) {
      console.error("Error in handleStartCommand:", error);
      await this.sendErrorMessage(
        chatId,
        "Terjadi kesalahan. Silakan coba lagi.",
      );
    }
  }

  async handleNewPatientCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const existingSession = this.sessionManager.getSession(userId);

      if (existingSession && existingSession.state === "collecting") {
        await this.bot.sendMessage(chatId, MESSAGES.ERROR_ALREADY_HAS_SESSION);
        return;
      }

      const doctorName = existingSession ? existingSession.doctorName : null;
      this.sessionManager.deleteSession(userId);
      this.sessionManager.createSession(userId, doctorName);

      await this.bot.sendMessage(chatId, MESSAGES.FIRST_FIELD_PROMPT);
    } catch (error) {
      console.error("Error in handleNewPatientCommand:", error);
      await this.sendErrorMessage(
        chatId,
        "Terjadi kesalahan. Silakan coba lagi.",
      );
    }
  }

  async handleExitCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      if (!this.sessionManager.hasActiveSession(userId)) {
        await this.bot.sendMessage(chatId, MESSAGES.ERROR_NO_ACTIVE_SESSION);
        return;
      }
      this.sessionManager.deleteSession(userId);
      await this.bot.sendMessage(chatId, MESSAGES.CANCELLED);
    } catch (error) {
      console.error("Error in handleExitCommand:", error);
      await this.sendErrorMessage(
        chatId,
        "Terjadi kesalahan. Silakan coba lagi.",
      );
    }
  }

  async handleLetakKariesCommand(msg) {
    const chatId = msg.chat.id;
    try {
      const keyboard = KARIES_TYPES.map((k) => [
        {
          text: k.label,
          callback_data: `${CALLBACK_DATA.KARIES_PREFIX}${k.key}`,
        },
      ]);
      await this.bot.sendMessage(
        chatId,
        "Pilih karies yang ingin Anda lihat:",
        {
          reply_markup: { inline_keyboard: keyboard },
        },
      );
    } catch (error) {
      console.error("Error in handleLetakKariesCommand:", error);
      await this.sendErrorMessage(
        chatId,
        "Terjadi kesalahan. Silakan coba lagi.",
      );
    }
  }

  // ==================== CALLBACK HANDLER ====================

  async handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    try {
      // Session resume
      if (data === CALLBACK_DATA.RESUME_CONTINUE) {
        await this.handleResumeContinue(chatId, userId);
      } else if (data === CALLBACK_DATA.RESUME_START_NEW) {
        await this.handleResumeStartNew(chatId, userId);
      }
      // Confirmation
      else if (data === CALLBACK_DATA.CONFIRM_YES) {
        await this.handleConfirmYes(chatId, userId);
      } else if (data === CALLBACK_DATA.CONFIRM_NO) {
        await this.handleConfirmNo(chatId, userId);
      } else if (data === CALLBACK_DATA.CONFIRM_CHANGE) {
        await this.handleConfirmChange(chatId, userId);
      }
      // Edit field
      else if (data.startsWith(CALLBACK_DATA.EDIT_FIELD_PREFIX)) {
        await this.handleEditFieldSelection(chatId, userId, data);
      }
      // Karies command (view image)
      else if (data.startsWith(CALLBACK_DATA.KARIES_PREFIX)) {
        await this.handleKariesSelection(chatId, data);
      }
      // Field inputs - Jenis Kelamin
      else if (data.startsWith(CALLBACK_DATA.FIELD_JENIS_KELAMIN_PREFIX)) {
        await this.handleJenisKelaminSelection(chatId, userId, data);
      }
      // Field inputs - Kondisi Gigi
      else if (data.startsWith(CALLBACK_DATA.FIELD_KONDISI_PREFIX)) {
        await this.handleKondisiGigiSelection(chatId, userId, data);
      }
      // Field inputs - Letak Karies
      else if (data.startsWith(CALLBACK_DATA.FIELD_KARIES_PREFIX)) {
        await this.handleFieldKariesSelection(chatId, userId, data);
      }
      // Field inputs - Tindakan (NEW)
      else if (data.startsWith(CALLBACK_DATA.FIELD_TINDAKAN_PREFIX)) {
        await this.handleTindakanSelection(chatId, userId, data);
      }
      // Field inputs - Rekomendasi Perawatan
      else if (data.startsWith(CALLBACK_DATA.FIELD_REKOMENDASI_PREFIX)) {
        await this.handleRekomendasiSelection(chatId, userId, data);
      }
      // Field inputs - Oklusi
      else if (data.startsWith(CALLBACK_DATA.FIELD_OKLUSI_PREFIX)) {
        await this.handleOklusiSelection(chatId, userId, data);
      }
      // Field inputs - Torus Palatinus
      else if (data.startsWith(CALLBACK_DATA.FIELD_TORUS_P_PREFIX)) {
        await this.handleTorusPalatinusSelection(chatId, userId, data);
      }
      // Field inputs - Torus Mandibularis
      else if (data.startsWith(CALLBACK_DATA.FIELD_TORUS_M_PREFIX)) {
        await this.handleTorusMandibularisSelection(chatId, userId, data);
      }
      // Field inputs - Palatum
      else if (data.startsWith(CALLBACK_DATA.FIELD_PALATUM_PREFIX)) {
        await this.handlePalatumSelection(chatId, userId, data);
      }
      // Add more teeth
      else if (data === CALLBACK_DATA.ADD_TEETH_YES) {
        await this.handleAddMoreTeethYes(chatId, userId);
      } else if (data === CALLBACK_DATA.ADD_TEETH_NO) {
        await this.handleAddMoreTeethNo(chatId, userId);
      }
    } catch (error) {
      console.error("Error in handleCallbackQuery:", error);
      await this.sendErrorMessage(
        chatId,
        "Terjadi kesalahan. Silakan coba lagi.",
      );
    } finally {
      try {
        await this.bot.answerCallbackQuery(query.id);
      } catch (e) {
        console.error("Failed to answer callback query:", e);
      }
    }
  }

  // ==================== MESSAGE HANDLER ====================

  async handleMessage(msg) {
    if (msg.text && msg.text.startsWith("/")) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      if (!this.sessionManager.hasActiveSession(userId)) return;

      const session = this.sessionManager.getSession(userId);

      // Waiting for doctor name
      if (session.state === "waiting_doctor_name") {
        session.doctorName = msg.text;
        session.patientData.dokterPemeriksa = msg.text;
        session.state = "idle";
        const welcomeMsg = `Hai dokter ${msg.text}, semangat kerjanya hari ini🤗!\nKetik /newpatient untuk memulai pendataan.`;
        await this.bot.sendMessage(chatId, welcomeMsg);
        return;
      }

      // Editing mode
      if (session.state === "editing" && session.editingField) {
        await this.handleEditInput(chatId, userId, session, msg.text);
        return;
      }

      // Collecting patient data
      if (session.state === "collecting_patient") {
        await this.handlePatientFieldInput(chatId, userId, session, msg.text);
        return;
      }

      // Collecting teeth data
      if (session.state === "collecting_teeth") {
        await this.handleTeethFieldInput(chatId, userId, session, msg.text);
        return;
      }

      // Collecting examination data (after teeth)
      if (session.state === "collecting_examination") {
        await this.handleExaminationFieldInput(
          chatId,
          userId,
          session,
          msg.text,
        );
        return;
      }
    } catch (error) {
      console.error("Error in handleMessage:", error);
      await this.sendErrorMessage(
        chatId,
        "Terjadi kesalahan. Silakan coba lagi.",
      );
    }
  }

  // ==================== PATIENT DATA COLLECTION ====================

  async handlePatientFieldInput(chatId, userId, session, text) {
    const currentField = PATIENT_FIELDS[session.patientFieldIndex];

    if (!currentField) {
      session.state = "collecting_teeth";
      session.teethFieldIndex = 0;
      await this.promptNextTeethField(chatId, userId, session);
      return;
    }

    if (currentField.type !== "dropdown") {
      session.patientData[currentField.key] = text;
      session.patientFieldIndex++;
      await this.promptNextPatientField(chatId, userId, session);
    }
  }

  async promptNextPatientField(chatId, userId, session) {
    const nextField = PATIENT_FIELDS[session.patientFieldIndex];

    if (!nextField) {
      session.state = "collecting_teeth";
      session.teethFieldIndex = 0;
      await this.promptNextTeethField(chatId, userId, session);
      return;
    }

    if (session.patientData[nextField.key]) {
      session.patientFieldIndex++;
      await this.promptNextPatientField(chatId, userId, session);
      return;
    }

    if (nextField.key === "jenisKelamin" || nextField.type === "dropdown") {
      if (nextField.key === "jenisKelamin") {
        await this.showJenisKelaminDropdown(chatId);
      }
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `${MESSAGES.FIELD_PROMPT_PREFIX}${nextField.label}:`,
    );
  }

  // ==================== TEETH DATA COLLECTION ====================

  async promptNextTeethField(chatId, userId, session) {
    const currentField = TEETH_FIELDS[session.teethFieldIndex];

    if (!currentField) {
      await this.askAddMoreTeeth(chatId);
      return;
    }

    if (currentField.key === "letakKaries" && currentField.conditional) {
      const currentTooth = session.currentTooth || {};
      const kondisi = KONDISI_GIGI_TYPES.find(
        (k) => k.label === currentTooth.kondisiGigi,
      );
      if (!kondisi || !kondisi.hasKariesLocation) {
        session.currentTooth.letakKaries = "-";
        session.teethFieldIndex++;
        await this.promptNextTeethField(chatId, userId, session);
        return;
      }
    }

    if (currentField.key === "kondisiGigi") {
      await this.showKondisiGigiDropdown(chatId);
    } else if (currentField.key === "letakKaries") {
      await this.showLetakKariesDropdown(chatId);
    } else if (currentField.key === "tindakan") {
      // <-- HANDLE TINDAKAN DROPDOWN
      await this.showTindakanDropdown(chatId);
    } else if (currentField.key === "rekomendasiPerawatan") {
      await this.showRekomendasiDropdown(chatId);
    } else {
      await this.bot.sendMessage(
        chatId,
        `${MESSAGES.FIELD_PROMPT_PREFIX}${currentField.label}:`,
      );
    }
  }

  async handleTeethFieldInput(chatId, userId, session, text) {
    const currentField = TEETH_FIELDS[session.teethFieldIndex];

    if (!currentField) return;

    if (currentField.type !== "dropdown") {
      if (!session.currentTooth) session.currentTooth = {};
      session.currentTooth[currentField.key] = text;
      session.teethFieldIndex++;
      await this.promptNextTeethField(chatId, userId, session);
    }
  }

  // ==================== DROPDOWN HANDLERS ====================

  async showJenisKelaminDropdown(chatId) {
    const keyboard = JENIS_KELAMIN_TYPES.map((j) => [
      {
        text: j.label,
        callback_data: `${CALLBACK_DATA.FIELD_JENIS_KELAMIN_PREFIX}${j.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, "Pilih Jenis Kelamin:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async showKondisiGigiDropdown(chatId) {
    const keyboard = KONDISI_GIGI_TYPES.map((k) => [
      {
        text: k.label,
        callback_data: `${CALLBACK_DATA.FIELD_KONDISI_PREFIX}${k.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, MESSAGES.SELECT_KONDISI_GIGI, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async showLetakKariesDropdown(chatId) {
    const keyboard = KARIES_TYPES.map((k) => [
      {
        text: k.label,
        callback_data: `${CALLBACK_DATA.FIELD_KARIES_PREFIX}${k.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, MESSAGES.SELECT_LETAK_KARIES, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  // --- NEW: Tindakan Dropdown ---
  async showTindakanDropdown(chatId) {
    const keyboard = TINDAKAN_TYPES.map((t) => [
      {
        text: t.label,
        callback_data: `${CALLBACK_DATA.FIELD_TINDAKAN_PREFIX}${t.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, "Pilih Tindakan:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async showRekomendasiDropdown(chatId) {
    const keyboard = REKOMENDASI_PERAWATAN.map((r) => [
      {
        text: r.label,
        callback_data: `${CALLBACK_DATA.FIELD_REKOMENDASI_PREFIX}${r.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, MESSAGES.SELECT_REKOMENDASI, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async showOklusiDropdown(chatId) {
    const keyboard = OKLUSI_TYPES.map((o) => [
      {
        text: o.label,
        callback_data: `${CALLBACK_DATA.FIELD_OKLUSI_PREFIX}${o.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, MESSAGES.SELECT_OKLUSI, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async showTorusPalatinusDropdown(chatId) {
    const keyboard = TORUS_PALATINUS_TYPES.map((t) => [
      {
        text: t.label,
        callback_data: `${CALLBACK_DATA.FIELD_TORUS_P_PREFIX}${t.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, MESSAGES.SELECT_TORUS_PALATINUS, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async showTorusMandibularisDropdown(chatId) {
    const keyboard = TORUS_MANDIBULARIS_TYPES.map((t) => [
      {
        text: t.label,
        callback_data: `${CALLBACK_DATA.FIELD_TORUS_M_PREFIX}${t.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, MESSAGES.SELECT_TORUS_MANDIBULARIS, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async showPalatumDropdown(chatId) {
    const keyboard = PALATUM_TYPES.map((p) => [
      {
        text: p.label,
        callback_data: `${CALLBACK_DATA.FIELD_PALATUM_PREFIX}${p.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, MESSAGES.SELECT_PALATUM, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  // ==================== SELECTION HANDLERS ====================

  async handleJenisKelaminSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_JENIS_KELAMIN_PREFIX, "");
    const gender = JENIS_KELAMIN_TYPES.find((j) => j.key === key);

    if (!gender) return;

    session.patientData.jenisKelamin = gender.label;

    if (
      session.state === "editing" &&
      session.editingField?.key === "jenisKelamin"
    ) {
      session.editingField = null;
      session.state = "confirming";
      await this.showConfirmationSummary(chatId, userId);
    } else {
      session.patientFieldIndex++;
      await this.promptNextPatientField(chatId, userId, session);
    }
  }

  async handleKondisiGigiSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_KONDISI_PREFIX, "");
    const kondisi = KONDISI_GIGI_TYPES.find((k) => k.key === key);

    if (!kondisi) return;

    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.kondisiGigi = kondisi.label;
    session.teethFieldIndex++;

    await this.promptNextTeethField(chatId, userId, session);
  }

  async handleFieldKariesSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_KARIES_PREFIX, "");
    const karies = KARIES_TYPES.find((k) => k.key === key);

    if (!karies) return;

    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.letakKaries = karies.label;
    session.teethFieldIndex++;

    await this.promptNextTeethField(chatId, userId, session);
  }

  // --- NEW: Handle Tindakan Selection ---
  async handleTindakanSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_TINDAKAN_PREFIX, "");
    const tindakan = TINDAKAN_TYPES.find((t) => t.key === key);

    if (!tindakan) return;

    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.tindakan = tindakan.label;
    session.teethFieldIndex++;

    await this.promptNextTeethField(chatId, userId, session);
  }

  async handleRekomendasiSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_REKOMENDASI_PREFIX, "");
    const rekomendasi = REKOMENDASI_PERAWATAN.find((r) => r.key === key);

    if (!rekomendasi) return;

    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.rekomendasiPerawatan = rekomendasi.label;
    session.teethFieldIndex++;

    await this.promptNextTeethField(chatId, userId, session);
  }

  async handleOklusiSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_OKLUSI_PREFIX, "");
    const oklusi = OKLUSI_TYPES.find((o) => o.key === key);

    if (!oklusi) return;

    session.examinationData.oklusi = oklusi.label;
    session.examinationFieldIndex++;

    await this.promptNextExaminationField(chatId, userId, session);
  }

  async handleTorusPalatinusSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_TORUS_P_PREFIX, "");
    const torus = TORUS_PALATINUS_TYPES.find((t) => t.key === key);

    if (!torus) return;

    session.examinationData.torusPalatinus = torus.label;
    session.examinationFieldIndex++;

    await this.promptNextExaminationField(chatId, userId, session);
  }

  async handleTorusMandibularisSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_TORUS_M_PREFIX, "");
    const torus = TORUS_MANDIBULARIS_TYPES.find((t) => t.key === key);

    if (!torus) return;

    session.examinationData.torusMandibularis = torus.label;
    session.examinationFieldIndex++;

    await this.promptNextExaminationField(chatId, userId, session);
  }

  async handlePalatumSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(CALLBACK_DATA.FIELD_PALATUM_PREFIX, "");
    const palatum = PALATUM_TYPES.find((p) => p.key === key);

    if (!palatum) return;

    session.examinationData.palatum = palatum.label;
    session.examinationFieldIndex++;

    await this.promptNextExaminationField(chatId, userId, session);
  }

  // ==================== ADD MORE TEETH ====================

  async askAddMoreTeeth(chatId) {
    const keyboard = [
      [
        { text: "Ya", callback_data: CALLBACK_DATA.ADD_TEETH_YES },
        { text: "Tidak", callback_data: CALLBACK_DATA.ADD_TEETH_NO },
      ],
    ];
    await this.bot.sendMessage(chatId, MESSAGES.ASK_ADD_MORE_TEETH, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async handleAddMoreTeethYes(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    if (session.currentTooth && Object.keys(session.currentTooth).length > 0) {
      session.teethData.push({ ...session.currentTooth });
    }

    session.currentTooth = {};
    session.teethFieldIndex = 0;

    await this.promptNextTeethField(chatId, userId, session);
  }

  async handleAddMoreTeethNo(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    if (session.currentTooth && Object.keys(session.currentTooth).length > 0) {
      session.teethData.push({ ...session.currentTooth });
    }

    session.state = "collecting_examination";
    session.examinationFieldIndex = 0;
    await this.promptNextExaminationField(chatId, userId, session);
  }

  // ==================== EXAMINATION DATA COLLECTION ====================

  async promptNextExaminationField(chatId, userId, session) {
    const currentField = EXAMINATION_FIELDS[session.examinationFieldIndex];

    if (!currentField) {
      await this.showConfirmationSummary(chatId, userId);
      return;
    }

    if (currentField.key === "oklusi") {
      await this.showOklusiDropdown(chatId);
    } else if (currentField.key === "torusPalatinus") {
      await this.showTorusPalatinusDropdown(chatId);
    } else if (currentField.key === "torusMandibularis") {
      await this.showTorusMandibularisDropdown(chatId);
    } else if (currentField.key === "palatum") {
      await this.showPalatumDropdown(chatId);
    } else {
      await this.bot.sendMessage(
        chatId,
        `${MESSAGES.FIELD_PROMPT_PREFIX}${currentField.label}:`,
      );
    }
  }

  async handleExaminationFieldInput(chatId, userId, session, text) {
    const currentField = EXAMINATION_FIELDS[session.examinationFieldIndex];

    if (!currentField) return;

    if (currentField.type !== "dropdown") {
      session.examinationData[currentField.key] = text;
      session.examinationFieldIndex++;
      await this.promptNextExaminationField(chatId, userId, session);
    }
  }

  // ==================== CONFIRMATION & SAVE ====================

  async showConfirmationSummary(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    let summary = MESSAGES.SUMMARY_HEADER;

    summary += "*Data Pasien:*\n";
    PATIENT_FIELDS.forEach((field) => {
      const value = session.patientData[field.key] || "-";
      summary += `• ${field.label}: ${value}\n`;
    });

    summary += "\n*Data Gigi:*\n";
    session.teethData.forEach((tooth, index) => {
      summary += `\n_Gigi ${index + 1}:_\n`;
      TEETH_FIELDS.forEach((field) => {
        if (!field.conditional || tooth[field.key] !== "-") {
          const value = tooth[field.key] || "-";
          summary += `• ${field.label}: ${value}\n`;
        }
      });
    });

    summary += "\n*Data Pemeriksaan:*\n";
    EXAMINATION_FIELDS.forEach((field) => {
      const value = session.examinationData[field.key] || "-";
      summary += `• ${field.label}: ${value}\n`;
    });

    summary += MESSAGES.SUMMARY_QUESTION;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Yes", callback_data: CALLBACK_DATA.CONFIRM_YES },
            { text: "No", callback_data: CALLBACK_DATA.CONFIRM_NO },
            { text: "Change", callback_data: CALLBACK_DATA.CONFIRM_CHANGE },
          ],
        ],
      },
      parse_mode: "Markdown",
    };

    await this.bot.sendMessage(chatId, summary, options);
  }

  async handleConfirmYes(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) {
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_NO_ACTIVE_SESSION);
      return;
    }

    try {
      const result = await this.sheetsService.appendPatientData(
        session.patientData,
        session.teethData,
        session.examinationData,
      );

      if (result.success) {
        await this.bot.sendMessage(chatId, MESSAGES.SUCCESS);
        this.sessionManager.deleteSession(userId);
      } else {
        await this.bot.sendMessage(chatId, MESSAGES.ERROR_SAVE_FAILED);
      }
    } catch (error) {
      console.error("Error in handleConfirmYes:", error);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_SAVE_FAILED);
    }
  }

  async handleConfirmNo(chatId, userId) {
    this.sessionManager.deleteSession(userId);
    await this.bot.sendMessage(chatId, MESSAGES.CANCELLED);
  }

  async handleConfirmChange(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) {
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_NO_ACTIVE_SESSION);
      return;
    }

    session.state = "editing";
    const keyboard = [];

    PATIENT_FIELDS.forEach((field) => {
      keyboard.push([
        {
          text: `📋 ${field.label}`,
          callback_data: `${CALLBACK_DATA.EDIT_FIELD_PREFIX}patient_${field.key}`,
        },
      ]);
    });

    session.teethData.forEach((tooth, index) => {
      keyboard.push([
        {
          text: `🦷 Gigi ${index + 1}: ${tooth.gigiDikeluhkan || "-"}`,
          callback_data: `${CALLBACK_DATA.EDIT_FIELD_PREFIX}tooth_${index}`,
        },
      ]);
    });

    EXAMINATION_FIELDS.forEach((field) => {
      keyboard.push([
        {
          text: `🔬 ${field.label}`,
          callback_data: `${CALLBACK_DATA.EDIT_FIELD_PREFIX}exam_${field.key}`,
        },
      ]);
    });

    await this.bot.sendMessage(chatId, MESSAGES.SELECT_FIELD_TO_EDIT, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async handleEditFieldSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const fieldKey = data.replace(CALLBACK_DATA.EDIT_FIELD_PREFIX, "");

    if (fieldKey.startsWith("patient_")) {
      const key = fieldKey.replace("patient_", "");
      const field = PATIENT_FIELDS.find((f) => f.key === key);

      if (field) {
        session.editingField = { type: "patient", key };

        if (key === "jenisKelamin") {
          await this.showJenisKelaminDropdown(chatId);
        } else {
          await this.bot.sendMessage(
            chatId,
            `${MESSAGES.EDIT_FIELD_PROMPT_PREFIX}${field.label}${MESSAGES.EDIT_FIELD_PROMPT_SUFFIX}:`,
          );
        }
      }
    } else if (fieldKey.startsWith("tooth_")) {
      const index = parseInt(fieldKey.replace("tooth_", ""));
      session.editingField = { type: "tooth", index };

      const keyboard = TEETH_FIELDS.map((field) => [
        {
          text: field.label,
          callback_data: `${CALLBACK_DATA.EDIT_FIELD_PREFIX}toothfield_${index}_${field.key}`,
        },
      ]);

      await this.bot.sendMessage(
        chatId,
        "Pilih field gigi yang ingin diubah:",
        {
          reply_markup: { inline_keyboard: keyboard },
        },
      );
    } else if (fieldKey.startsWith("toothfield_")) {
      const parts = fieldKey.replace("toothfield_", "").split("_");
      const toothIndex = parseInt(parts[0]);
      const fieldKeyName = parts[1];
      const field = TEETH_FIELDS.find((f) => f.key === fieldKeyName);

      if (field) {
        session.editingField = {
          type: "toothfield",
          toothIndex,
          key: fieldKeyName,
        };

        if (field.type === "dropdown") {
          if (fieldKeyName === "kondisiGigi") {
            await this.showKondisiGigiDropdown(chatId);
          } else if (fieldKeyName === "letakKaries") {
            await this.showLetakKariesDropdown(chatId);
          } else if (fieldKeyName === "tindakan") {
            // Handle edit tindakan
            await this.showTindakanDropdown(chatId);
          } else if (fieldKeyName === "rekomendasiPerawatan") {
            await this.showRekomendasiDropdown(chatId);
          }
        } else {
          await this.bot.sendMessage(
            chatId,
            `${MESSAGES.EDIT_FIELD_PROMPT_PREFIX}${field.label}${MESSAGES.EDIT_FIELD_PROMPT_SUFFIX}:`,
          );
        }
      }
    } else if (fieldKey.startsWith("exam_")) {
      const key = fieldKey.replace("exam_", "");
      const field = EXAMINATION_FIELDS.find((f) => f.key === key);

      if (field) {
        session.editingField = { type: "examination", key };

        if (field.type === "dropdown") {
          if (key === "oklusi") {
            await this.showOklusiDropdown(chatId);
          } else if (key === "torusPalatinus") {
            await this.showTorusPalatinusDropdown(chatId);
          } else if (key === "torusMandibularis") {
            await this.showTorusMandibularisDropdown(chatId);
          } else if (key === "palatum") {
            await this.showPalatumDropdown(chatId);
          }
        } else {
          await this.bot.sendMessage(
            chatId,
            `${MESSAGES.EDIT_FIELD_PROMPT_PREFIX}${field.label}${MESSAGES.EDIT_FIELD_PROMPT_SUFFIX}:`,
          );
        }
      }
    }
  }

  async handleEditInput(chatId, userId, session, text) {
    if (!session.editingField) return;

    if (session.editingField.type === "patient") {
      session.patientData[session.editingField.key] = text;
    } else if (session.editingField.type === "toothfield") {
      const { toothIndex, key } = session.editingField;
      if (session.teethData[toothIndex]) {
        session.teethData[toothIndex][key] = text;
      }
    } else if (session.editingField.type === "examination") {
      session.examinationData[session.editingField.key] = text;
    }

    session.editingField = null;
    session.state = "confirming";
    await this.showConfirmationSummary(chatId, userId);
  }

  // ==================== RESUME HANDLERS ====================

  async handleResumeContinue(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    if (session.state === "collecting_patient") {
      await this.promptNextPatientField(chatId, userId, session);
    } else if (session.state === "collecting_teeth") {
      await this.promptNextTeethField(chatId, userId, session);
    } else if (session.state === "collecting_examination") {
      await this.promptNextExaminationField(chatId, userId, session);
    } else {
      await this.showConfirmationSummary(chatId, userId);
    }
  }

  async handleResumeStartNew(chatId, userId) {
    const existingSession = this.sessionManager.getSession(userId);
    const doctorName = existingSession ? existingSession.doctorName : null;

    this.sessionManager.deleteSession(userId);
    this.sessionManager.createSession(userId, doctorName);

    await this.bot.sendMessage(chatId, MESSAGES.FIRST_FIELD_PROMPT);
  }

  // ==================== KARIES COMMAND (VIEW IMAGE) ====================

  async handleKariesSelection(chatId, data) {
    const key = data.replace(CALLBACK_DATA.KARIES_PREFIX, "");
    const karies = KARIES_TYPES.find((k) => k.key === key);

    if (!karies) {
      await this.sendErrorMessage(chatId, "Jenis karies tidak ditemukan.");
      return;
    }

    try {
      const imagePath = path.join(__dirname, "..", karies.file);
      await this.bot.sendPhoto(chatId, imagePath, {
        caption: `Gambar ${karies.label}`,
      });
    } catch (error) {
      console.error("Error sending karies image:", error);
      await this.sendErrorMessage(
        chatId,
        "Terjadi kesalahan saat mengirim gambar.",
      );
    }
  }

  // ==================== UTILITY ====================

  async sendErrorMessage(chatId, message) {
    try {
      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Failed to send error message:", error);
    }
  }
}

module.exports = TelegramPatientBot;
