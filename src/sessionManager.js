/**
 * Session Manager for Telegram Patient Bot
 * Manages user sessions with in-memory storage
 */

const { PATIENT_FIELDS } = require('./constants');

/**
 * SessionManager class handles user session lifecycle
 * Uses in-memory Map to store sessions keyed by userId
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Creates a new session for a user
   * @param {number} userId - Telegram user ID
   * @param {string} doctorName - Doctor name (optional, from /start)
   * @returns {object} The created session object
   */
  createSession(userId, doctorName = null) {
    const session = {
      userId,
      state: 'collecting_patient', // collecting_patient, collecting_teeth, collecting_examination, confirming, editing
      doctorName: doctorName,
      
      // Patient data (collected once)
      patientFieldIndex: 0,
      patientData: {},
      
      // Teeth data (can be multiple)
      teethFieldIndex: 0,
      currentTooth: {},
      teethData: [],
      
      // Examination data (collected once after teeth)
      examinationFieldIndex: 0,
      examinationData: {},
      
      // Editing state
      editingField: null
    };
    
    // If doctor name is provided, pre-fill it and skip that field
    if (doctorName) {
      session.patientData.dokterPemeriksa = doctorName;
      // Find index of dokterPemeriksa and set patientFieldIndex to skip it if it's the current field
      const dokterIndex = PATIENT_FIELDS.findIndex(f => f.key === 'dokterPemeriksa');
      if (dokterIndex === 0) {
        session.patientFieldIndex = 1;
      }
    }
    
    this.sessions.set(userId, session);
    return session;
  }

  /**
   * Retrieves a session for a user
   * @param {number} userId - Telegram user ID
   * @returns {object|null} The session object or null if not found
   */
  getSession(userId) {
    return this.sessions.get(userId) || null;
  }

  /**
   * Deletes a user's session
   * @param {number} userId - Telegram user ID
   * @returns {boolean} True if session was deleted, false if not found
   */
  deleteSession(userId) {
    return this.sessions.delete(userId);
  }

  /**
   * Checks if a user has an active session
   * @param {number} userId - Telegram user ID
   * @returns {boolean} True if user has active session
   */
  hasActiveSession(userId) {
    return this.sessions.has(userId);
  }

  /**
   * Gets the current patient field being collected
   * @param {number} userId - Telegram user ID
   * @returns {object|null} Field object or null
   */
  getCurrentPatientField(userId) {
    const session = this.sessions.get(userId);
    if (!session) return null;
    
    if (session.patientFieldIndex >= PATIENT_FIELDS.length) {
      return null;
    }
    
    const field = PATIENT_FIELDS[session.patientFieldIndex];
    
    // Skip dokterPemeriksa if already set
    if (field.key === 'dokterPemeriksa' && session.doctorName) {
      session.patientFieldIndex++;
      return this.getCurrentPatientField(userId);
    }
    
    return field;
  }
}

module.exports = SessionManager;
