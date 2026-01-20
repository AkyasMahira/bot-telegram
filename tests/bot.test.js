/**
 * Unit tests for Bot module
 * Tests bot initialization and /start command handler
 */

const TelegramPatientBot = require('../src/bot');
const SessionManager = require('../src/sessionManager');
const { MESSAGES, CALLBACK_DATA } = require('../src/constants');

// Mock node-telegram-bot-api
jest.mock('node-telegram-bot-api');
const TelegramBot = require('node-telegram-bot-api');

describe('TelegramPatientBot', () => {
  let bot;
  let sessionManager;
  let sheetsService;
  let mockBotInstance;
  let startCommandHandler;
  let callbackQueryHandler;

  beforeEach(() => {
    // Create mock bot instance with promise-returning methods
    mockBotInstance = {
      onText: jest.fn(),
      on: jest.fn(),
      sendMessage: jest.fn().mockResolvedValue({}),
      answerCallbackQuery: jest.fn().mockResolvedValue(true)
    };

    // Mock TelegramBot constructor
    TelegramBot.mockImplementation(() => mockBotInstance);

    // Create instances
    sessionManager = new SessionManager();
    sheetsService = {}; // Mock sheets service
    bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

    // Capture handlers
    mockBotInstance.onText.mockImplementation((regex, handler) => {
      if (regex.toString().includes('start')) {
        startCommandHandler = handler;
      }
    });

    mockBotInstance.on.mockImplementation((event, handler) => {
      if (event === 'callback_query') {
        callbackQueryHandler = handler;
      }
    });

    // Register handlers
    bot.start();
  });

  describe('Bot Initialization', () => {
    test('should initialize bot with correct token', () => {
      expect(TelegramBot).toHaveBeenCalledWith('test-token', { polling: true });
    });

    test('should register /start command handler', () => {
      expect(mockBotInstance.onText).toHaveBeenCalledWith(
        expect.any(RegExp),
        expect.any(Function)
      );
    });

    test('should register callback query handler', () => {
      expect(mockBotInstance.on).toHaveBeenCalledWith(
        'callback_query',
        expect.any(Function)
      );
    });
  });

  describe('/start command without active session', () => {
    test('should send welcome message when no active session', () => {
      const msg = {
        chat: { id: 123 },
        from: { id: 456 }
      };

      startCommandHandler(msg);

      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        123,
        MESSAGES.WELCOME
      );
    });
  });

  describe('/start command with active session', () => {
    test('should ask to continue or start fresh when active session exists', () => {
      const userId = 456;
      const chatId = 123;
      
      // Create active session
      sessionManager.createSession(userId);

      const msg = {
        chat: { id: chatId },
        from: { id: userId }
      };

      startCommandHandler(msg);

      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        MESSAGES.CONTINUE_SESSION,
        expect.objectContaining({
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Lanjutkan', callback_data: CALLBACK_DATA.RESUME_CONTINUE },
                { text: 'Mulai Baru', callback_data: CALLBACK_DATA.RESUME_START_NEW }
              ]
            ]
          }
        })
      );
    });
  });

  describe('Resume Continue callback', () => {
    test('should resume from current field when user chooses to continue', async () => {
      const userId = 456;
      const chatId = 123;
      
      // Create session with some progress
      sessionManager.createSession(userId);
      sessionManager.updateField(userId, 'namaPasien', 'John Doe');
      const session = sessionManager.getSession(userId);
      session.currentFieldIndex = 1; // Move to second field

      const query = {
        message: { chat: { id: chatId } },
        from: { id: userId },
        data: CALLBACK_DATA.RESUME_CONTINUE,
        id: 'query123'
      };

      await callbackQueryHandler(query);

      // Should send prompt for second field (NIK / No. RM)
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('nik / no. rm')
      );
      expect(mockBotInstance.answerCallbackQuery).toHaveBeenCalledWith('query123');
    });
  });

  describe('Resume Start New callback', () => {
    test('should delete old session and create new one when user chooses start new', async () => {
      const userId = 456;
      const chatId = 123;
      
      // Create session with some progress
      sessionManager.createSession(userId);
      sessionManager.updateField(userId, 'namaPasien', 'John Doe');

      const query = {
        message: { chat: { id: chatId } },
        from: { id: userId },
        data: CALLBACK_DATA.RESUME_START_NEW,
        id: 'query123'
      };

      await callbackQueryHandler(query);

      // Should send first field prompt
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        MESSAGES.FIRST_FIELD_PROMPT
      );
      
      // Session should be reset
      const session = sessionManager.getSession(userId);
      expect(session.currentFieldIndex).toBe(0);
      expect(session.data).toEqual({});
      
      expect(mockBotInstance.answerCallbackQuery).toHaveBeenCalledWith('query123');
    });
  });

  describe('/newpatient command', () => {
    let newPatientCommandHandler;

    beforeEach(() => {
      // Capture the /newpatient handler
      mockBotInstance.onText.mockImplementation((regex, handler) => {
        if (regex.toString().includes('newpatient')) {
          newPatientCommandHandler = handler;
        }
      });
      bot.registerCommands();
    });

    test('should create new session and send first field prompt when no active session', () => {
      const userId = 456;
      const chatId = 123;

      const msg = {
        chat: { id: chatId },
        from: { id: userId }
      };

      newPatientCommandHandler(msg);

      // Should create session
      expect(sessionManager.hasActiveSession(userId)).toBe(true);

      // Should send first field prompt
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        MESSAGES.FIRST_FIELD_PROMPT
      );
    });

    test('should send error message when user already has active session', () => {
      const userId = 456;
      const chatId = 123;

      // Create active session
      sessionManager.createSession(userId);

      const msg = {
        chat: { id: chatId },
        from: { id: userId }
      };

      newPatientCommandHandler(msg);

      // Should send error message
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        MESSAGES.ERROR_ALREADY_HAS_SESSION
      );
    });
  });

  describe('/exit command', () => {
    let exitCommandHandler;

    beforeEach(() => {
      // Capture the /exit handler
      mockBotInstance.onText.mockImplementation((regex, handler) => {
        if (regex.toString().includes('exit')) {
          exitCommandHandler = handler;
        }
      });
      bot.registerCommands();
    });

    test('should delete session and send cancellation message when active session exists', () => {
      const userId = 456;
      const chatId = 123;

      // Create active session
      sessionManager.createSession(userId);

      const msg = {
        chat: { id: chatId },
        from: { id: userId }
      };

      exitCommandHandler(msg);

      // Should delete session
      expect(sessionManager.hasActiveSession(userId)).toBe(false);

      // Should send cancellation message
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        MESSAGES.CANCELLED
      );
    });

    test('should send error message when no active session exists', () => {
      const userId = 456;
      const chatId = 123;

      const msg = {
        chat: { id: chatId },
        from: { id: userId }
      };

      exitCommandHandler(msg);

      // Should send error message
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        MESSAGES.ERROR_NO_ACTIVE_SESSION
      );
    });
  });

  describe('Confirmation Summary', () => {
    test('should display formatted summary with inline keyboard when all fields collected', () => {
      const userId = 456;
      const chatId = 123;
      const { FIELDS } = require('../src/constants');

      // Create session and fill all fields
      sessionManager.createSession(userId);
      FIELDS.forEach((field, index) => {
        sessionManager.updateField(userId, field.key, `Value ${index + 1}`);
      });

      // Call showConfirmationSummary
      bot.showConfirmationSummary(chatId, userId);

      // Should send message with summary
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('Ringkasan Data Pasien'),
        expect.objectContaining({
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Yes', callback_data: CALLBACK_DATA.CONFIRM_YES },
                { text: 'No', callback_data: CALLBACK_DATA.CONFIRM_NO },
                { text: 'Change', callback_data: CALLBACK_DATA.CONFIRM_CHANGE }
              ]
            ]
          },
          parse_mode: 'Markdown'
        })
      );
    });

    test('should format summary with all field labels and values', () => {
      const { FIELDS } = require('../src/constants');
      const testData = {};
      
      FIELDS.forEach((field, index) => {
        testData[field.key] = `Test Value ${index + 1}`;
      });

      const summary = bot.formatSummary(testData);

      // Should contain header
      expect(summary).toContain('Ringkasan Data Pasien');

      // Should contain all field labels and values
      FIELDS.forEach(field => {
        expect(summary).toContain(field.label);
        expect(summary).toContain(testData[field.key]);
      });

      // Should contain question
      expect(summary).toContain('Apakah data sudah benar?');
    });

    test('should show dash for missing field values', () => {
      const { FIELDS } = require('../src/constants');
      const testData = {
        [FIELDS[0].key]: 'John Doe'
        // Other fields are missing
      };

      const summary = bot.formatSummary(testData);

      // Should contain the provided value
      expect(summary).toContain('John Doe');

      // Should contain dashes for missing values
      expect(summary).toMatch(/-/);
    });
  });
});
