const API_BASE = "http://127.0.0.1:8000/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || `Request failed: ${response.status}`
    );
  }

  return data;
}

export const api = {
  getPatients: () => request("/patients/"),

  createPatient: (patient) =>
    request("/patients/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    }),

  deletePatient: (id) =>
    request(`/patients/${id}/`, {
      method: "DELETE",
    }),

  getDocuments: () => request("/documents/"),

  uploadDocument: (formData) =>
    request("/documents/", {
      method: "POST",
      body: formData,
    }),

  deleteDocument: (id) =>
    request(`/documents/${id}/`, {
      method: "DELETE",
    }),

  getAlerts: () => request("/alerts/"),

  getReconciliation: () => request("/reconciliation/"),

  getAudit: () => request("/audit/"),

  getTimeline: (id) =>
    request(`/clinical-ai/patients/${id}/timeline/`),

  generateDraftSummary: (id) =>
    request(`/clinical-ai/patients/${id}/draft-summary/`, {
      method: "POST",
    }),
};