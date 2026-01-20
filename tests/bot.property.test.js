const fc = require('fast-check');
const TelegramPatientBot = require('../src/bot');
const SessionManager = require('../src/sessionManager');
const { FIELDS, CALLBACK_DATA } = require('../src/constants');

jest.mock('node-telegram-bot-api');
const TelegramBot = require('node-telegram-bot-api');

// Helper function to create mock bot instance with promise-returning methods
function createMockBotInstance() {
  return {
    onText: jest.fn(),
    on: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue({}),
    answerCallbackQuery: jest.fn().mockResolvedValue(true)
  };
}

describe('Bot Property-Based Tests', () => {
  describe('Property 2: Field Collection Completeness', () => {

    test('should have all 18 fields populated when reaching confirmation stage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          fc.integer({ min: 1, max: 1000000 }),
          fc.array(fc.string({ minLength: 1 }).filter(s => !s.startsWith('/')), { 
            minLength: FIELDS.length, 
            maxLength: FIELDS.length 
          }),
          (userId, chatId, fieldValues) => {
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            const sheetsService = {};
            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            let messageHandler;
            mockBotInstance.on.mockImplementation((event, handler) => {
              if (event === 'message') {
                messageHandler = handler;
              }
            });

            bot.start();

            sessionManager.createSession(userId);

            for (let i = 0; i < FIELDS.length; i++) {
              const msg = {
                chat: { id: chatId },
                from: { id: userId },
                text: fieldValues[i]
              };

              messageHandler(msg);
            }

            const session = sessionManager.getSession(userId);
            expect(session).not.toBeNull();
            
            for (let i = 0; i < FIELDS.length; i++) {
              const field = FIELDS[i];
              expect(session.data[field.key]).toBe(fieldValues[i]);
            }

            expect(Object.keys(session.data).length).toBe(18);

            expect(session.currentFieldIndex).toBe(FIELDS.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Input Acceptance', () => {
    test('should accept and store any text input without modification', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          fc.integer({ min: 1, max: 1000000 }),
          fc.integer({ min: 0, max: FIELDS.length - 1 }),
          fc.oneof(
            fc.string(), // Regular strings
            fc.unicodeString(), // Unicode characters
            fc.string({ minLength: 1000, maxLength: 5000 }), // Very long strings
            fc.constantFrom('', '   ', '\n\n\n', '\t\t'), // Whitespace strings
            fc.constantFrom('!@#$%^&*()', '<script>alert("xss")</script>', '\'"; DROP TABLE--') // Special characters
          ).filter(str => !str.startsWith('/')),
          (userId, chatId, fieldIndex, inputText) => {
            // Setup
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            const sheetsService = {};
            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            let messageHandler;
            mockBotInstance.on.mockImplementation((event, handler) => {
              if (event === 'message') {
                messageHandler = handler;
              }
            });

            bot.start();

            // Create session at specific field
            sessionManager.createSession(userId);
            const session = sessionManager.getSession(userId);
            session.currentFieldIndex = fieldIndex;

            // Act: User sends input
            const msg = {
              chat: { id: chatId },
              from: { id: userId },
              text: inputText
            };

            messageHandler(msg);

            // Assert: Input should be stored exactly as provided
            const currentField = FIELDS[fieldIndex];
            const storedValue = session.data[currentField.key];
            
            expect(storedValue).toBe(inputText);
            
            // Verify field index was incremented
            expect(session.currentFieldIndex).toBe(fieldIndex + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Session Resume Continuity', () => {
    test('should resume from exact field where user left off', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random chat ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random field index (0 to FIELDS.length - 1)
          fc.integer({ min: 0, max: FIELDS.length - 1 }),
          // Generate random partial data for fields before current index
          fc.array(fc.string(), { minLength: 0, maxLength: FIELDS.length }),
          async (userId, chatId, fieldIndex, fieldValues) => {
            // Setup
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            const sheetsService = {};
            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            let callbackQueryHandler;
            mockBotInstance.on.mockImplementation((event, handler) => {
              if (event === 'callback_query') {
                callbackQueryHandler = handler;
              }
            });

            bot.start();

            // Create session with progress at specific field index
            sessionManager.createSession(userId);
            const session = sessionManager.getSession(userId);
            session.currentFieldIndex = fieldIndex;

            // Fill in data for fields before current index
            for (let i = 0; i < fieldIndex && i < fieldValues.length; i++) {
              session.data[FIELDS[i].key] = fieldValues[i];
            }

            // Clear mock calls from setup
            mockBotInstance.sendMessage.mockClear();

            // Act: User chooses to continue session
            const query = {
              message: { chat: { id: chatId } },
              from: { id: userId },
              data: CALLBACK_DATA.RESUME_CONTINUE,
              id: 'query123'
            };

            await callbackQueryHandler(query);

            // Assert: Bot should prompt for the exact field at fieldIndex
            if (fieldIndex < FIELDS.length) {
              const expectedField = FIELDS[fieldIndex];
              const sentMessage = mockBotInstance.sendMessage.mock.calls[0][1];
              
              // The message should contain the field label (case-insensitive)
              expect(sentMessage.toLowerCase()).toContain(expectedField.label.toLowerCase());
              
              // Verify the message was sent to correct chat
              expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
                chatId,
                expect.any(String)
              );
            } else {
              // If all fields are collected, should show confirmation
              // (This will be implemented in later tasks, so we just check a message was sent)
              expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
                chatId,
                expect.any(String)
              );
            }

            // Verify callback query was answered
            expect(mockBotInstance.answerCallbackQuery).toHaveBeenCalledWith('query123');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Confirmation Options Display', () => {
    /**
     * **Feature: telegram-patient-bot, Property 11: Confirmation Options Display**
     * **Validates: Requirements 5.2**
     * 
     * For any completed data collection session, when displaying summary,
     * the bot should present inline keyboard with exactly three options: "Yes", "No", and "Change".
     */
    test('should display inline keyboard with exactly Yes, No, and Change options', () => {
      fc.assert(
        fc.property(
          // Generate random user ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random chat ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random values for all 18 fields
          fc.array(fc.string({ minLength: 1 }), { 
            minLength: FIELDS.length, 
            maxLength: FIELDS.length 
          }),
          (userId, chatId, fieldValues) => {
            // Setup
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            const sheetsService = {};
            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            bot.start();

            // Create session and fill all fields
            sessionManager.createSession(userId);
            FIELDS.forEach((field, index) => {
              sessionManager.updateField(userId, field.key, fieldValues[index]);
            });

            // Clear mock calls from setup
            mockBotInstance.sendMessage.mockClear();

            // Act: Show confirmation summary
            bot.showConfirmationSummary(chatId, userId);

            // Assert: Should send message with inline keyboard
            expect(mockBotInstance.sendMessage).toHaveBeenCalledTimes(1);
            
            const callArgs = mockBotInstance.sendMessage.mock.calls[0];
            expect(callArgs[0]).toBe(chatId);
            expect(callArgs[1]).toContain('Ringkasan Data Pasien');
            
            // Verify inline keyboard structure
            const options = callArgs[2];
            expect(options).toHaveProperty('reply_markup');
            expect(options.reply_markup).toHaveProperty('inline_keyboard');
            
            const keyboard = options.reply_markup.inline_keyboard;
            
            // Should have exactly one row
            expect(keyboard).toHaveLength(1);
            
            // Should have exactly three buttons in the row
            const buttons = keyboard[0];
            expect(buttons).toHaveLength(3);
            
            // Verify button texts are exactly "Yes", "No", "Change"
            expect(buttons[0].text).toBe('Yes');
            expect(buttons[1].text).toBe('No');
            expect(buttons[2].text).toBe('Change');
            
            // Verify callback data
            expect(buttons[0].callback_data).toBe(CALLBACK_DATA.CONFIRM_YES);
            expect(buttons[1].callback_data).toBe(CALLBACK_DATA.CONFIRM_NO);
            expect(buttons[2].callback_data).toBe(CALLBACK_DATA.CONFIRM_CHANGE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Edit Preservation', () => {
    /**
     * **Feature: telegram-patient-bot, Property 7: Edit Preservation**
     * **Validates: Requirements 6.3, 6.4**
     * 
     * For any field that is edited during the change process, the new value should
     * replace the old value in the session and appear in the final confirmation summary.
     */
    test('should replace old value with new value when field is edited', () => {
      fc.assert(
        fc.property(
          // Generate random user ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random chat ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random field index to edit
          fc.integer({ min: 0, max: FIELDS.length - 1 }),
          // Generate random initial values for all fields
          fc.array(fc.string({ minLength: 1 }), { 
            minLength: FIELDS.length, 
            maxLength: FIELDS.length 
          }),
          // Generate random new value for the edited field
          fc.string({ minLength: 1 }).filter(s => !s.startsWith('/')),
          (userId, chatId, fieldIndexToEdit, initialValues, newValue) => {
            // Setup
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            const sheetsService = {};
            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            let messageHandler;
            let callbackQueryHandler;
            mockBotInstance.on.mockImplementation((event, handler) => {
              if (event === 'message') {
                messageHandler = handler;
              } else if (event === 'callback_query') {
                callbackQueryHandler = handler;
              }
            });

            bot.start();

            // Create session and fill all fields with initial values
            sessionManager.createSession(userId);
            FIELDS.forEach((field, index) => {
              sessionManager.updateField(userId, field.key, initialValues[index]);
            });

            // Set session to confirming state (all fields collected)
            const session = sessionManager.getSession(userId);
            session.currentFieldIndex = FIELDS.length;
            session.state = 'confirming';

            // Store the original value for comparison
            const fieldToEdit = FIELDS[fieldIndexToEdit];
            const originalValue = initialValues[fieldIndexToEdit];

            // Act 1: User selects "Change" option
            const changeQuery = {
              message: { chat: { id: chatId } },
              from: { id: userId },
              data: CALLBACK_DATA.CONFIRM_CHANGE,
              id: 'query1'
            };
            callbackQueryHandler(changeQuery);

            // Verify session is now in editing state
            expect(session.state).toBe('editing');

            // Act 2: User selects field to edit
            const editFieldQuery = {
              message: { chat: { id: chatId } },
              from: { id: userId },
              data: `${CALLBACK_DATA.EDIT_FIELD_PREFIX}${fieldToEdit.key}`,
              id: 'query2'
            };
            callbackQueryHandler(editFieldQuery);

            // Verify editingField is set
            expect(session.editingField).toBe(fieldToEdit.key);

            // Clear mock calls
            mockBotInstance.sendMessage.mockClear();

            // Act 3: User provides new value
            const editMsg = {
              chat: { id: chatId },
              from: { id: userId },
              text: newValue
            };
            messageHandler(editMsg);

            // Assert: New value should be stored in session (even if same as original)
            const updatedData = sessionManager.getAllData(userId);
            expect(updatedData[fieldToEdit.key]).toBe(newValue);

            // Assert: All other fields should remain unchanged
            FIELDS.forEach((field, index) => {
              if (index !== fieldIndexToEdit) {
                expect(updatedData[field.key]).toBe(initialValues[index]);
              }
            });

            // Assert: Session should return to confirming state
            expect(session.state).toBe('confirming');
            expect(session.editingField).toBeNull();

            // Assert: Confirmation summary should be displayed with updated data
            expect(mockBotInstance.sendMessage).toHaveBeenCalledTimes(1);
            const summaryCall = mockBotInstance.sendMessage.mock.calls[0];
            expect(summaryCall[0]).toBe(chatId);
            
            // The summary should contain the new value
            const summaryText = summaryCall[1];
            expect(summaryText).toContain(newValue);
            
            // Verify inline keyboard with Yes/No/Change is present
            const options = summaryCall[2];
            expect(options).toHaveProperty('reply_markup');
            expect(options.reply_markup.inline_keyboard).toHaveLength(1);
            expect(options.reply_markup.inline_keyboard[0]).toHaveLength(3);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should allow multiple field edits before final confirmation', () => {
      fc.assert(
        fc.property(
          // Generate random user ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random chat ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate 2-3 random field indices to edit
          fc.array(fc.integer({ min: 0, max: FIELDS.length - 1 }), { minLength: 2, maxLength: 3 }),
          // Generate random initial values for all fields
          fc.array(fc.string({ minLength: 1 }), { 
            minLength: FIELDS.length, 
            maxLength: FIELDS.length 
          }),
          // Generate random new values for edited fields
          fc.array(fc.string({ minLength: 1 }).filter(s => !s.startsWith('/')), { minLength: 3, maxLength: 3 }),
          (userId, chatId, fieldIndicesToEdit, initialValues, newValues) => {
            // Setup
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            const sheetsService = {};
            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            let messageHandler;
            let callbackQueryHandler;
            mockBotInstance.on.mockImplementation((event, handler) => {
              if (event === 'message') {
                messageHandler = handler;
              } else if (event === 'callback_query') {
                callbackQueryHandler = handler;
              }
            });

            bot.start();

            // Create session and fill all fields with initial values
            sessionManager.createSession(userId);
            FIELDS.forEach((field, index) => {
              sessionManager.updateField(userId, field.key, initialValues[index]);
            });

            // Set session to confirming state
            const session = sessionManager.getSession(userId);
            session.currentFieldIndex = FIELDS.length;
            session.state = 'confirming';

            // Track expected values after all edits
            const expectedValues = [...initialValues];

            // Act: Perform multiple edits
            for (let i = 0; i < fieldIndicesToEdit.length; i++) {
              const fieldIndex = fieldIndicesToEdit[i];
              const fieldToEdit = FIELDS[fieldIndex];
              const newValue = newValues[i];

              // Update expected values
              expectedValues[fieldIndex] = newValue;

              // User selects "Change"
              const changeQuery = {
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: CALLBACK_DATA.CONFIRM_CHANGE,
                id: `query_change_${i}`
              };
              callbackQueryHandler(changeQuery);

              // User selects field to edit
              const editFieldQuery = {
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: `${CALLBACK_DATA.EDIT_FIELD_PREFIX}${fieldToEdit.key}`,
                id: `query_field_${i}`
              };
              callbackQueryHandler(editFieldQuery);

              // User provides new value
              const editMsg = {
                chat: { id: chatId },
                from: { id: userId },
                text: newValue
              };
              messageHandler(editMsg);
            }

            // Assert: All edited fields should have new values
            const finalData = sessionManager.getAllData(userId);
            FIELDS.forEach((field, index) => {
              expect(finalData[field.key]).toBe(expectedValues[index]);
            });

            // Assert: Session should be in confirming state
            expect(session.state).toBe('confirming');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Data Persistence on Failure', () => {
    /**
     * **Feature: telegram-patient-bot, Property 12: Data Persistence on Failure**
     * **Validates: Requirements 7.7**
     * 
     * For any Google Sheets write failure, the session data should remain intact
     * in storage allowing the user to retry submission.
     */
    test('should retain session data when Google Sheets write fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random chat ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random values for all 18 fields
          fc.array(fc.string({ minLength: 1 }), { 
            minLength: FIELDS.length, 
            maxLength: FIELDS.length 
          }),
          async (userId, chatId, fieldValues) => {
            // Setup
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            
            // Create mock SheetsService that fails
            const sheetsService = {
              appendPatientData: jest.fn().mockResolvedValue({
                success: false,
                error: 'Network error'
              })
            };

            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            bot.start();

            // Create session and fill all fields
            sessionManager.createSession(userId);
            const patientData = {};
            FIELDS.forEach((field, index) => {
              sessionManager.updateField(userId, field.key, fieldValues[index]);
              patientData[field.key] = fieldValues[index];
            });

            // Store original session data for comparison
            const originalData = sessionManager.getAllData(userId);
            expect(originalData).not.toBeNull();

            // Act: Attempt to confirm and save (which will fail)
            await bot.handleConfirmYes(chatId, userId);

            // Assert: Session should still exist
            const sessionAfterFailure = sessionManager.getSession(userId);
            expect(sessionAfterFailure).not.toBeNull();

            // Assert: All data should be intact
            const dataAfterFailure = sessionManager.getAllData(userId);
            expect(dataAfterFailure).not.toBeNull();
            
            // Verify all fields are still present with original values
            FIELDS.forEach((field, index) => {
              expect(dataAfterFailure[field.key]).toBe(fieldValues[index]);
            });

            // Verify error message was sent
            expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
              chatId,
              expect.stringContaining('Data gagal di simpan di google sheets')
            );

            // Verify session was NOT deleted
            expect(sessionManager.hasActiveSession(userId)).toBe(true);

            // Verify appendPatientData was called with correct data
            expect(sheetsService.appendPatientData).toHaveBeenCalledWith(
              expect.objectContaining(patientData)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should delete session when Google Sheets write succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random chat ID
          fc.integer({ min: 1, max: 1000000 }),
          // Generate random values for all 18 fields
          fc.array(fc.string({ minLength: 1 }), { 
            minLength: FIELDS.length, 
            maxLength: FIELDS.length 
          }),
          async (userId, chatId, fieldValues) => {
            // Setup
            const mockBotInstance = createMockBotInstance();

            TelegramBot.mockImplementation(() => mockBotInstance);

            const sessionManager = new SessionManager();
            
            // Create mock SheetsService that succeeds
            const sheetsService = {
              appendPatientData: jest.fn().mockResolvedValue({
                success: true,
                id: 123,
                range: 'A2:T2'
              })
            };

            const bot = new TelegramPatientBot('test-token', sessionManager, sheetsService);

            bot.start();

            // Create session and fill all fields
            sessionManager.createSession(userId);
            FIELDS.forEach((field, index) => {
              sessionManager.updateField(userId, field.key, fieldValues[index]);
            });

            // Verify session exists before confirmation
            expect(sessionManager.hasActiveSession(userId)).toBe(true);

            // Act: Confirm and save (which will succeed)
            await bot.handleConfirmYes(chatId, userId);

            // Assert: Session should be deleted
            expect(sessionManager.hasActiveSession(userId)).toBe(false);
            expect(sessionManager.getSession(userId)).toBeNull();

            // Verify success message was sent
            expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
              chatId,
              expect.stringContaining('berhasil disimpan')
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
