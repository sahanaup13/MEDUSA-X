
import { useState, useEffect } from "react";

import Landing from "./Landing";
import MedusaHospital3D from "./MedusaHospital3D";
import Login from "./Login";
import { api } from "./api";

import "./Layout.css";
import "./App.css";

import {
  LayoutDashboard,
  Users,
  Trash2,
  FileText,
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

function App() {
  const [loggedIn, setLoggedIn] = useState(
  sessionStorage.getItem("medusa_login") === "true"
);
  // AUTHENTICATION AND NAVIGATION

  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("medusa_authenticated") === "true"
  );

  const [enteredWorkspace, setEnteredWorkspace] = useState(false);
  const [page, setPage] = useState("Dashboard");

  // APPLICATION DATA

  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [issues, setIssues] = useState([]);

  // UI STATES

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [summary, setSummary] = useState(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
  });

  // LOAD DATA ONLY AFTER ENTERING THE WORKSPACE

  useEffect(() => {
    if (isAuthenticated && enteredWorkspace) {
      loadDashboardData();
    }
  }, [isAuthenticated, enteredWorkspace]);
  if (!loggedIn) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg,#071b32,#123e58)",
      fontFamily: "Arial"
    }}>
      <form onSubmit={(e) => {
        e.preventDefault();
        sessionStorage.setItem("medusa_login", "true");
        setLoggedIn(true);
      }} style={{
        background: "white",
        padding: "40px",
        borderRadius: "18px",
        width: "340px",
        boxShadow: "0 20px 60px #0005"
      }}>
        <h1 style={{color:"#123e58"}}>MEDUSA-X</h1>
        <p>Clinical Intelligence Workspace</p>
        <input required type="email" placeholder="Email address"
          style={{width:"100%",padding:"13px",margin:"10px 0",boxSizing:"border-box"}} />
        <input required type="password" placeholder="Password"
          style={{width:"100%",padding:"13px",margin:"10px 0",boxSizing:"border-box"}} />
        <button type="submit" style={{
          width:"100%",padding:"14px",background:"#087f8c",
          color:"white",border:0,borderRadius:"8px",cursor:"pointer"
        }}>Sign In →</button>
        <small>MEDUSA-X Clinical Platform</small>
      </form>
    </div>
  );
}

  // LOAD BACKEND DATA

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.getPatients(),
        api.getDocuments(),
        api.getAlerts(),
        api.getReconciliation(),
      ]);

      if (results[0].status === "fulfilled") {
        const data = results[0].value;
        setPatients(
          Array.isArray(data) ? data : data.results || []
        );
      }

      if (results[1].status === "fulfilled") {
        const data = results[1].value;
        setRecords(
          Array.isArray(data) ? data : data.results || []
        );
      }

      if (results[2].status === "fulfilled") {
        const data = results[2].value;
        setAlerts(
          Array.isArray(data) ? data : data.results || []
        );
      }

      if (results[3].status === "fulfilled") {
        const data = results[3].value;
        setIssues(
          Array.isArray(data) ? data : data.results || []
        );
      }

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      if (failed.length === results.length) {
        setError(
          "Cannot connect to backend. Check Django server."
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // LOGIN

  function handleLogin({ email, password }) {
    if (!email?.trim() || !password?.trim()) {
      return;
    }

    sessionStorage.setItem("medusa_authenticated", "true");
    setIsAuthenticated(true);
  }

  // LOGOUT

  function logout() {
    sessionStorage.removeItem("medusa_authenticated");

    setIsAuthenticated(false);
    setEnteredWorkspace(false);
    setPage("Dashboard");

    setSelectedPatient(null);
    setSelectedTimeline(null);
    setTimeline(null);
    setSummary(null);

    setSearch("");
    setError("");
    setShowForm(false);
  }

  // REGISTER PATIENT

  async function savePatient(e) {
    e.preventDefault();

    try {
      setError("");

      const patientData = {
        full_name: form.name,
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
      alert("Patient registration failed:\n" + err.message);
    }
  }

  // DELETE PATIENT

  async function deletePatient(patient) {
    const confirmed = window.confirm(
      `Permanently delete ${patient.full_name} (${patient.mrn})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deletePatient(patient.id);

      setPatients((old) =>
        old.filter((p) => p.id !== patient.id)
      );

      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
      }

      if (selectedTimeline?.id === patient.id) {
        setSelectedTimeline(null);
        setTimeline(null);
      }

      setSummary(null);

      alert("Patient deleted successfully.");
    } catch (err) {
      setError("Patient deletion failed: " + err.message);
    }
  }

  // DELETE MEDICAL DOCUMENT

  async function deleteDocument(record) {
    const confirmed = window.confirm(
      `Permanently delete ${record.title || record.file}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteDocument(record.id);

      setRecords((old) =>
        old.filter((r) => r.id !== record.id)
      );

      alert("PDF deleted successfully.");
    } catch (err) {
      setError("PDF deletion failed: " + err.message);
    }
  }

  // UPLOAD MEDICAL DOCUMENT

  async function uploadRecord(e) {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (!selectedPatient) {
      alert("Please select a patient before uploading.");
      e.target.value = "";
      return;
    }

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Only PDF documents are supported.");
        continue;
      }

      try {
        const formData = new FormData();

        formData.append("patient", selectedPatient.id);
        formData.append("title", file.name);
        formData.append("document_type", "OTHER");
        formData.append("file", file);

        await api.uploadDocument(formData);
      } catch (err) {
        alert(`Upload failed for ${file.name}:\n${err.message}`);
      }
    }

    await loadDashboardData();
    e.target.value = "";
  }

  // PATIENT TIMELINE

  async function openTimeline(patient) {
    setSelectedTimeline(patient);
    setTimeline(null);
    setPage("Patient Timeline");
    setError("");

    try {
      const result = await api.getTimeline(patient.id);
      setTimeline(result);
    } catch (err) {
      setError("Timeline could not be loaded: " + err.message);
    }
  }

  // CLINICAL SUMMARY / AI ANALYSIS

  async function generateSummary(
    patient,
    targetPage = "Clinical Summary"
  ) {
    setSelectedTimeline(patient);
    setSummary(null);
    setPage(targetPage);
    setError("");

    try {
      const result = await api.generateDraftSummary(patient.id);
      setSummary(result);
    } catch (err) {
      setError("Summary generation failed: " + err.message);
    }
  }

  // SEARCH PATIENTS

  const filteredPatients = patients.filter((p) =>
    `${p.full_name || ""} ${p.mrn || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // NAVIGATION

  function openPage(name) {
    setPage(name);
    setSelectedPatient(null);
    setError("");
  }

  // LOGIN PAGE

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // CINEMATIC LANDING PAGE

  if (!enteredWorkspace) {
    return (
      <Landing
        onEnter={() => setEnteredWorkspace(true)}
      />
    );
  }

  // MAIN APPLICATION

  return (
    <div className="app-container">

      {/* LEFT SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Activity />
          </div>

          <div>
            <h2>
              MEDUSA<span>-X</span>
            </h2>
            <small>CLINICAL INTELLIGENCE</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={page === item.name ? "active" : ""}
                onClick={() => openPage(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>

                {item.name === "Emergency Alerts" &&
                  alerts.length > 0 && (
                    <span className="nav-count">
                      {alerts.length}
                    </span>
                  )}

                {item.name === "Admin" && (
                  <span className="nav-count">ADMIN</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">DR</div>
            <div>
              <b>Dr. Administrator</b>
              <small>Clinical Staff</small>
            </div>
          </div>
        </div>

      </aside>

      {/* RIGHT MAIN WORKSPACE */}

      <main className="main-content">

        {/* TOP NAVIGATION */}

        <header className="topbar">

          <div className="mobile-brand">
            <Activity />
            MEDUSA-X
          </div>

          <div className="search">
            <Search size={18} />

            <input
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="top-actions">
            <Bell />

            <button
              className="secondary-button"
              onClick={loadDashboardData}
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>

            <div className="avatar">DR</div>

            <button
              className="secondary-button"
              onClick={logout}
              title="Logout"
            >
              Logout
            </button>
          </div>

        </header>

        {/* WORKSPACE CONTENT */}

        <section className="content">

          {/* ERROR MESSAGE */}

          {error && (
            <div className="alert-item red-alert">
              <AlertTriangle size={18} />
              <span>{error}</span>

              <button onClick={() => setError("")}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <p style={{ color: "#4acbff", marginBottom: 15 }}>
              Connecting to MEDUSA-X backend...
            </p>
          )}

          {/* 3D HOSPITAL */}

          {page === "3D Hospital" && (
            <div className="hospital-page">
              <MedusaHospital3D />
            </div>
          )}

          {/* DASHBOARD */}

          {page === "Dashboard" && (
            <Dashboard
              patients={patients}
              records={records}
              alerts={alerts}
              onNavigate={openPage}
            />
          )}

          {/* PATIENT MANAGEMENT */}

          {page === "Patients" && (
            <div className="patients-page">

              <PageHeader
                title="Patient Management"
                subtitle="Register, search and manage patient records."
                button="Register Patient"
                onClick={() => setShowForm(true)}
              />

              {/* PATIENT REGISTRATION MODAL */}

              {showForm && (
                <div
                  className="modal-overlay patient-modal-overlay"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowForm(false);
                    }
                  }}
                >
                  <form
                    className="modal patient-modal"
                    onSubmit={savePatient}
                  >

                    <button
                      type="button"
                      className="close-button"
                      onClick={() => setShowForm(false)}
                    >
                      <X />
                    </button>

                    <div className="patient-modal-heading">
                      <div className="patient-modal-icon">
                        <Users size={27} />
                      </div>

                      <div>
                        <span className="patient-modal-eyebrow">
                          MEDUSA-X · PATIENT MANAGEMENT
                        </span>

                        <h2>Register New Patient</h2>

                        <p>
                          Create a new patient profile in the clinical workspace.
                        </p>
                      </div>
                    </div>

                    <div className="patient-form-section">
                      <h3>Personal Information</h3>

                      <p>
                        Enter the patient's basic details below.
                      </p>

                      <div className="patient-form-grid">

                        <div className="patient-field">
                          <label>Full Name *</label>

                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                name: e.target.value,
                              })
                            }
                            placeholder="Enter full name"
                          />
                        </div>

                        <div className="patient-field">
                          <label>Age *</label>

                          <input
                            type="number"
                            required
                            min="0"
                            max="120"
                            value={form.age}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                age: e.target.value,
                              })
                            }
                            placeholder="Enter age"
                          />
                        </div>

                        <div className="patient-field">
                          <label>Gender *</label>

                          <select
                            required
                            value={form.gender}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                gender: e.target.value,
                              })
                            }
                          >
                            <option value="">Select gender</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">
                              Prefer not to say
                            </option>
                          </select>
                        </div>

                        <div className="patient-field">
                          <label>Phone Number</label>

                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                phone: e.target.value,
                              })
                            }
                            placeholder="Enter phone number"
                          />
                        </div>

                      </div>
                    </div>

                    <div className="patient-form-note">
                      <ShieldCheck size={19} />
                      <span>
                        Review the information before submitting.
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
                        <Plus size={19} />
                        Register Patient
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* PATIENT LIST */}

              <div className="panel">
                <div className="panel-heading">
                  <h3>
                    Registered Patients ({patients.length})
                  </h3>
                </div>

                {filteredPatients.length === 0 ? (
                  <Empty message="No patients found. Register your first patient." />
                ) : (
                  filteredPatients.map((p) => (
                    <div className="patient-list-row" key={p.id}>

                      <div className="patient-avatar">
                        {p.full_name?.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="patient-info">
                        <b>{p.full_name}</b>
                        <small>
                          {p.mrn} · Age {p.age}
                        </small>
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => setSelectedPatient(p)}
                      >
                        <Eye size={15} />
                        View
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() => openTimeline(p)}
                      >
                        <Clock size={15} />
                        Timeline
                      </button>

                    </div>
                  ))
                )}
              </div>

              {/* PATIENT DETAILS */}

              {selectedPatient && (
                <div className="panel patient-detail">

                  <button
                    className="text-button"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                  <h2>{selectedPatient.full_name}</h2>
                  <p>Patient ID: {selectedPatient.mrn}</p>
                  <p>Age: {selectedPatient.age}</p>
                  <p>Gender: {selectedPatient.sex}</p>
                  <p>Department: {selectedPatient.department}</p>
                  <p>Status: {selectedPatient.status}</p>

                  <button
                    className="primary-button"
                    onClick={() => generateSummary(selectedPatient)}
                  >
                    <BrainCircuit size={17} />
                    Generate Clinical Summary
                  </button>

                </div>
              )}

            </div>
          )}

          {/* MEDICAL RECORDS */}

          {page === "Medical Records" && (
            <div>

              <PageHeader
                title="Medical Records"
                subtitle="Upload and organize patient medical documents."
              />

              <div className="panel upload-panel">

                <div className="upload-icon">
                  <Upload size={35} />
                </div>

                <h2>Upload Medical Documents</h2>

                <p>
                  Select a patient and upload their PDF records.
                </p>

                <label>Choose Patient</label>

                <select
                  value={selectedPatient?.id || ""}
                  onChange={(e) => {
                    const patient = patients.find(
                      (p) => String(p.id) === e.target.value
                    );

                    setSelectedPatient(patient || null);
                  }}
                >
                  <option value="">Select patient</option>

                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} — {p.mrn}
                    </option>
                  ))}
                </select>

                <label className="primary-button upload-button">
                  <Upload size={18} />
                  Choose PDF Files

                  <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    onChange={uploadRecord}
                    disabled={!selectedPatient}
                  />
                </label>

                <small>
                  PDF only. Maximum size 15 MB per document.
                </small>

              </div>

              {/* UPLOADED DOCUMENTS */}

              <div className="panel">
                <h3>
                  Uploaded Documents ({records.length})
                </h3>

                {records.length === 0 ? (
                  <Empty message="No documents uploaded yet." />
                ) : (
                  records.map((r) => (
                    <div className="patient-list-row" key={r.id}>

                      <FileText color="#45caff" />

                      <div className="patient-info">
                        <b>{r.title || r.file}</b>
                        <small>
                          {r.document_type} · {r.status}
                        </small>
                      </div>

                      <span className="badge orange">
                        {r.status || "Uploaded"}
                      </span>

                      <button
                        className="admin-delete-button"
                        onClick={() => deleteDocument(r)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>

                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* PATIENT TIMELINE */}

          {page === "Patient Timeline" && (
            <div>

              <PageHeader
                title="Patient Timeline"
                subtitle="Chronological reconstruction of clinical events."
              />

              <div className="panel timeline-panel">

                {!selectedTimeline ? (
                  <>
                    <h3>Select a patient</h3>

                    {patients.map((p) => (
                      <div className="patient-list-row" key={p.id}>

                        <div className="patient-info">
                          <b>{p.full_name}</b>
                          <small>{p.mrn}</small>
                        </div>

                        <button
                          className="secondary-button"
                          onClick={() => openTimeline(p)}
                        >
                          <Clock size={15} />
                          View Timeline
                        </button>

                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="timeline-header">

                      <div>
                        <p className="eyebrow">
                          PATIENT MEDICAL HISTORY
                        </p>

                        <h2>{selectedTimeline.full_name}</h2>

                        <p>
                          Patient ID: {selectedTimeline.mrn}
                        </p>
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => {
                          setSelectedTimeline(null);
                          setTimeline(null);
                        }}
                      >
                        <ArrowLeft size={16} />
                        Back to Patients
                      </button>

                    </div>

                    {!timeline ? (
                      <p className="timeline-loading">
                        Loading patient timeline...
                      </p>
                    ) : (
                      <div className="timeline-list">

                        {Array.isArray(timeline.timeline) &&
                        timeline.timeline.length > 0 ? (
                          timeline.timeline.map((item) => (
                            <div
                              className="timeline-event"
                              key={item.document_id}
                            >

                              <div className="timeline-marker">
                                <div className="timeline-dot"></div>
                                <div className="timeline-line"></div>
                              </div>

                              <div className="timeline-card">

                                <div className="timeline-card-top">
                                  <div className="timeline-file-icon">
                                    <FileText size={21} />
                                  </div>

                                  <span className="badge orange">
                                    {item.status || "UNKNOWN"}
                                  </span>
                                </div>

                                <h3>{item.title}</h3>

                                <div className="timeline-meta">
                                  <span>
                                    <FileText size={14} />
                                    {item.type || "OTHER"}
                                  </span>

                                  <span>
                                    <Clock size={14} />
                                    {item.date
                                      ? new Date(item.date).toLocaleString()
                                      : "Date unavailable"}
                                  </span>
                                </div>

                                <div className="timeline-document-id">
                                  Document ID: {item.document_id}
                                </div>

                              </div>
                            </div>
                          ))
                        ) : (
                          <Empty message="No medical events found for this patient." />
                        )}

                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          )}

          {/* DIAGNOSIS REVIEW */}

          {page === "Diagnosis Review" && (
            <div>
              <PageHeader
                title="Diagnosis Reconciliation"
                subtitle="Review potential conflicts across clinical records."
              />

              <IssueList
                issues={issues}
                filter="DIAGNOSIS"
              />
            </div>
          )}

          {/* MEDICATION REVIEW */}

          {page === "Medication Review" && (
            <div>
              <PageHeader
                title="Medication Reconciliation"
                subtitle="Review medication discrepancies."
              />

              <IssueList
                issues={issues}
                filter="MEDICATION"
              />
            </div>
          )}

          {/* AI INTELLIGENCE */}

          {page === "AI Intelligence" && (
            <div>

              <PageHeader
                title="MEDUSA-X Clinical Intelligence"
                subtitle="Patient-specific intelligence powered by uploaded medical records."
              />

              {/* AI MODULES */}

              <div className="ai-feature-grid">
                {[
                  ["Document Agent", "Extract clinical information"],
                  ["Timeline Agent", "Reconstruct patient history"],
                  ["Diagnosis Agent", "Compare diagnosis records"],
                  ["Medication Agent", "Reconcile medication entries"],
                  ["Verification Agent", "Check evidence and citations"],
                  ["Uncertainty Agent", "Identify missing information"],
                ].map(([title, desc]) => (
                  <div className="panel feature-card" key={title}>
                    <BrainCircuit color="#4acbff" />
                    <h3>{title}</h3>
                    <p>{desc}</p>
                    <span className="badge orange">
                      Prototype module
                    </span>
                  </div>
                ))}
              </div>

              {/* PATIENT SELECTION */}

              {!summary && (
                <div className="panel">
                  <h3>Select Patient for AI Analysis</h3>

                  {patients.length === 0 ? (
                    <Empty message="No registered patients available." />
                  ) : (
                    patients.map((p) => (
                      <div className="patient-list-row" key={p.id}>

                        <div className="patient-avatar">
                          {p.full_name?.slice(0, 1).toUpperCase()}
                        </div>

                        <div className="patient-info">
                          <b>{p.full_name}</b>
                          <small>
                            {p.mrn} · Age {p.age}
                          </small>
                        </div>

                        <button
                          className="primary-button"
                          onClick={() =>
                            generateSummary(p, "AI Intelligence")
                          }
                        >
                          <BrainCircuit size={17} />
                          Analyze Records
                        </button>

                      </div>
                    ))
                  )}
                </div>
              )}

              {/* AI RESULTS */}

              {summary && (
                <div className="ai-results">

                  <div className="panel">
                    <div className="timeline-header">

                      <div>
                        <span className="eyebrow">
                          AI PATIENT ANALYSIS
                        </span>

                        <h2>{summary.patient}</h2>

                        <p>
                          Documents reviewed: {summary.documents_reviewed || 0}
                        </p>
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => setSummary(null)}
                      >
                        <ArrowLeft size={16} />
                        Back to Patients
                      </button>

                    </div>
                  </div>

                  {/* INTELLIGENCE METRICS */}

                  <div className="ai-feature-grid">

                    {Object.entries(summary.findings || {}).map(
                      ([category, items]) => (
                        <div className="panel feature-card" key={category}>
                          <BrainCircuit size={24} />
                          <h3>{category}</h3>
                          <h1>
                            {Array.isArray(items) ? items.length : 0}
                          </h1>
                          <p>Extracted findings</p>
                        </div>
                      )
                    )}

                    <div className="panel feature-card">
                      <FileText size={24} />
                      <h3>Evidence Records</h3>
                      <h1>{summary.evidence?.length || 0}</h1>
                      <p>Source evidence extracted</p>
                    </div>

                  </div>

                  {/* CLINICAL REPORT */}

                  <div className="panel">
                    <h2>
                      <BrainCircuit size={22} />
                      Clinical Intelligence Report
                    </h2>

                    <pre className="clinical-output">
                      {summary.summary}
                    </pre>
                  </div>

                  {/* EXTRACTED FINDINGS */}

                  <div className="panel">
                    <h2>Extracted Clinical Findings</h2>

                    {Object.entries(summary.findings || {}).map(
                      ([category, items]) => (
                        <div
                          key={category}
                          className="ai-finding-section"
                        >
                          <h3>{category}</h3>

                          {!Array.isArray(items) || items.length === 0 ? (
                            <p>
                              No explicitly labelled findings extracted.
                            </p>
                          ) : (
                            items.map((item, index) => (
                              <div
                                className="patient-list-row"
                                key={index}
                              >
                                <div className="patient-info">
                                  <b>{item.value}</b>
                                  <small>
                                    Source: {item.document}
                                  </small>
                                  <small>
                                    Document ID: {item.document_id}
                                  </small>
                                </div>

                                <span className="badge orange">
                                  Requires verification
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* SOURCE EVIDENCE */}

                  <div className="panel">
                    <h2>Source Documents & Evidence</h2>

                    {(summary.evidence || []).map((item, index) => (
                      <div className="timeline-card" key={index}>
                        <h3>{item.document}</h3>

                        <span className="badge orange">
                          {item.category}
                        </span>

                        <p>{item.text}</p>

                        <small>
                          Document ID: {item.document_id}
                        </small>
                      </div>
                    ))}
                  </div>

                  <div className="panel">
                    <h3>Clinical Verification Notice</h3>
                    <p>
                      These findings are extracted from uploaded documents.
                      They are not independently medically verified.
                      A qualified clinician must review the original records.
                    </p>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* EMERGENCY ALERTS */}

          {page === "Emergency Alerts" && (
            <div>

              <PageHeader
                title="Emergency Alerts"
                subtitle="Unresolved issues requiring clinical attention."
              />

              <div className="panel">
                <h3>Clinical Alerts ({alerts.length})</h3>

                {alerts.length === 0 ? (
                  <Empty message="No alerts currently available." />
                ) : (
                  alerts.map((a) => (
                    <div
                      className="alert-item red-alert"
                      key={a.id}
                    >
                      <AlertTriangle />

                      <div>
                        <b>{a.title}</b>
                        <p>{a.message}</p>
                        <small>
                          Severity: {a.severity}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* CLINICAL SUMMARY */}

          {page === "Clinical Summary" && (
            <div>

              <PageHeader
                title="Clinical Summary"
                subtitle="Generate evidence-backed draft patient summaries."
              />

              {!summary ? (
                <div className="panel">
                  <h3>Select Patient</h3>

                  {patients.length === 0 ? (
                    <Empty message="No registered patients available." />
                  ) : (
                    patients.map((p) => (
                      <div className="patient-list-row" key={p.id}>

                        <div className="patient-info">
                          <b>{p.full_name}</b>
                          <small>{p.mrn}</small>
                        </div>

                        <button
                          className="primary-button"
                          onClick={() => generateSummary(p)}
                        >
                          <BrainCircuit size={17} />
                          Generate Summary
                        </button>

                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="ai-results">

                  <div className="panel">
                    <div className="timeline-header">

                      <div>
                        <h2>Clinical Intelligence Report</h2>

                        <p>
                          Patient: {summary.patient || selectedTimeline?.full_name}
                        </p>

                        <p>
                          Documents reviewed: {summary.documents_reviewed ?? 0}
                        </p>

                        <span className="badge">
                          Clinician verification required
                        </span>
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => setSummary(null)}
                      >
                        <ArrowLeft size={16} />
                        Back
                      </button>

                    </div>
                  </div>

                  {Object.entries(summary.findings || {}).map(
                    ([category, items]) => (
                      <div className="panel" key={category}>
                        <h3>{category}</h3>

                        {!Array.isArray(items) || items.length === 0 ? (
                          <p className="empty-state">
                            No information extracted.
                          </p>
                        ) : (
                          items.map((item, index) => (
                            <div
                              className="ai-finding-section"
                              key={index}
                            >
                              <p>{item.value}</p>
                              <small>
                                Source: {item.document} | Document ID: {item.document_id}
                              </small>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  )}

                  <div className="panel">
                    <h3>Full Clinical Report</h3>
                    <div className="clinical-output">
                      {summary.summary || "No clinical report available."}
                    </div>
                  </div>

                  <div className="panel">
                    <h3>Clinical Review Notice</h3>
                    <p>
                      This is an AI-generated draft based on uploaded
                      medical documents. A qualified clinician must
                      verify all information before clinical use.
                    </p>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* AUDIT HISTORY */}

          {page === "Audit History" && (
            <div>
              <PageHeader
                title="Audit History"
                subtitle="Review system activity."
              />

              <InfoPanel
                icon={<Database />}
                title="Audit logging"
                description="Audit history API integration can be added to display document uploads, analysis runs and review actions."
              />
            </div>
          )}

          {/* ADMIN PANEL */}

          {page === "Admin" && (
            <div className="admin-page">

              <PageHeader
                title="Admin Dashboard"
                subtitle="Manage registered patient records."
              />

              <div className="stats">
                <Stat
                  icon={<Users />}
                  label="Total Registered Patients"
                  value={patients.length}
                />

                <Stat
                  icon={<ShieldCheck />}
                  label="Admin Workspace"
                  value="Active"
                />
              </div>

              <div className="panel admin-patient-panel">
                <div className="panel-heading">
                  <h3>
                    Patient Management ({filteredPatients.length})
                  </h3>

                  <button
                    className="secondary-button"
                    onClick={loadDashboardData}
                  >
                    <RefreshCw size={15} />
                    Refresh
                  </button>
                </div>

                {filteredPatients.length === 0 ? (
                  <Empty message="No registered patients found." />
                ) : (
                  filteredPatients.map((p) => (
                    <div className="patient-list-row" key={p.id}>

                      <div className="patient-avatar">
                        {p.full_name?.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="patient-info">
                        <b>{p.full_name}</b>
                        <small>
                          {p.mrn} · Age {p.age} · {p.sex}
                        </small>
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => setSelectedPatient(p)}
                      >
                        <Eye size={15} />
                        View
                      </button>

                      <button
                        className="admin-delete-button"
                        onClick={() => deletePatient(p)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>

                    </div>
                  ))
                )}
              </div>

              <div className="panel">
                <h3>Administration Information</h3>
                <p>
                  Patient deletion is permanent. Confirm each deletion
                  carefully before proceeding.
                </p>
              </div>

              {selectedPatient && (
                <div className="panel patient-detail">

                  <button
                    className="text-button"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                  <h2>{selectedPatient.full_name}</h2>
                  <p>Patient ID: {selectedPatient.mrn}</p>
                  <p>Age: {selectedPatient.age}</p>
                  <p>Gender: {selectedPatient.sex}</p>
                  <p>Department: {selectedPatient.department}</p>
                  <p>Status: {selectedPatient.status}</p>

                </div>
              )}

            </div>
          )}

          {/* SETTINGS */}

          {page === "Settings" && (
            <div>
              <PageHeader
                title="Settings"
                subtitle="Application configuration."
              />

              <InfoPanel
                icon={<Settings />}
                title="MEDUSA-X configuration"
                description="Account management, permissions and security settings."
              />
            </div>
          )}

          {/* FOOTER */}

          <footer>
            MEDUSA-X © 2026 · Clinical Intelligence Prototype
          </footer>

        </section>
      </main>
    </div>
  );
}

/* =========================================
   REUSABLE COMPONENTS
========================================= */

function PageHeader({ title, subtitle, button, onClick }) {
  return (
    <div className="welcome">
      <div>
        <p className="eyebrow">MEDUSA-X WORKSPACE</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {button && (
        <button
          className="primary-button"
          onClick={onClick}
        >
          <Plus size={18} />
          {button}
        </button>
      )}
    </div>
  );
}

function Empty({ message }) {
  return (
    <div className="empty-state">
      <FileText />
      <p>{message}</p>
    </div>
  );
}

function InfoPanel({ icon, title, description }) {
  return (
    <div className="panel info-panel">
      <div className="info-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>

      <span className="badge orange">
        Development in progress
      </span>
    </div>
  );
}

function IssueList({ issues, filter }) {
  const filtered = issues.filter(
    (item) => item.issue_type === filter
  );

  return (
    <div className="panel">
      <h3>
        {filter} Issues ({filtered.length})
      </h3>

      {filtered.length === 0 ? (
        <Empty message="No reconciliation issues available." />
      ) : (
        filtered.map((item) => (
          <div className="patient-list-row" key={item.id}>
            <AlertTriangle color="#ffae42" />

            <div className="patient-info">
              <b>{item.description}</b>
              <small>{item.evidence}</small>
            </div>

            <span className="badge orange">
              {item.resolved ? "Resolved" : "Review required"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function Dashboard({ patients, records, alerts, onNavigate }) {
  return (
    <>
      <PageHeader
        title="Welcome to MEDUSA-X"
        subtitle="Reconstruct. Reconcile. Make safer clinical decisions."
      />

      <div className="system-status">
        <span className="pulse"></span>
        BACKEND CONNECTED

        <span className="status-right">
          Clinical intelligence prototype
        </span>
      </div>

      {/* DASHBOARD STATISTICS */}

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
          label="AI Verified Records"
          value="0"
        />

        <Stat
          icon={<AlertTriangle />}
          label="Pending Alerts"
          value={alerts.length}
        />
      </div>

      {/* CLINICAL WORKSPACE */}

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
            onClick={() => onNavigate(name)}
          >
            <Icon color="#4acbff" size={26} />
            <h3>{name}</h3>
            <p>{desc}</p>

            <span className="text-button">
              Open module
              <ChevronRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

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

export default App;
