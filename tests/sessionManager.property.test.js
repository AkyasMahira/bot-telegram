/**
 * Property-based tests for SessionManager
 * Using fast-check for property-based testing
 */

const fc = require('fast-check');
const SessionManager = require('../src/sessionManager');
const { FIELDS } = require('../src/constants');

describe('SessionManager Property-Based Tests', () => {
  
  /**
   * Property 1: Session Isolation
   * Feature: telegram-patient-bot, Property 1: Session Isolation
   * Validates: Requirements 8.1, 8.4
   * 
   * For any two different users interacting with the bot simultaneously,
   * their session data should remain completely isolated and not interfere with each other.
   */
  test('Property 1: Session Isolation - sessions for different users remain isolated', () => {
    fc.assert(
      fc.property(
        // Generate array of unique user IDs
        fc.uniqueArray(fc.integer({ min: 1, max: 1000000 }), { minLength: 2, maxLength: 10 }),
        // Generate random field key and base value
        fc.constantFrom(...FIELDS.map(f => f.key)),
        fc.string({ minLength: 1, maxLength: 100 }),
        (userIds, fieldKey, baseValue) => {
          const manager = new SessionManager();
          
          // Create sessions for all users
          userIds.forEach(userId => {
            manager.createSession(userId);
          });
          
          // Update the same field for each user with user-specific value
          userIds.forEach(userId => {
            manager.updateField(userId, fieldKey, `user${userId}_${baseValue}`);
          });
          
          // Verify each user's data is isolated
          for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const userData = manager.getAllData(userId);
            const value = userData[fieldKey];
            
            // Value should exist and start with this user's ID
            if (!value || !value.startsWith(`user${userId}_`)) {
              return false;
            }
            
            // Value should not contain any other user's ID
            for (let j = 0; j < userIds.length; j++) {
              if (i !== j) {
                const otherUserId = userIds[j];
                if (value.includes(`user${otherUserId}_`)) {
                  return false;
                }
              }
            }
          }
          
          // Also verify that sessions are completely separate
          // Deleting one session should not affect others
          const firstUserId = userIds[0];
          manager.deleteSession(firstUserId);
          
          // First user should have no session
          if (manager.hasActiveSession(firstUserId)) {
            return false;
          }
          
          // All other users should still have their sessions
          for (let i = 1; i < userIds.length; i++) {
            if (!manager.hasActiveSession(userIds[i])) {
              return false;
            }
            const userData = manager.getAllData(userIds[i]);
            if (!userData || !userData[fieldKey]) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Field Progression
   * Feature: telegram-patient-bot, Property 10: Field Progression
   * Validates: Requirements 2.3, 3.4
   * 
   * For any field input provided by user, the bot should store the value
   * and immediately proceed to request the next field in sequence.
   */
  test('Property 10: Field Progression - storing value progresses to next field', () => {
    fc.assert(
      fc.property(
        // Generate a random user ID
        fc.integer({ min: 1, max: 1000000 }),
        // Generate random field values
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 18 }),
        (userId, fieldValues) => {
          const manager = new SessionManager();
          
          // Create session
          manager.createSession(userId);
          
          // Process each field value
          for (let i = 0; i < Math.min(fieldValues.length, FIELDS.length); i++) {
            const currentField = manager.getCurrentField(userId);
            
            // Current field should match the expected field at index i
            if (!currentField || currentField.key !== FIELDS[i].key) {
              return false;
            }
            
            // Store the value
            const updateSuccess = manager.updateField(userId, currentField.key, fieldValues[i]);
            if (!updateSuccess) {
              return false;
            }
            
            // Verify the value was stored
            const session = manager.getSession(userId);
            if (session.data[currentField.key] !== fieldValues[i]) {
              return false;
            }
            
            // Progress to next field by incrementing currentFieldIndex
            session.currentFieldIndex++;
            
            // Verify progression: next field should be different (unless we're at the end)
            if (i < FIELDS.length - 1) {
              const nextField = manager.getCurrentField(userId);
              if (!nextField || nextField.key !== FIELDS[i + 1].key) {
                return false;
              }
            } else {
              // At the end, getCurrentField should return null
              const nextField = manager.getCurrentField(userId);
              if (nextField !== null) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Session Cancellation Cleanup
   * Feature: telegram-patient-bot, Property 5: Session Cancellation Cleanup
   * Validates: Requirements 4.1, 4.2, 4.3
   * 
   * For any active session, when /exit command is issued, the session should be
   * completely removed from storage and no data should be retrievable afterwards.
   */
  test('Property 5: Session Cancellation Cleanup - session is completely removed after deletion', () => {
    fc.assert(
      fc.property(
        // Generate a random user ID
        fc.integer({ min: 1, max: 1000000 }),
        // Generate random field index (0 to 17) to simulate various stages
        fc.integer({ min: 0, max: 17 }),
        // Generate random data for fields
        fc.array(fc.record({
          field: fc.constantFrom(...FIELDS.map(f => f.key)),
          value: fc.string({ minLength: 1, maxLength: 100 })
        }), { minLength: 1, maxLength: 18 }),
        (userId, fieldIndex, dataUpdates) => {
          const manager = new SessionManager();
          
          // Create session
          manager.createSession(userId);
          
          // Set session to a specific stage
          const session = manager.getSession(userId);
          session.currentFieldIndex = fieldIndex;
          
          // Add some data to the session
          dataUpdates.forEach(update => {
            manager.updateField(userId, update.field, update.value);
          });
          
          // Verify session exists and has data before deletion
          if (!manager.hasActiveSession(userId)) {
            return false;
          }
          
          const dataBefore = manager.getAllData(userId);
          if (!dataBefore || Object.keys(dataBefore).length === 0) {
            return false;
          }
          
          // Delete the session (simulating /exit command)
          const deleteResult = manager.deleteSession(userId);
          if (!deleteResult) {
            return false;
          }
          
          // Verify complete removal
          // 1. hasActiveSession should return false
          if (manager.hasActiveSession(userId)) {
            return false;
          }
          
          // 2. getSession should return null
          if (manager.getSession(userId) !== null) {
            return false;
          }
          
          // 3. getAllData should return null
          if (manager.getAllData(userId) !== null) {
            return false;
          }
          
          // 4. getCurrentField should return null
          if (manager.getCurrentField(userId) !== null) {
            return false;
          }
          
          // 5. updateField should fail (return false)
          if (manager.updateField(userId, 'namaPasien', 'test')) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
