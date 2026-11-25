const API_BASE = "http://127.0.0.1:8000/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(error) || "API request failed");
  }

  return response.json();
}

export const api = {
  // Patients
  getPatients() {
    return request("/patients/");
  },

  createPatient(patient) {
    return request("/patients/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patient),
    });
  },

  updatePatient(id, patient) {
    return request(`/patients/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patient),
    });
  },

  deletePatient(id) {
    return request(`/patients/${id}/`, {
      method: "DELETE",
    });
  },

  // Clinical documents
  getDocuments() {
    return request("/documents/");
  },

  uploadDocument(formData) {
    return request("/documents/", {
      method: "POST",
      body: formData,
    });
  },

  // Alerts
  getAlerts() {
    return request("/alerts/");
  },

  // Reconciliation
  getReconciliation() {
    return request("/reconciliation/");
  },

  // Clinical intelligence
  getTimeline(patientId) {
    return request(`/clinical-ai/patients/${patientId}/timeline/`);
  },

  generateDraftSummary(patientId) {
    return request(`/clinical-ai/patients/${patientId}/draft-summary/`, {
      method: "POST",
    });
  },
};