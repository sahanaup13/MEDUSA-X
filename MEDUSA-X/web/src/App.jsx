import { useState, useEffect } from "react";
import Landing from "./Landing";
import MedusaHospital3D from "./MedusaHospital3D";

import {
  LayoutDashboard,
  Users,
  FileText,
  Trash2,
  Clock,
  Stethoscope,
  Pill,
  BrainCircuit,
  AlertTriangle,
  ClipboardList,
  Database,
  Settings,
  Activity,
  Search,
  Bell,
  X,
  Eye,
  ArrowLeft,
  Upload,
  Plus,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { api } from "./api";
import "./App.css";

// ==========================================
// SIDEBAR MENU
// ==========================================

const menu = [
  { name: "3D Hospital", icon: Activity },
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Patients", icon: Users },
  { name: "Medical Records", icon: FileText },
  { name: "Patient Timeline", icon: Clock },
  { name: "Diagnosis Review", icon: Stethoscope },
  { name: "Medication Review", icon: Pill },
  { name: "AI Intelligence", icon: BrainCircuit },
  { name: "Emergency Alerts", icon: AlertTriangle },
  { name: "Clinical Summary", icon: ClipboardList },
  { name: "Audit History", icon: Database },
  { name: "Admin", icon: ShieldCheck },
  { name: "Settings", icon: Settings },
];

// ==========================================
// DATA NORMALIZATION
// ==========================================

function getList(value, keys = []) {
  if (Array.isArray(value)) return value;

  for (const key of keys) {
    if (Array.isArray(value?.[key])) {
      return value[key];
    }
  }

  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;

  return [];
}

// ==========================================
// CLINICAL REPORT COMPONENT
// ==========================================

function ClinicalReport({
  report,
  patientName,
  eyebrow = "MEDUSA-X CLINICAL REPORT",
}) {
  if (!report) return null;

  const summaryText =
    report.summary ||
    report.clinical_summary ||
    report.report ||
    report.description ||
    "";

  const findings = report.findings;

  const findingGroups = Array.isArray(findings)
    ? [{ category: "Clinical Findings", items: findings }]
    : findings && typeof findings === "object"
      ? Object.entries(findings).map(([category, items]) => ({
          category,
          items: Array.isArray(items) ? items : [items],
        }))
      : [];

  const evidence = Array.isArray(report.evidence)
    ? report.evidence
    : [];

  function getItemText(item) {
    if (typeof item === "string" || typeof item === "number") {
      return String(item);
    }

    if (!item || typeof item !== "object") {
      return "Information unavailable.";
    }

    return (
      item.value ||
      item.text ||
      item.name ||
      item.description ||
      item.diagnosis ||
      item.medication ||
      item.message ||
      "Information extracted from clinical record."
    );
  }

  return (
    <div className="clinical-summary-view">

      {/* REPORT HEADER */}

      <div className="summary-header">

        <div>
          <span className="timeline-eyebrow">
            {eyebrow}
          </span>

          <h3>
            {patientName || report.patient || "Patient Clinical Summary"}
          </h3>

          <p>
            Documents reviewed:{" "}
            {report.documents_reviewed ?? "Not available"}
          </p>

          {report.summary_id && (
            <p>
              Summary ID: {report.summary_id}
            </p>
          )}
        </div>

        <span className="summary-badge">
          DRAFT — REVIEW REQUIRED
        </span>

      </div>

      {/* CLINICAL SUMMARY */}

      <section className="summary-section">

        <h4>Clinical Summary</h4>

        <p className="summary-text">
          {summaryText ||
            "No clinical summary text was returned by the backend."}
        </p>

      </section>

      {/* EXTRACTED FINDINGS */}

      {findingGroups.length > 0 && (

        <section className="summary-section">

          <h4>Extracted Clinical Findings</h4>

          {findingGroups.map((group) => (

            <div
              className="finding-category"
              key={group.category}
            >

              <h5>{group.category}</h5>

              {group.items.length > 0 &&
              group.items.some(
                (item) =>
                  item !== null &&
                  item !== undefined &&
                  item !== ""
              ) ? (

                <ul className="finding-list">

                  {group.items.map((item, index) => (

                    <li key={`${group.category}-${index}`}>

                      <span>{getItemText(item)}</span>

                      {item &&
                        typeof item === "object" &&
                        item.document && (
                          <small>
                            Source: {item.document}
                          </small>
                        )}

                      {item &&
                        typeof item === "object" &&
                        item.source_line && (
                          <small>
                            Extracted text: {item.source_line}
                          </small>
                        )}

                    </li>

                  ))}

                </ul>

              ) : (

                <p>No matching information extracted.</p>

              )}

            </div>

          ))}

        </section>

      )}

      {/* SUPPORTING EVIDENCE */}

      {evidence.length > 0 && (

        <section className="summary-section">

          <h4>Supporting Evidence</h4>

          <div className="issue-list">

            {evidence.map((item, index) => (

              <div
                className="issue-card"
                key={`${item.document_id || "evidence"}-${index}`}
              >

                <h4>
                  {item.category || "Clinical Evidence"}
                </h4>

                <p>
                  {item.text ||
                    item.value ||
                    "No evidence text available."}
                </p>

                <span>
                  Source: {item.document || "Clinical Document"}
                </span>

                <span>
                  Document ID: {item.document_id ?? "Not available"}
                </span>

              </div>

            ))}

          </div>

        </section>

      )}

      {/* CLINICIAN VERIFICATION */}

      <div className="clinical-notice">

        <ShieldCheck size={19} />

        <span>
          This is a draft clinical intelligence report.
          All extracted information must be verified against
          the original records and approved by a qualified
          clinician before clinical use.
        </span>

      </div>

    </div>
  );
}

// ==========================================
// MAIN APPLICATION
// ==========================================

function App() {
  const [enteredWorkspace, setEnteredWorkspace] = useState(false);
  const [page, setPage] = useState("Dashboard");

  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [medicationMentions, setMedicationMentions] = useState([]);

  const [medicationPatient, setMedicationPatient] = useState("");
  const [scanning, setScanning] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);

  const [timeline, setTimeline] = useState(null);
  const [summary, setSummary] = useState(null);
  const [aiReport, setAiReport] = useState(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
  });

  // ========================================
  // INITIAL DATA LOADING
  // ========================================

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ========================================
  // LOAD DASHBOARD DATA
  // ========================================

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    const requests = [
      ["patients", () => api.getPatients()],
      ["records", () => api.getDocuments()],
      ["alerts", () => api.getAlerts()],
      ["issues", () => api.getReconciliation()],
      ["medications", () => api.getMedicationMentions()],
    ];

    try {
      const results = await Promise.allSettled(
        requests.map(([, request]) => request())
      );

      results.forEach((result, index) => {
        if (result.status !== "fulfilled") return;

        const [name] = requests[index];

        if (name === "patients") {
          setPatients(getList(result.value, ["patients"]));
        }

        if (name === "records") {
          setRecords(getList(result.value, ["documents"]));
        }

        if (name === "alerts") {
          setAlerts(getList(result.value, ["alerts"]));
        }

        if (name === "issues") {
          setIssues(getList(result.value, ["issues"]));
        }

        if (name === "medications") {
          setMedicationMentions(
            getList(result.value, ["medications"])
          );
        }
      });

      if (results.every((result) => result.status === "rejected")) {
        setError("Unable to connect to the MEDUSA-X backend.");
      }
    } catch (err) {
      console.error("Dashboard loading failed:", err);
      setError("Unable to load MEDUSA-X dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // LOAD MEDICATION MENTIONS
  // ========================================

  async function loadMedicationMentions(patientId = "") {
    try {
      const response = await api.getMedicationMentions(patientId);

      setMedicationMentions(
        getList(response, ["medications"])
      );
    } catch (err) {
      console.error("Medication loading failed:", err);
      setMedicationMentions([]);
    }
  }

  // ========================================
  // RUN RECONCILIATION
  // ========================================

  async function scanReconciliation() {
    try {
      setScanning(true);
      setError("");

      await api.runReconciliation(
        medicationPatient || null
      );

      await loadDashboardData();
      await loadMedicationMentions(medicationPatient);

      window.alert("Reconciliation scan completed.");
    } catch (err) {
      setError(
        "Reconciliation failed: " +
          (err.message || "Unknown error")
      );
    } finally {
      setScanning(false);
    }
  }

  // ========================================
  // REGISTER PATIENT
  // ========================================

  async function registerPatient(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.age || !form.gender) {
      window.alert("Please fill in all required patient details.");
      return;
    }

    try {
      setError("");

      const patientData = {
        full_name: form.name.trim(),
        age: Number(form.age),
        mrn: "MX-" + Date.now(),
        sex: form.gender,
        department: "General",
        status: "Pending Review",
      };

      const created = await api.createPatient(patientData);

      setPatients((old) => [...old, created]);

      setForm({
        name: "",
        age: "",
        gender: "",
        phone: "",
      });

      setShowForm(false);
      setPage("Patients");
    } catch (err) {
      setError(err.message);

      window.alert(
        "Patient registration failed:\n" + err.message
      );
    }
  }

  // ========================================
  // DELETE PATIENT
  // ========================================

  async function deletePatient(patient) {
    const confirmed = window.confirm(
      `Permanently delete ${
        patient.full_name || "this patient"
      } (${patient.mrn || patient.id})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.deletePatient(patient.id);

      setPatients((old) =>
        old.filter((item) => item.id !== patient.id)
      );

      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
      }

      if (selectedTimeline?.id === patient.id) {
        setSelectedTimeline(null);
        setTimeline(null);
      }

      setSummary(null);
      setAiReport(null);

      window.alert("Patient deleted successfully.");
    } catch (err) {
      setError(
        "Patient deletion failed: " +
          (err.message || "Unknown error")
      );
    }
  }

  // ========================================
  // DELETE DOCUMENT
  // ========================================

  async function deleteDocument(record) {
    const confirmed = window.confirm(
      `Permanently delete ${
        record.title || record.file || "this document"
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.deleteDocument(record.id);

      setRecords((old) =>
        old.filter((item) => item.id !== record.id)
      );

      window.alert("Document deleted successfully.");
    } catch (err) {
      setError(
        "Document deletion failed: " +
          (err.message || "Unknown error")
      );
    }
  }

  // ========================================
  // UPLOAD CLINICAL DOCUMENTS
  // ========================================

  async function uploadRecord(e) {
    const input = e.target;
    const files = Array.from(input.files || []);

    if (!files.length) return;

    if (!selectedPatient?.id) {
      window.alert(
        "Please select a patient before uploading a medical document."
      );

      input.value = "";
      return;
    }

    setLoading(true);
    setError("");

    let successfulUploads = 0;
    let failedUploads = 0;

    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          failedUploads++;

          setError(
            `${file.name}: Only PDF documents are supported.`
          );

          continue;
        }

        if (file.size > 15 * 1024 * 1024) {
          failedUploads++;

          setError(
            `${file.name}: Maximum file size is 15 MB.`
          );

          continue;
        }

        try {
          const formData = new FormData();

          formData.append("patient", String(selectedPatient.id));
          formData.append("title", file.name);
          formData.append("document_type", "OTHER");
          formData.append("file", file);

          await api.uploadDocument(formData);

          successfulUploads++;
        } catch (err) {
          failedUploads++;

          console.error(
            `Upload failed for ${file.name}:`,
            err
          );

          setError(
            `${file.name}: ${err.message || "Upload failed."}`
          );
        }
      }

      await loadDashboardData();

      if (successfulUploads > 0 && failedUploads === 0) {
        window.alert(
          `${successfulUploads} document(s) uploaded successfully.`
        );
      } else if (successfulUploads > 0) {
        window.alert(
          `${successfulUploads} document(s) uploaded successfully. ${failedUploads} failed.`
        );
      } else {
        window.alert("No documents were uploaded successfully.");
      }
    } finally {
      setLoading(false);
      input.value = "";
    }
  }

  // ========================================
  // OPEN PATIENT TIMELINE
  // ========================================

  async function openTimeline(patient) {
    try {
      setLoading(true);
      setError("");

      setSelectedTimeline(patient);

      const response = await api.getTimeline(patient.id);

      setTimeline(response);
      setPage("Patient Timeline");
    } catch (err) {
      setError(
        "Unable to load patient timeline: " +
          (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // GENERATE CLINICAL SUMMARY
  // ========================================

  async function generateClinicalSummary(patient) {
    try {
      setLoading(true);
      setError("");

      setSelectedPatient(patient);

      const response = await api.generateDraftSummary(patient.id);

      setSummary(response);
      setPage("Clinical Summary");
    } catch (err) {
      setError(
        "Clinical summary generation failed: " +
          (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // GENERATE AI REPORT
  // ========================================

  async function generateAIReport(patient) {
    if (!patient) {
      window.alert("Select a patient first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      setSelectedPatient(patient);

      const response = await api.generateDraftSummary(patient.id);

      setAiReport(response);
    } catch (err) {
      setError(
        "AI report generation failed: " +
          (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // NAVIGATION
  // ========================================

  function navigate(name) {
    setPage(name);
    setError("");
    setSearch("");
  }

  // ========================================
  // FILTER PATIENTS
  // ========================================

  const filteredPatients = patients.filter((patient) =>
    [
      patient.full_name,
      patient.mrn,
      patient.id,
      patient.department,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ========================================
  // FILTER RECORDS
  // ========================================

  const filteredRecords = records.filter((record) =>
    [
      record.title,
      record.document_type,
      record.status,
      record.patient_name,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ========================================
  // ERROR BANNER
  // ========================================

  function renderError() {
    if (!error) return null;

    return (
      <div className="error-banner">
        <AlertTriangle size={18} />

        <span>{error}</span>

        <button onClick={() => setError("")}>
          <X size={16} />
        </button>
      </div>
    );
  }

  // ========================================
  // LANDING PAGE
  // ========================================

  if (!enteredWorkspace) {
    return (
      <Landing
        onEnter={() => setEnteredWorkspace(true)}
        onStart={() => setEnteredWorkspace(true)}
      />
    );
  }

  // ========================================
  // MAIN APPLICATION UI
  // ========================================

  return (
    <div className="app-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <Activity size={28} />

          <div>
            <h2>MEDUSA-X</h2>
            <span>Clinical Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-menu">

          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={
                  page === item.name
                    ? "menu-item active"
                    : "menu-item"
                }
                onClick={() => navigate(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}

        </nav>

        <div className="sidebar-footer">
          <span className="pulse"></span>
          System Online
        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <div>
            <h2>{page}</h2>
            <p>MEDUSA-X Clinical Intelligence Platform</p>
          </div>

          <div className="topbar-actions">

            <button
              className="icon-button"
              onClick={loadDashboardData}
              title="Refresh data"
            >
              <RefreshCw size={18} />
            </button>

            <button
              className="icon-button"
              onClick={() => navigate("Emergency Alerts")}
              title="Notifications"
            >
              <Bell size={18} />
            </button>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <div key={page} className="page-content">

          {renderError()}

          {loading && (
            <div className="loading-message">
              Loading MEDUSA-X data...
            </div>
          )}

          {/* ================================= */}
          {/* 3D HOSPITAL */}
          {/* ================================= */}

          {page === "3D Hospital" && (
            <MedusaHospital3D />
          )}

          {/* ================================= */}
          {/* DASHBOARD */}
          {/* ================================= */}

          {page === "Dashboard" && (

            <div className="dashboard-workspace">

              <div className="welcome-panel">
                <h1>Welcome to MEDUSA-X</h1>

                <p>
                  Reconstruct. Reconcile. Make safer clinical decisions.
                </p>
              </div>

              <div className="system-status">

                <span className="pulse"></span>

                BACKEND CONNECTED

                <span className="status-right">
                  Clinical intelligence prototype
                </span>

              </div>

              <div className="stats">

                <Stat
                  icon={<Users />}
                  label="Registered Patients"
                  value={patients.length}
                />

                <Stat
                  icon={<FileText />}
                  label="Uploaded Documents"
                  value={records.length}
                />

                <Stat
                  icon={<ShieldCheck />}
                  label="AI Reviewed Records"
                  value="0"
                />

                <Stat
                  icon={<AlertTriangle />}
                  label="Pending Alerts"
                  value={alerts.length}
                />

              </div>

              <div className="section-heading">

                <div>
                  <h2>Clinical Workspace</h2>
                  <p>Access your main clinical modules.</p>
                </div>

              </div>

              <div className="ai-feature-grid">

                {[
                  ["Patients", Users, "Manage patient profiles"],
                  ["Medical Records", FileText, "Upload clinical documents"],
                  ["Patient Timeline", Clock, "Reconstruct medical history"],
                  ["AI Intelligence", BrainCircuit, "Explore clinical AI modules"],
                ].map(([name, Icon, desc]) => (

                  <button
                    className="panel feature-card"
                    key={name}
                    onClick={() => navigate(name)}
                  >

                    <Icon color="#4acbff" size={26} />

                    <h3>{name}</h3>

                    <p>{desc}</p>

                    <span className="text-button">
                      Open module <ChevronRight size={14} />
                    </span>

                  </button>

                ))}

              </div>

            </div>

          )}

          {/* ================================= */}
          {/* PATIENTS */}
          {/* ================================= */}

          {page === "Patients" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>Patient Management</h2>
                  <p>Register and manage patient information.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus size={17} />
                  Add Patient
                </button>

              </div>

              {showForm && (

                <form
                  className="patient-form patient-registration"
                  onSubmit={registerPatient}
                >

                  <div className="patient-form-header">

                    <span className="patient-modal-eyebrow">
                      MEDUSA-X PATIENT MANAGEMENT
                    </span>

                    <h2>Register New Patient</h2>

                    <p>
                      Enter the patient's information below to create a new record.
                    </p>

                  </div>

                  <div className="patient-form-grid">

                    <div className="patient-field">

                      <label htmlFor="patient-name">
                        Full Name *
                      </label>

                      <input
                        id="patient-name"
                        type="text"
                        placeholder="Enter patient's full name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        required
                      />

                    </div>

                    <div className="patient-field">

                      <label htmlFor="patient-age">
                        Age *
                      </label>

                      <input
                        id="patient-age"
                        type="number"
                        placeholder="Enter age"
                        min="0"
                        max="120"
                        value={form.age}
                        onChange={(e) =>
                          setForm({ ...form, age: e.target.value })
                        }
                        required
                      />

                    </div>

                    <div className="patient-field">

                      <label htmlFor="patient-gender">
                        Gender *
                      </label>

                      <select
                        id="patient-gender"
                        value={form.gender}
                        onChange={(e) =>
                          setForm({ ...form, gender: e.target.value })
                        }
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>

                    </div>

                    <div className="patient-field">

                      <label htmlFor="patient-phone">
                        Phone Number
                      </label>

                      <input
                        id="patient-phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />

                    </div>

                  </div>

                  <div className="patient-form-note">

                    <ShieldCheck size={20} />

                    <span>
                      A unique Medical Record Number (MRN) will be generated
                      automatically.
                    </span>

                  </div>

                  <div className="patient-form-actions">

                    <button
                      type="button"
                      className="patient-cancel-button"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="patient-submit-button"
                    >
                      <Plus size={17} />
                      Register Patient
                    </button>

                  </div>

                </form>

              )}

              <div className="search-box">

                <Search size={18} />

                <input
                  placeholder="Search patients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

              </div>

              <div className="panel table-panel">

                <table>

                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>MRN</th>
                      <th>Age</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredPatients.map((patient) => (

                      <tr key={patient.id}>

                        <td>{patient.full_name}</td>
                        <td>{patient.mrn || patient.id}</td>
                        <td>{patient.age}</td>
                        <td>{patient.department || "General"}</td>
                        <td>{patient.status || "Registered"}</td>

                        <td className="action-buttons">

                          <button
                            title="View timeline"
                            onClick={() => openTimeline(patient)}
                          >
                            <Clock size={16} />
                          </button>

                          <button
                            title="Generate summary"
                            onClick={() =>
                              generateClinicalSummary(patient)
                            }
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            title="Delete patient"
                            onClick={() => deletePatient(patient)}
                          >
                            <Trash2 size={16} />
                          </button>

                        </td>

                      </tr>

                    ))}

                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan="6">
                          No patients found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </>

          )}

          {/* ================================= */}
          {/* MEDICAL RECORDS */}
          {/* ================================= */}

          {page === "Medical Records" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>Medical Records</h2>
                  <p>Upload and review patient documents.</p>
                </div>

              </div>

              <div className="panel upload-panel">

                <h3>Upload Clinical Documents</h3>

                <select
                  value={selectedPatient?.id || ""}
                  onChange={(e) => {

                    const patient = patients.find(
                      (item) =>
                        String(item.id) === e.target.value
                    );

                    setSelectedPatient(patient || null);

                  }}
                >

                  <option value="">Select Patient</option>

                  {patients.map((patient) => (

                    <option
                      key={patient.id}
                      value={patient.id}
                    >
                      {patient.full_name} - {patient.mrn}
                    </option>

                  ))}

                </select>

                <label className="upload-button">

                  <Upload size={19} />

                  Choose PDF Documents

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    hidden
                    onChange={uploadRecord}
                  />

                </label>

                <p className="upload-hint">
                  PDF only. Maximum file size: 15 MB per document.
                </p>

              </div>

              <div className="search-box">

                <Search size={18} />

                <input
                  placeholder="Search medical records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

              </div>

              <div className="panel table-panel">

                <table>

                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Patient</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredRecords.map((record) => (

                      <tr key={record.id}>

                        <td>{record.title || record.file}</td>

                        <td>
                          {record.document_type || "Clinical Document"}
                        </td>

                        <td>
                          {record.patient_name ||
                            record.patient ||
                            record.patient_id ||
                            "—"}
                        </td>

                        <td>{record.status || "Uploaded"}</td>

                        <td className="action-buttons">

                          <button
                            title="Delete document"
                            onClick={() => deleteDocument(record)}
                          >
                            <Trash2 size={16} />
                          </button>

                        </td>

                      </tr>

                    ))}

                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          No medical records found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </>

          )}

          {/* ================================= */}
          {/* PATIENT TIMELINE */}
          {/* ================================= */}

          {page === "Patient Timeline" && (

            <div className="panel">

              <div className="section-heading">

                <div>
                  <h2>Patient Timeline</h2>

                  <p>
                    Reconstructed clinical history from available records.
                  </p>
                </div>

              </div>

              {!selectedTimeline ? (

                <>

                  <p>Select a patient to view their timeline.</p>

                  {patients.map((patient) => (

                    <button
                      className="primary-button"
                      key={patient.id}
                      onClick={() => openTimeline(patient)}
                    >
                      {patient.full_name}
                    </button>

                  ))}

                </>

              ) : (

                <>

                  <h3>
                    {selectedTimeline.full_name}
                  </h3>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setSelectedTimeline(null);
                      setTimeline(null);
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to patients
                  </button>

                  <div className="clinical-timeline">

                    <div className="timeline-header">
                      <div>
                        <span className="timeline-eyebrow">PATIENT HISTORY</span>
                        <h3>{selectedTimeline.full_name}</h3>
                        <p>Clinical events reconstructed from available documents.</p>
                      </div>

                      <span className="timeline-count">
                        {Array.isArray(timeline?.timeline)
                          ? timeline.timeline.length
                          : 0} Records
                      </span>
                    </div>

                    {!Array.isArray(timeline?.timeline) ||
                    timeline.timeline.length === 0 ? (

                      <div className="empty-state">
                        <FileText size={24} />
                        <p>No clinical history is available for this patient yet.</p>
                      </div>

                    ) : (

                      <div className="timeline-events">

                        {timeline.timeline.map((event, index) => (

                          <div className="timeline-event" key={event.document_id || index}>

                            <div className="timeline-marker">
                              <span></span>
                            </div>

                            <div className="timeline-event-card">

                              <div className="timeline-event-top">

                                <span className="timeline-type">
                                  {event.type || "CLINICAL RECORD"}
                                </span>

                                <span className="timeline-status">
                                  {event.status || "AVAILABLE"}
                                </span>

                              </div>

                              <h4>{event.title || "Untitled Clinical Document"}</h4>

                              <p className="timeline-date">
                                {event.date
                                  ? new Date(event.date).toLocaleString("en-IN", {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Date not available"}
                              </p>

                              <div className="timeline-document-id">
                                Document ID: {event.document_id ?? "Not available"}
                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                </>

              )}

            </div>

          )}

          {/* ================================= */}
          {/* DIAGNOSIS REVIEW */}
          {/* ================================= */}

          {page === "Diagnosis Review" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>Diagnosis Reconciliation</h2>

                  <p>
                    Review diagnosis statements extracted from clinical documents.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={loadDashboardData}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>

              </div>

              <IssueList
                items={issues.filter((issue) =>
                  String(issue.issue_type || issue.category || "")
                    .toLowerCase()
                    .includes("diagn")
                )}
                emptyText="No diagnosis reconciliation issues found."
              />

              <div className="clinical-notice">
                Extracted diagnosis statements require clinician review.
                They are not independent medical diagnoses.
              </div>

            </>

          )}

          {/* ================================= */}
          {/* MEDICATION REVIEW */}
          {/* ================================= */}

          {page === "Medication Review" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>Medication Reconciliation</h2>

                  <p>
                    Review medication mentions extracted from patient records.
                  </p>
                </div>

              </div>

              <div className="panel">

                <label>Select Patient</label>

                <select
                  value={medicationPatient}
                  onChange={(e) => {

                    setMedicationPatient(e.target.value);

                    loadMedicationMentions(e.target.value);

                  }}
                >

                  <option value="">All Patients</option>

                  {patients.map((patient) => (

                    <option
                      key={patient.id}
                      value={patient.id}
                    >
                      {patient.full_name}
                    </option>

                  ))}

                </select>

                <button
                  className="primary-button"
                  disabled={scanning}
                  onClick={scanReconciliation}
                >

                  <RefreshCw size={16} />

                  {scanning
                    ? "Scanning..."
                    : "Run Reconciliation"}

                </button>

              </div>

              <div className="panel">

                <h3>Extracted Medication Mentions</h3>

                {medicationMentions.length === 0 ? (

                  <Empty text="No medication mentions found." />

                ) : (

                  <div className="issue-list">

                    {medicationMentions.map((item, index) => (

                      <div
                        className="issue-card"
                        key={item.id || index}
                      >

                        <h4>
                          {item.medication_name ||
                            item.name ||
                            item.medication ||
                            "Medication"}
                        </h4>

                        <p>
                          Strength: {item.strength || "Not specified"}
                        </p>

                        <p>
                          Dosage: {item.dosage || "Not specified"}
                        </p>

                        <p>
                          Frequency: {item.frequency || "Not specified"}
                        </p>

                        <p>
                          Source: {item.source || item.document_title || "Clinical record"}
                        </p>

                      </div>

                    ))}

                  </div>

                )}

              </div>

              <div className="panel">

                <h3>Medication Reconciliation Issues</h3>

                <IssueList
                  items={issues.filter((issue) =>
                    String(issue.issue_type || issue.category || "")
                      .toLowerCase()
                      .includes("med")
                  )}
                  emptyText="No medication reconciliation issues found."
                />

              </div>

              <div className="clinical-notice">
                Medication mentions are extracted from documents and must
                be verified by a qualified clinician before clinical use.
              </div>

            </>

          )}

          {/* ================================= */}
          {/* AI INTELLIGENCE */}
          {/* ================================= */}

          {page === "AI Intelligence" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>MEDUSA-X AI Intelligence</h2>

                  <p>
                    Patient-specific document intelligence and evidence review.
                  </p>
                </div>

              </div>

              <div className="panel">

                <h3>Select Patient</h3>

                <select
                  value={selectedPatient?.id || ""}
                  onChange={(e) => {

                    const patient = patients.find(
                      (item) =>
                        String(item.id) === e.target.value
                    );

                    setSelectedPatient(patient || null);
                    setAiReport(null);

                  }}
                >

                  <option value="">Select Patient</option>

                  {patients.map((patient) => (

                    <option
                      key={patient.id}
                      value={patient.id}
                    >
                      {patient.full_name} - {patient.mrn}
                    </option>

                  ))}

                </select>

                <button
                  className="primary-button"
                  disabled={loading || !selectedPatient}
                  onClick={() => generateAIReport(selectedPatient)}
                >

                  <BrainCircuit size={17} />

                  Generate Intelligence Report

                </button>

              </div>

              {aiReport && (

                <div className="panel">

                  <ClinicalReport
                    report={aiReport}
                    patientName={selectedPatient?.full_name}
                    eyebrow="MEDUSA-X AI INTELLIGENCE REPORT"
                  />

                </div>

              )}

              <div className="clinical-notice">
                MEDUSA-X is a clinical intelligence prototype. AI-generated
                information is not a confirmed diagnosis or treatment
                recommendation. All findings require clinician verification.
              </div>

            </>

          )}

          {/* ================================= */}
          {/* EMERGENCY ALERTS */}
          {/* ================================= */}

          {page === "Emergency Alerts" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>Emergency Alerts</h2>

                  <p>Review alerts generated by the backend.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={loadDashboardData}
                >
                  <RefreshCw size={16} />
                  Refresh Alerts
                </button>

              </div>

              {alerts.length === 0 ? (

                <Empty text="No emergency alerts available." />

              ) : (

                <div className="issue-list">

                  {alerts.map((alert, index) => (

                    <div
                      className="issue-card"
                      key={alert.id || index}
                    >

                      <AlertTriangle size={20} />

                      <h3>
                        {alert.title ||
                          alert.alert_type ||
                          "Clinical Alert"}
                      </h3>

                      <p>
                        {alert.message ||
                          alert.description ||
                          "No additional details."}
                      </p>

                      <span>
                        Severity: {alert.severity || "Not specified"}
                      </span>

                    </div>

                  ))}

                </div>

              )}

            </>

          )}

          {/* ================================= */}
          {/* CLINICAL SUMMARY */}
          {/* ================================= */}

          {page === "Clinical Summary" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>Clinical Summary</h2>

                  <p>
                    Patient-specific summary generated from available records.
                  </p>
                </div>

              </div>

              {!summary ? (

                <div className="panel">

                  <p>
                    Select a patient to generate a clinical summary.
                  </p>

                  <div className="summary-patient-list">

                    {patients.map((patient) => (

                      <button
                        className="primary-button"
                        key={patient.id}
                        onClick={() => generateClinicalSummary(patient)}
                      >
                        <Eye size={16} />
                        {patient.full_name}
                      </button>

                    ))}

                    {patients.length === 0 && (
                      <Empty text="No patients are registered yet." />
                    )}

                  </div>

                </div>

              ) : (

                <div className="panel">

                  <ClinicalReport
                    report={summary}
                    patientName={selectedPatient?.full_name}
                    eyebrow="MEDUSA-X CLINICAL REPORT"
                  />

                </div>

              )}

            </>

          )}

          {/* ================================= */}
          {/* AUDIT HISTORY */}
          {/* ================================= */}

          {page === "Audit History" && (

            <div className="panel">

              <h2>Audit History</h2>

              <p>
                Audit history will be displayed here when the backend
                audit endpoint is connected.
              </p>

            </div>

          )}

          {/* ================================= */}
          {/* ADMIN */}
          {/* ================================= */}

          {page === "Admin" && (

            <>

              <div className="section-heading">

                <div>
                  <h2>Administration</h2>

                  <p>Manage registered patient records.</p>
                </div>

              </div>

              <div className="panel table-panel">

                <table>

                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>MRN</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {patients.map((patient) => (

                      <tr key={patient.id}>

                        <td>{patient.full_name}</td>

                        <td>{patient.mrn || patient.id}</td>

                        <td>{patient.department || "General"}</td>

                        <td>

                          <button
                            onClick={() => deletePatient(patient)}
                            title="Delete patient"
                          >
                            <Trash2 size={16} />
                          </button>

                        </td>

                      </tr>

                    ))}

                    {patients.length === 0 && (

                      <tr>
                        <td colSpan="4">
                          No patients registered.
                        </td>
                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </>

          )}

          {/* ================================= */}
          {/* SETTINGS */}
          {/* ================================= */}

          {page === "Settings" && (

            <div className="panel">

              <h2>MEDUSA-X Settings</h2>

              <p>Clinical Intelligence Prototype</p>

              <p>Backend: Django REST API</p>

              <p>Frontend: React</p>

              <button
                className="primary-button"
                onClick={loadDashboardData}
              >

                <RefreshCw size={16} />

                Refresh System Data

              </button>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <span>{label}</span>

        <div className="stat-icon">
          {icon}
        </div>

      </div>

      <h2>{value}</h2>

    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function Empty({ text }) {
  return (
    <div className="empty-state">

      <FileText size={24} />

      <p>{text}</p>

    </div>
  );
}

// ==========================================
// ISSUE LIST
// ==========================================

function IssueList({ items = [], emptyText }) {
  if (!items || items.length === 0) {
    return (
      <Empty
        text={emptyText || "No issues found."}
      />
    );
  }

  return (
    <div className="issue-list">

      {items.map((item, index) => (

        <div
          className="issue-card"
          key={item.id || index}
        >

          <h4>
            {item.title ||
              item.issue_type ||
              item.category ||
              item.diagnosis ||
              "Review Item"}
          </h4>

          <p>
            {item.description ||
              item.message ||
              item.details ||
              item.extracted_text ||
              "No additional details available."}
          </p>

          <span>
            Status: {item.status || "Requires Review"}
          </span>

        </div>

      ))}

    </div>
  );
}

// ==========================================
// EXPORT
// ==========================================

export default App;