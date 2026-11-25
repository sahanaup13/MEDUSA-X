import re


PATTERNS = {
    "Diagnoses": [
        r"Preliminary Assessment\s*:\s*(.+?)(?=Immediate Stabilization|Monitoring & Diagnostics|Disposition|$)",
        r"Diagnosis\s*:\s*(.+)",
        r"Clinical Impression\s*:\s*(.+)",
    ],

    "Medications": [
        r"(?:Administer|Administration of)\s+(.+?)(?=Monitoring & Diagnostics|Disposition|$)",
        r"(?:Medication|Prescription|Drug)\s*:\s*(.+)",
    ],

    "Symptoms": [
        r"Patient presented with\s+(.+?)(?=Past history|On physical examination|$)",
        r"Chief Complaint\s*:\s*(.+)",
        r"Symptoms?\s*:\s*(.+)",
    ],

    "Test Results": [
        r"High-Sensitivity Troponin-I\s+(.+)",
        r"Hemoglobin\s*\(Hb\)\s*/\s*WBC\s*Count\s+(.+)",
        r"Random Blood Glucose\s+(.+)",
        r"Serum Creatinine\s*/\s*Potassium\s+(.+)",
        r"12-Lead ECG\s+(.+)",
    ],

    "Vitals": [
        r"Blood\s+Pressure\s+(.+?)\s+Pulse\s+Rate",
        r"Pulse Rate\s+(.+?)\s+Temperature",
        r"Temperature\s+(.+?)\s+SpO2",
        r"SpO2\s+(.+?)\s+Respiratory",
        r"Respiratory\s+Rate\s+(.+?)\s+Pain",
        r"Pain\s+Score\s+(.+)",
    ],

    "Allergies": [
        r"Blood Group\s*/\s*Allergies\s+(.+?)\s+Attending Physician",
    ],

    "Triage": [
        r"Triage Priority Level\s+(.+?)(?=1\. Patient|$)",
        r"Triage Category\s+(.+?)\s+Mode of Arrival",
    ],
}


def clean_text(text):
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", "\n", text)
    return text.strip()


def add_finding(findings, evidence, category, value, document, source):
    value = re.sub(r"\s+", " ", value).strip(" :-\n\t")

    if not value or len(value) < 2:
        return

    if len(value) > 1200:
        value = value[:1200]

    item = {
        "value": value,
        "document_id": document.id,
        "document": document.title,
        "source_line": source[:1200],
    }

    if not any(
        existing["value"].lower() == value.lower()
        and existing["document_id"] == document.id
        for existing in findings[category]
    ):
        findings[category].append(item)

        evidence.append({
            "document_id": document.id,
            "document": document.title,
            "category": category,
            "text": source[:1200],
        })


def extract_document(document, findings, evidence):
    text = clean_text(document.extracted_text or "")

    if not text:
        return

    for category, patterns in PATTERNS.items():
        for pattern in patterns:
            for match in re.finditer(
                pattern,
                text,
                re.IGNORECASE | re.DOTALL
            ):
                value = match.group(1).strip()

                source = match.group(0).strip()

                add_finding(
                    findings,
                    evidence,
                    category,
                    value,
                    document,
                    source
                )

    # Extract medication names and doses explicitly listed
    # in the stabilization plan.
    medication_patterns = [
        r"Aspirin\s+\d+\s*mg(?:\s+[^,.]+)?",
        r"Clopidogrel\s+\d+\s*mg(?:\s+[^,.]+)?",
        r"Atorvastatin\s+\d+\s*mg(?:\s+[^,.]+)?",
        r"O2\s+at\s+\d+\s*L/min(?:\s+[^,.]+)?",
    ]

    for pattern in medication_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            add_finding(
                findings,
                evidence,
                "Medications",
                match.group(0),
                document,
                match.group(0)
            )

    # Capture the full preliminary assessment when its
    # heading and text are separated by PDF line wrapping.
    assessment = re.search(
        r"Preliminary Assessment\s*:\s*(.+?)(?=Immediate Stabilization|Monitoring & Diagnostics|Disposition|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if assessment:
        add_finding(
            findings,
            evidence,
            "Diagnoses",
            assessment.group(1),
            document,
            assessment.group(0)
        )

    # Capture physical examination details.
    examination = re.search(
        r"On physical examination\s*,?\s*(.+?)(?=4\. Laboratory|Laboratory Investigation Results|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if examination:
        add_finding(
            findings,
            evidence,
            "Symptoms",
            examination.group(1),
            document,
            examination.group(0)
        )

    # Capture the complete stabilization and monitoring plan.
    plan = re.search(
        r"Immediate Stabilization\s*:\s*(.+?)(?=Monitoring & Diagnostics|Disposition|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if plan:
        add_finding(
            findings,
            evidence,
            "Clinical Plan",
            plan.group(1),
            document,
            plan.group(0)
        )


def extract_clinical_findings(documents):
    categories = list(PATTERNS.keys()) + ["Clinical Plan"]

    findings = {
        category: [] for category in categories
    }

    evidence = []

    for document in documents:
        extract_document(document, findings, evidence)

    return findings, evidence


def build_clinical_summary(patient, documents):

    findings, evidence = extract_clinical_findings(documents)

    sections = [
        "MEDUSA-X CLINICAL INTELLIGENCE REPORT",
        f"Patient: {patient.full_name}",
        f"Documents reviewed: {len(documents)}",
        "",
        "DOCUMENT-BASED CLINICAL INFORMATION",
        "The following findings were extracted from uploaded records.",
        "They have not been independently medically verified.",
    ]

    for category, items in findings.items():

        sections.append("")
        sections.append(category.upper())

        if not items:
            sections.append(
                "No matching information extracted from available documents."
            )
            continue

        for item in items:
            sections.append(
                f"- {item['value']} "
                f"[Source: {item['document']}, "
                f"Document ID: {item['document_id']}]"
            )

    sections.extend([
        "",
        "DOCUMENT REVIEW"
    ])

    for document in documents:
        sections.append(
            f"- {document.title}: {document.status}"
        )

    sections.extend([
        "",
        "CLINICAL VERIFICATION REQUIRED",
        "All extracted information must be checked against "
        "the original records by a qualified clinician.",
        "This report does not independently diagnose disease "
        "or recommend treatment."
    ])

    return "\n".join(sections), findings, evidence