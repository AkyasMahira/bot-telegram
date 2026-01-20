/**
 * Unit tests for SessionManager
 * Requirements: 2.1, 2.3, 4.2
 */

const SessionManager = require('../src/sessionManager');
const { FIELDS } = require('../src/constants');

describe('SessionManager Unit Tests', () => {
  let manager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe('createSession', () => {
    test('should initialize session with correct structure', () => {
      const userId = 12345;
      const session = manager.createSession(userId);

      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.currentFieldIndex).toBe(0);
      expect(session.data).toEqual({});
      expect(session.state).toBe('collecting');
    });

    test('should make session retrievable via getSession', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      const retrieved = manager.getSession(userId);
      expect(retrieved).toBeDefined();
      expect(retrieved.userId).toBe(userId);
    });

    test('should make hasActiveSession return true', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      expect(manager.hasActiveSession(userId)).toBe(true);
    });
  });

  describe('updateField', () => {
    test('should store values correctly', () => {
      const userId = 12345;
      manager.createSession(userId);

      const result = manager.updateField(userId, 'namaPasien', 'John Doe');
      
      expect(result).toBe(true);
      
      const session = manager.getSession(userId);
      expect(session.data.namaPasien).toBe('John Doe');
    });

    test('should store multiple field values', () => {
      const userId = 12345;
      manager.createSession(userId);

      manager.updateField(userId, 'namaPasien', 'John Doe');
      manager.updateField(userId, 'nik', '1234567890');
      manager.updateField(userId, 'usia', '30');
      
      const data = manager.getAllData(userId);
      expect(data.namaPasien).toBe('John Doe');
      expect(data.nik).toBe('1234567890');
      expect(data.usia).toBe('30');
    });

    test('should return false for non-existent session', () => {
      const result = manager.updateField(99999, 'namaPasien', 'Test');
      expect(result).toBe(false);
    });

    test('should allow updating same field multiple times', () => {
      const userId = 12345;
      manager.createSession(userId);

      manager.updateField(userId, 'namaPasien', 'First Name');
      manager.updateField(userId, 'namaPasien', 'Updated Name');
      
      const data = manager.getAllData(userId);
      expect(data.namaPasien).toBe('Updated Name');
    });
  });

  describe('deleteSession', () => {
    test('should remove session completely', () => {
      const userId = 12345;
      manager.createSession(userId);
      manager.updateField(userId, 'namaPasien', 'John Doe');

      const deleteResult = manager.deleteSession(userId);
      
      expect(deleteResult).toBe(true);
      expect(manager.hasActiveSession(userId)).toBe(false);
      expect(manager.getSession(userId)).toBeNull();
    });

    test('should return false when deleting non-existent session', () => {
      const result = manager.deleteSession(99999);
      expect(result).toBe(false);
    });

    test('should not affect other sessions', () => {
      const userId1 = 111;
      const userId2 = 222;
      
      manager.createSession(userId1);
      manager.createSession(userId2);
      manager.updateField(userId1, 'namaPasien', 'User 1');
      manager.updateField(userId2, 'namaPasien', 'User 2');

      manager.deleteSession(userId1);
      
      expect(manager.hasActiveSession(userId1)).toBe(false);
      expect(manager.hasActiveSession(userId2)).toBe(true);
      expect(manager.getAllData(userId2).namaPasien).toBe('User 2');
    });
  });

  describe('getSession', () => {
    test('should return null for non-existent session', () => {
      const session = manager.getSession(99999);
      expect(session).toBeNull();
    });

    test('should return session object for existing session', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      const session = manager.getSession(userId);
      expect(session).not.toBeNull();
      expect(session.userId).toBe(userId);
    });
  });

  describe('hasActiveSession', () => {
    test('should return false for non-existent session', () => {
      expect(manager.hasActiveSession(99999)).toBe(false);
    });

    test('should return true for existing session', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      expect(manager.hasActiveSession(userId)).toBe(true);
    });

    test('should return false after session deletion', () => {
      const userId = 12345;
      manager.createSession(userId);
      manager.deleteSession(userId);
      
      expect(manager.hasActiveSession(userId)).toBe(false);
    });
  });

  describe('getCurrentField', () => {
    test('should return first field for new session', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      const field = manager.getCurrentField(userId);
      expect(field).toEqual(FIELDS[0]);
    });

    test('should return correct field based on currentFieldIndex', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      const session = manager.getSession(userId);
      session.currentFieldIndex = 5;
      
      const field = manager.getCurrentField(userId);
      expect(field).toEqual(FIELDS[5]);
    });

    test('should return null when all fields collected', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      const session = manager.getSession(userId);
      session.currentFieldIndex = FIELDS.length;
      
      const field = manager.getCurrentField(userId);
      expect(field).toBeNull();
    });

    test('should return null for non-existent session', () => {
      const field = manager.getCurrentField(99999);
      expect(field).toBeNull();
    });
  });

  describe('getAllData', () => {
    test('should return empty object for new session', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      const data = manager.getAllData(userId);
      expect(data).toEqual({});
    });

    test('should return all stored data', () => {
      const userId = 12345;
      manager.createSession(userId);
      
      manager.updateField(userId, 'namaPasien', 'John Doe');
      manager.updateField(userId, 'nik', '1234567890');
      manager.updateField(userId, 'usia', '30');
      
      const data = manager.getAllData(userId);
      expect(data).toEqual({
        namaPasien: 'John Doe',
        nik: '1234567890',
        usia: '30'
      });
    });

    test('should return null for non-existent session', () => {
      const data = manager.getAllData(99999);
      expect(data).toBeNull();
    });
  });
});
