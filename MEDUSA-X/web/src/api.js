const API_BASE = "http://127.0.0.1:8000/api";

// ==========================================
// COMMON API REQUEST FUNCTION
// ==========================================

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, options);
  } catch (error) {
    throw new Error(
      "Cannot connect to MEDUSA-X backend. Check whether Django is running."
    );
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || `Request failed: ${response.status}`
    );
  }

  return data;
}

// ==========================================
// MEDUSA-X API
// ==========================================

export const api = {

  // ========================================
  // PATIENT MANAGEMENT
  // ========================================

  getPatients: () =>
    request("/patients/"),

  createPatient: (patient) =>
    request("/patients/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patient),
    }),

  deletePatient: (id) =>
    request(`/patients/${id}/`, {
      method: "DELETE",
    }),

  // ========================================
  // CLINICAL DOCUMENT MANAGEMENT
  // ========================================

  getDocuments: () =>
    request("/documents/"),

  uploadDocument: (formData) =>
    request("/documents/", {
      method: "POST",
      body: formData,
    }),

  deleteDocument: (id) =>
    request(`/documents/${id}/`, {
      method: "DELETE",
    }),

  // ========================================
  // EMERGENCY ALERTS
  // ========================================

  getAlerts: () =>
    request("/alerts/"),

  // ========================================
  // DIAGNOSIS AND MEDICATION RECONCILIATION
  // ========================================

  getReconciliation: () =>
    request("/reconciliation/"),

  getMedicationMentions: (patientId = "") =>
    request(
      `/reconciliation/medications/${
        patientId
          ? `?patient_id=${encodeURIComponent(patientId)}`
          : ""
      }`
    ),

  runReconciliation: (patientId = null) =>
    request("/reconciliation/scan/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        patientId
          ? { patient_id: patientId }
          : {}
      ),
    }),

  // ========================================
  // AUDIT HISTORY
  // ========================================

  getAudit: () =>
    request("/audit/"),

  // ========================================
  // CLINICAL AI - PATIENT TIMELINE
  // ========================================

  getTimeline: (id) =>
    request(`/clinical-ai/patients/${id}/timeline/`),

  // Compatibility with App.jsx
  getPatientTimeline: (id) =>
    request(`/clinical-ai/patients/${id}/timeline/`),

  // ========================================
  // CLINICAL AI - DRAFT SUMMARY
  // ========================================

  generateDraftSummary: (id) =>
    request(`/clinical-ai/patients/${id}/draft-summary/`, {
      method: "POST",
    }),

};