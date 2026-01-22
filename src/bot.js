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
  TINDAKAN_TYPES,
  YES_NO_TYPES,
  KONDISI_GIGIGELIGI_TYPES,
  REKOMENDASI_UTAMA_TYPES,
  PATIENT_FIELDS,
  TEETH_FIELDS,
  EXAMINATION_FIELDS,
  ALL_FIELDS,
} = require("./constants");
const path = require("path");

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
      if (data === CALLBACK_DATA.RESUME_CONTINUE) {
        await this.handleResumeContinue(chatId, userId);
      } else if (data === CALLBACK_DATA.RESUME_START_NEW) {
        await this.handleResumeStartNew(chatId, userId);
      } else if (data === CALLBACK_DATA.CONFIRM_YES) {
        await this.handleConfirmYes(chatId, userId);
      } else if (data === CALLBACK_DATA.CONFIRM_NO) {
        await this.handleConfirmNo(chatId, userId);
      } else if (data === CALLBACK_DATA.CONFIRM_CHANGE) {
        await this.handleConfirmChange(chatId, userId);
      } else if (data.startsWith(CALLBACK_DATA.EDIT_FIELD_PREFIX)) {
        await this.handleEditFieldSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.KARIES_PREFIX)) {
        await this.handleKariesSelection(chatId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_JENIS_KELAMIN_PREFIX)) {
        await this.handleJenisKelaminSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_KONDISI_PREFIX)) {
        await this.handleKondisiGigiSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_KARIES_PREFIX)) {
        await this.handleFieldKariesSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_TINDAKAN_PREFIX)) {
        await this.handleTindakanSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_REKOMENDASI_PREFIX)) {
        await this.handleRekomendasiSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_OKLUSI_PREFIX)) {
        await this.handleOklusiSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_TORUS_P_PREFIX)) {
        await this.handleTorusPalatinusSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_TORUS_M_PREFIX)) {
        await this.handleTorusMandibularisSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_PALATUM_PREFIX)) {
        await this.handlePalatumSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_YN_PREFIX)) {
        // GENERIC YES/NO
        await this.handleYesNoSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_KONDISI_GELIGI_PREFIX)) {
        await this.handleKondisiGigigeligiSelection(chatId, userId, data);
      } else if (data.startsWith(CALLBACK_DATA.FIELD_REKOM_UTAMA_PREFIX)) {
        await this.handleRekomendasiUtamaSelection(chatId, userId, data);
      } else if (data === CALLBACK_DATA.ADD_TEETH_YES) {
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

      if (session.state === "waiting_doctor_name") {
        session.doctorName = msg.text;
        session.patientData.dokterPemeriksa = msg.text;
        session.state = "idle";
        await this.bot.sendMessage(
          chatId,
          `Hai dokter ${msg.text}, semangat kerjanya hari ini🤗!\nKetik /newpatient untuk memulai pendataan.`,
        );
        return;
      }
      if (session.state === "editing" && session.editingField) {
        await this.handleEditInput(chatId, userId, session, msg.text);
        return;
      }
      if (session.state === "collecting_patient") {
        await this.handlePatientFieldInput(chatId, userId, session, msg.text);
        return;
      }
      if (session.state === "collecting_teeth") {
        await this.handleTeethFieldInput(chatId, userId, session, msg.text);
        return;
      }
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
    if (nextField.type === "dropdown") {
      if (nextField.key === "jenisKelamin")
        await this.showJenisKelaminDropdown(chatId);
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
    if (currentField.key === "kondisiGigi")
      await this.showKondisiGigiDropdown(chatId);
    else if (currentField.key === "letakKaries")
      await this.showLetakKariesDropdown(chatId);
    else if (currentField.key === "tindakan")
      await this.showTindakanDropdown(chatId);
    else if (currentField.key === "rekomendasiPerawatan")
      await this.showRekomendasiDropdown(chatId);
    else
      await this.bot.sendMessage(
        chatId,
        `${MESSAGES.FIELD_PROMPT_PREFIX}${currentField.label}:`,
      );
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

  // ==================== EXAMINATION DATA COLLECTION ====================

  async promptNextExaminationField(chatId, userId, session) {
    const currentField = EXAMINATION_FIELDS[session.examinationFieldIndex];
    if (!currentField) {
      await this.showConfirmationSummary(chatId, userId);
      return;
    }

    // Handle Dropdowns & Yes/No
    if (currentField.type === "yes_no") {
      await this.showYesNoDropdown(
        chatId,
        currentField.label,
        currentField.key,
      );
    } else if (currentField.key === "oklusi") {
      await this.showOklusiDropdown(chatId);
    } else if (currentField.key === "torusPalatinus") {
      await this.showTorusPalatinusDropdown(chatId);
    } else if (currentField.key === "torusMandibularis") {
      await this.showTorusMandibularisDropdown(chatId);
    } else if (currentField.key === "palatum") {
      await this.showPalatumDropdown(chatId);
    } else if (currentField.key === "kondisiGigigeligi") {
      await this.showKondisiGigigeligiDropdown(chatId);
    } else if (currentField.key === "rekomendasiUtama") {
      await this.showRekomendasiUtamaDropdown(chatId);
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
    if (currentField.type !== "dropdown" && currentField.type !== "yes_no") {
      session.examinationData[currentField.key] = text;
      session.examinationFieldIndex++;
      await this.promptNextExaminationField(chatId, userId, session);
    }
  }

  // ==================== DROPDOWN HELPERS ====================

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

  // NEW DROPDOWNS
  async showYesNoDropdown(chatId, label, fieldKey) {
    // Format Callback: field_yn_KEY_VALUE (e.g., field_yn_faseGeligi_Ya)
    const keyboard = YES_NO_TYPES.map((yn) => [
      {
        text: yn.label,
        callback_data: `${CALLBACK_DATA.FIELD_YN_PREFIX}${fieldKey}_${yn.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, label, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }
  async showKondisiGigigeligiDropdown(chatId) {
    const keyboard = KONDISI_GIGIGELIGI_TYPES.map((k) => [
      {
        text: k.label,
        callback_data: `${CALLBACK_DATA.FIELD_KONDISI_GELIGI_PREFIX}${k.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, "Pilih Kondisi Gigigeligi:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  }
  async showRekomendasiUtamaDropdown(chatId) {
    const keyboard = REKOMENDASI_UTAMA_TYPES.map((r) => [
      {
        text: r.label,
        callback_data: `${CALLBACK_DATA.FIELD_REKOM_UTAMA_PREFIX}${r.key}`,
      },
    ]);
    await this.bot.sendMessage(chatId, "Pilih Rekomendasi Perawatan Utama:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  // ==================== SELECTION HANDLERS ====================

  async handleJenisKelaminSelection(chatId, userId, data) {
    this._handleGenericSelection(
      chatId,
      userId,
      data,
      CALLBACK_DATA.FIELD_JENIS_KELAMIN_PREFIX,
      JENIS_KELAMIN_TYPES,
      "patientData",
      "jenisKelamin",
      true,
    );
  }
  async handleKondisiGigiSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;
    const key = data.replace(CALLBACK_DATA.FIELD_KONDISI_PREFIX, "");
    const item = KONDISI_GIGI_TYPES.find((i) => i.key === key);
    if (!item) return;
    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.kondisiGigi = item.label;
    session.teethFieldIndex++;
    await this.promptNextTeethField(chatId, userId, session);
  }
  async handleFieldKariesSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;
    const key = data.replace(CALLBACK_DATA.FIELD_KARIES_PREFIX, "");
    const item = KARIES_TYPES.find((i) => i.key === key);
    if (!item) return;
    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.letakKaries = item.label;
    session.teethFieldIndex++;
    await this.promptNextTeethField(chatId, userId, session);
  }
  async handleTindakanSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;
    const key = data.replace(CALLBACK_DATA.FIELD_TINDAKAN_PREFIX, "");
    const item = TINDAKAN_TYPES.find((i) => i.key === key);
    if (!item) return;
    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.tindakan = item.label;
    session.teethFieldIndex++;
    await this.promptNextTeethField(chatId, userId, session);
  }
  async handleRekomendasiSelection(chatId, userId, data) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;
    const key = data.replace(CALLBACK_DATA.FIELD_REKOMENDASI_PREFIX, "");
    const item = REKOMENDASI_PERAWATAN.find((i) => i.key === key);
    if (!item) return;
    if (!session.currentTooth) session.currentTooth = {};
    session.currentTooth.rekomendasiPerawatan = item.label;
    session.teethFieldIndex++;
    await this.promptNextTeethField(chatId, userId, session);
  }

  // --- Examination Selections ---
  async handleOklusiSelection(chatId, userId, data) {
    this._handleGenericSelection(
      chatId,
      userId,
      data,
      CALLBACK_DATA.FIELD_OKLUSI_PREFIX,
      OKLUSI_TYPES,
      "examinationData",
      "oklusi",
    );
  }
  async handleTorusPalatinusSelection(chatId, userId, data) {
    this._handleGenericSelection(
      chatId,
      userId,
      data,
      CALLBACK_DATA.FIELD_TORUS_P_PREFIX,
      TORUS_PALATINUS_TYPES,
      "examinationData",
      "torusPalatinus",
    );
  }
  async handleTorusMandibularisSelection(chatId, userId, data) {
    this._handleGenericSelection(
      chatId,
      userId,
      data,
      CALLBACK_DATA.FIELD_TORUS_M_PREFIX,
      TORUS_MANDIBULARIS_TYPES,
      "examinationData",
      "torusMandibularis",
    );
  }
  async handlePalatumSelection(chatId, userId, data) {
    this._handleGenericSelection(
      chatId,
      userId,
      data,
      CALLBACK_DATA.FIELD_PALATUM_PREFIX,
      PALATUM_TYPES,
      "examinationData",
      "palatum",
    );
  }

  // NEW HANDLERS
  async handleYesNoSelection(chatId, userId, data) {
    // data format: field_yn_faseGeligi_Ya
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const raw = data.replace(CALLBACK_DATA.FIELD_YN_PREFIX, ""); // faseGeligi_Ya
    const lastUnderscore = raw.lastIndexOf("_");
    const fieldKey = raw.substring(0, lastUnderscore);
    const valueKey = raw.substring(lastUnderscore + 1);

    const yn = YES_NO_TYPES.find((y) => y.key === valueKey);
    if (!yn) return;

    session.examinationData[fieldKey] = yn.label;

    if (session.state === "editing" && session.editingField?.key === fieldKey) {
      session.editingField = null;
      session.state = "confirming";
      await this.showConfirmationSummary(chatId, userId);
    } else {
      session.examinationFieldIndex++;
      await this.promptNextExaminationField(chatId, userId, session);
    }
  }

  async handleKondisiGigigeligiSelection(chatId, userId, data) {
    this._handleGenericSelection(
      chatId,
      userId,
      data,
      CALLBACK_DATA.FIELD_KONDISI_GELIGI_PREFIX,
      KONDISI_GIGIGELIGI_TYPES,
      "examinationData",
      "kondisiGigigeligi",
    );
  }

  async handleRekomendasiUtamaSelection(chatId, userId, data) {
    this._handleGenericSelection(
      chatId,
      userId,
      data,
      CALLBACK_DATA.FIELD_REKOM_UTAMA_PREFIX,
      REKOMENDASI_UTAMA_TYPES,
      "examinationData",
      "rekomendasiUtama",
    );
  }

  // Generic helper for simple selections
  async _handleGenericSelection(
    chatId,
    userId,
    data,
    prefix,
    typeArray,
    dataCategory,
    fieldName,
    isPatientData = false,
  ) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;

    const key = data.replace(prefix, "");
    const item = typeArray.find((t) => t.key === key);
    if (!item) return;

    session[dataCategory][fieldName] = item.label;

    if (
      session.state === "editing" &&
      session.editingField?.key === fieldName
    ) {
      session.editingField = null;
      session.state = "confirming";
      await this.showConfirmationSummary(chatId, userId);
    } else {
      if (isPatientData) session.patientFieldIndex++;
      else session.examinationFieldIndex++;

      if (isPatientData)
        await this.promptNextPatientField(chatId, userId, session);
      else await this.promptNextExaminationField(chatId, userId, session);
    }
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
    if (session.currentTooth && Object.keys(session.currentTooth).length > 0)
      session.teethData.push({ ...session.currentTooth });
    session.currentTooth = {};
    session.teethFieldIndex = 0;
    await this.promptNextTeethField(chatId, userId, session);
  }
  async handleAddMoreTeethNo(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;
    if (session.currentTooth && Object.keys(session.currentTooth).length > 0)
      session.teethData.push({ ...session.currentTooth });
    session.state = "collecting_examination";
    session.examinationFieldIndex = 0;
    await this.promptNextExaminationField(chatId, userId, session);
  }

  // ==================== CONFIRMATION & EDIT ====================

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
        if (key === "jenisKelamin") await this.showJenisKelaminDropdown(chatId);
        else
          await this.bot.sendMessage(
            chatId,
            `${MESSAGES.EDIT_FIELD_PROMPT_PREFIX}${field.label}${MESSAGES.EDIT_FIELD_PROMPT_SUFFIX}:`,
          );
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
        { reply_markup: { inline_keyboard: keyboard } },
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
          if (fieldKeyName === "kondisiGigi")
            await this.showKondisiGigiDropdown(chatId);
          else if (fieldKeyName === "letakKaries")
            await this.showLetakKariesDropdown(chatId);
          else if (fieldKeyName === "tindakan")
            await this.showTindakanDropdown(chatId);
          else if (fieldKeyName === "rekomendasiPerawatan")
            await this.showRekomendasiDropdown(chatId);
        } else
          await this.bot.sendMessage(
            chatId,
            `${MESSAGES.EDIT_FIELD_PROMPT_PREFIX}${field.label}${MESSAGES.EDIT_FIELD_PROMPT_SUFFIX}:`,
          );
      }
    } else if (fieldKey.startsWith("exam_")) {
      const key = fieldKey.replace("exam_", "");
      const field = EXAMINATION_FIELDS.find((f) => f.key === key);
      if (field) {
        session.editingField = { type: "examination", key };
        if (field.type === "dropdown") {
          if (key === "oklusi") await this.showOklusiDropdown(chatId);
          else if (key === "torusPalatinus")
            await this.showTorusPalatinusDropdown(chatId);
          else if (key === "torusMandibularis")
            await this.showTorusMandibularisDropdown(chatId);
          else if (key === "palatum") await this.showPalatumDropdown(chatId);
          else if (key === "kondisiGigigeligi")
            await this.showKondisiGigigeligiDropdown(chatId);
          else if (key === "rekomendasiUtama")
            await this.showRekomendasiUtamaDropdown(chatId);
        } else if (field.type === "yes_no") {
          await this.showYesNoDropdown(chatId, field.label, field.key);
        } else
          await this.bot.sendMessage(
            chatId,
            `${MESSAGES.EDIT_FIELD_PROMPT_PREFIX}${field.label}${MESSAGES.EDIT_FIELD_PROMPT_SUFFIX}:`,
          );
      }
    }
  }

  async handleEditInput(chatId, userId, session, text) {
    if (!session.editingField) return;
    if (session.editingField.type === "patient")
      session.patientData[session.editingField.key] = text;
    else if (session.editingField.type === "toothfield") {
      const { toothIndex, key } = session.editingField;
      if (session.teethData[toothIndex])
        session.teethData[toothIndex][key] = text;
    } else if (session.editingField.type === "examination")
      session.examinationData[session.editingField.key] = text;

    session.editingField = null;
    session.state = "confirming";
    await this.showConfirmationSummary(chatId, userId);
  }

  async handleResumeContinue(chatId, userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session) return;
    if (session.state === "collecting_patient")
      await this.promptNextPatientField(chatId, userId, session);
    else if (session.state === "collecting_teeth")
      await this.promptNextTeethField(chatId, userId, session);
    else if (session.state === "collecting_examination")
      await this.promptNextExaminationField(chatId, userId, session);
    else await this.showConfirmationSummary(chatId, userId);
  }
  async handleResumeStartNew(chatId, userId) {
    const existingSession = this.sessionManager.getSession(userId);
    const doctorName = existingSession ? existingSession.doctorName : null;
    this.sessionManager.deleteSession(userId);
    this.sessionManager.createSession(userId, doctorName);
    await this.bot.sendMessage(chatId, MESSAGES.FIRST_FIELD_PROMPT);
  }
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
  async sendErrorMessage(chatId, message) {
    try {
      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Failed to send error message:", error);
    }
  }
}
module.exports = TelegramPatientBot;
