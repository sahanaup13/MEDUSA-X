
import re
import json


CATEGORIES = [
    "Diagnoses",
    "Medications",
    "Symptoms",
    "Examination",
    "Test Results",
    "Vitals",
    "Allergies",
    "Triage",
    "Clinical Plan",
]


# --------------------------------------------------
# TEXT CLEANING
# --------------------------------------------------

def clean_text(text):
    """Normalize extracted PDF text and repair common encoding errors."""

    text = (text or "").replace("\x00", " ")
    text = text.replace("\r", "\n")

    replacements = {
        "â€“": "–",
        "â€”": "—",
        "â‰¥": "≥",
        "â‰¤": "≤",
        "â¥": "≥",
        "â ": "– ",
        "âV": "–V",
        "Â°C": "°C",
        "Â°F": "°F",
        "Âµ": "µ",
        "Â": "",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return re.sub(r"\s+", " ", text).strip()


def extract_section(text, heading, stop_headings):
    stop_pattern = "|".join(stop_headings)

    pattern = (
        rf"{heading}\s*[:\-]?\s*"
        rf"(.*?)"
        rf"(?={stop_pattern}|$)"
    )

    match = re.search(
        pattern,
        text,
        re.IGNORECASE | re.DOTALL,
    )

    return match.group(1).strip() if match else ""


# --------------------------------------------------
# FINDING AND EVIDENCE MANAGEMENT
# --------------------------------------------------

def add_finding(
    findings,
    evidence,
    category,
    value,
    document,
    source=None,
):
    value = re.sub(
        r"\s+",
        " ",
        value or "",
    ).strip(" :-\n\t")

    if len(value) < 2:
        return

    value = value[:1200]

    item = {
        "value": value,
        "document_id": document.id,
        "document": document.title,
        "source_line": (source or value)[:1200],
    }

    duplicate = any(
        old["value"].lower() == value.lower()
        and old["document_id"] == document.id
        for old in findings[category]
    )

    if duplicate:
        return

    findings[category].append(item)

    evidence.append({
        "document_id": document.id,
        "document": document.title,
        "category": category,
        "text": (source or value)[:1200],
    })


# --------------------------------------------------
# MEDICATION EXTRACTION
# --------------------------------------------------

def extract_medications(text, document, findings, evidence):

    plan = extract_section(
        text,
        r"Immediate Stabilization(?: Plan)?",
        [
            r"Monitoring\s*(?:&|and)\s*Diagnostics",
            r"Disposition",
        ],
    )

    if not plan:
        plan = text

    medication_patterns = [
        r"\bAspirin\s+\d+\s*mg(?:\s+chewed)?",
        r"\bClopidogrel\s+\d+\s*mg(?:\s+loading dose)?",
        r"\bAtorvastatin\s+\d+\s*mg(?:\s+stat)?",
        r"\bO2\s+(?:at\s+)?\d+(?:\.\d+)?\s*L\s*/\s*min"
        r"(?:\s+via\s+nasal cannula)?",
    ]

    for pattern in medication_patterns:

        for match in re.finditer(
            pattern,
            plan,
            re.IGNORECASE,
        ):

            medication = " ".join(match.group(0).split())

            add_finding(
                findings,
                evidence,
                "Medications",
                medication,
                document,
                medication,
            )

    labelled_pattern = (
        r"(?:Current Medications|Home Medications|"
        r"Medication List|Prescription|Medications)"
        r"\s*:\s*(.*?)(?=Monitoring|Disposition|Allergies|$)"
    )

    for match in re.finditer(
        labelled_pattern,
        text,
        re.IGNORECASE,
    ):

        value = match.group(1).strip()

        if value:
            add_finding(
                findings,
                evidence,
                "Medications",
                value,
                document,
                match.group(0),
            )


# --------------------------------------------------
# VITAL SIGNS EXTRACTION
# --------------------------------------------------

def extract_vitals(text, document, findings, evidence):

    table_pattern = (
        r"Blood Pressure\s+Pulse Rate\s+Temperature\s+SpO2\s+"
        r"Respiratory Rate\s+Pain Score\s+"
        r"(.+?)"
        r"(?=3\.\s*Symptoms|Symptoms and Clinical Notes|$)"
    )

    table_match = re.search(
        table_pattern,
        text,
        re.IGNORECASE,
    )

    if table_match:

        values = table_match.group(1)

        patterns = [
            (
                "Blood Pressure",
                r"\b\d{2,3}\s*/\s*\d{2,3}\s*mmHg\b",
            ),
            (
                "Pulse Rate",
                r"\b\d{2,3}\s*bpm(?:\s*\(Regular\))?",
            ),
            (
                "Temperature",
                r"\b\d{2}(?:\.\d+)?\s*°?\s*C"
                r"(?:\s*\(\s*\d{2,3}(?:\.\d+)?\s*°?\s*F\s*\))?",
            ),
            (
                "SpO2",
                r"\b\d{1,3}\s*%\s*(?:\(Room Air\))?",
            ),
            (
                "Respiratory Rate",
                r"\b\d{1,2}\s*breaths/min\b",
            ),
            (
                "Pain Score",
                r"\b\d{1,2}\s*/\s*10\b",
            ),
        ]

        for label, pattern in patterns:

            match = re.search(
                pattern,
                values,
                re.IGNORECASE,
            )

            if match:
                add_finding(
                    findings,
                    evidence,
                    "Vitals",
                    f"{label}: {match.group(0)}",
                    document,
                    match.group(0),
                )

    # Fallback for directly labelled values.

    direct_patterns = [
        (
            "Blood Pressure",
            r"Blood Pressure\s*[:\-]?\s*(\d{2,3}\s*/\s*\d{2,3}\s*mmHg)",
        ),
        (
            "Pulse Rate",
            r"Pulse Rate\s*[:\-]?\s*(\d{2,3}\s*bpm(?:\s*\(Regular\))?)",
        ),
        (
            "Temperature",
            r"Temperature\s*[:\-]?\s*(\d{2}(?:\.\d+)?\s*°?\s*C)",
        ),
        (
            "SpO2",
            r"SpO2\s*[:\-]?\s*(\d{1,3}\s*%\s*(?:\(Room Air\))?)",
        ),
        (
            "Respiratory Rate",
            r"Respiratory Rate\s*[:\-]?\s*(\d{1,2}\s*breaths/min)",
        ),
        (
            "Pain Score",
            r"Pain Score\s*[:\-]?\s*(\d{1,2}\s*/\s*10)",
        ),
    ]

    for label, pattern in direct_patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            add_finding(
                findings,
                evidence,
                "Vitals",
                f"{label}: {match.group(1)}",
                document,
                match.group(0),
            )


# --------------------------------------------------
# TEST RESULTS EXTRACTION
# --------------------------------------------------

def extract_test_results(text, document, findings, evidence):

    lab_tests = [
        "Hemoglobin",
        "Total WBC Count",
        "Neutrophils",
        "Lymphocytes",
        "Eosinophils",
        "Monocytes",
        "RBC Count",
        "Hematocrit (PCV)",
        "MCV",
        "Platelet Count",
        "Random Blood Glucose",
        "HbA1c",
        "Blood Urea",
        "Serum Creatinine",
        "eGFR (CKD-EPI)",
        "Sodium",
        "Potassium",
        "Chloride",
        "Total Bilirubin",
        "SGOT (AST)",
        "SGPT (ALT)",
        "Alkaline Phosphatase",
        "Total Protein",
        "Albumin",
        "C-Reactive Protein (CRP)",
        "ESR (1 hr)",
        "Total Cholesterol",
        "Triglycerides",
        "HDL Cholesterol",
        "LDL Cholesterol",
    ]

    for test in lab_tests:

        pattern = (
            rf"{re.escape(test)}\s+"
            rf"([<>]?\s*\d+(?:\.\d+)?)\s+"
            rf"([^\s]+)"
        )

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if not match:
            continue

        result = match.group(1).strip()
        unit = match.group(2).strip()

        value = f"{test}: {result} {unit}"

        add_finding(
            findings,
            evidence,
            "Test Results",
            value,
            document,
            match.group(0),
        )


# --------------------------------------------------
# MAIN DOCUMENT EXTRACTION
# --------------------------------------------------

def extract_document(document, findings, evidence):

    text = clean_text(document.extracted_text)

    if not text:
        return

    # 1. DIAGNOSES

    diagnosis_pattern = (
        r"(?:Preliminary Assessment|Final Diagnosis|Primary Diagnosis|"
        r"Working Diagnosis|Clinical Impression|Diagnosis)"
        r"\s*:\s*(.*?)"
        r"(?=Immediate Stabilization|Monitoring|Disposition|$)"
    )

    for match in re.finditer(
        diagnosis_pattern,
        text,
        re.IGNORECASE,
    ):

        add_finding(
            findings,
            evidence,
            "Diagnoses",
            match.group(1),
            document,
            match.group(0),
        )

    # 2. SYMPTOMS

    symptom_pattern = (
        r"Patient presented with\s*(.*?)"
        r"(?=Past history|On physical examination|"
        r"Laboratory Investigation Results|$)"
    )

    for match in re.finditer(
        symptom_pattern,
        text,
        re.IGNORECASE,
    ):

        add_finding(
            findings,
            evidence,
            "Symptoms",
            match.group(1),
            document,
            match.group(0),
        )

    # 3. PHYSICAL EXAMINATION

    examination = re.search(
        r"On physical examination\s*(.*?)"
        r"(?=4\.\s*Laboratory Investigation|Laboratory Investigation|$)",
        text,
        re.IGNORECASE,
    )

    if examination:

        examination_text = re.sub(
            r"^[\s,;:.-]+",
            "",
            examination.group(1),
        ).strip()

        examination_text = re.sub(
            r"\s*4\.\s*$",
            "",
            examination_text,
        )

        add_finding(
            findings,
            evidence,
            "Examination",
            examination_text,
            document,
            examination_text,
        )

    # 4. TEST RESULTS

    extract_test_results(
        text,
        document,
        findings,
        evidence,
    )

    # 5. VITALS

    extract_vitals(
        text,
        document,
        findings,
        evidence,
    )

    # 6. ALLERGIES

    allergy = re.search(
        r"Blood Group\s*/\s*Allergies\s*"
        r"(.*?)(?=Attending Physician|$)",
        text,
        re.IGNORECASE,
    )

    if allergy:

        value = allergy.group(1).strip()

        allergy_match = re.search(
            r"(?:O|A|B|AB)[+-]\s*/\s*(.+)",
            value,
            re.IGNORECASE,
        )

        if allergy_match:
            value = allergy_match.group(1).strip()

        add_finding(
            findings,
            evidence,
            "Allergies",
            value,
            document,
            allergy.group(0),
        )

    # 7. TRIAGE

    triage_patterns = [
        r"Triage Priority Level\s*[:\-]?\s*([^:]{1,100})",
        r"Triage Category\s*(.*?)"
        r"(?=Mode of Arrival|Age\s*/\s*Sex|$)",
    ]

    for pattern in triage_patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:

            add_finding(
                findings,
                evidence,
                "Triage",
                match.group(1),
                document,
                match.group(0),
            )

    # 8. CLINICAL STABILIZATION PLAN

    plan = extract_section(
        text,
        r"Immediate Stabilization(?: Plan)?",
        [
            r"Monitoring\s*(?:&|and)\s*Diagnostics",
            r"Disposition",
        ],
    )

    if plan:

        add_finding(
            findings,
            evidence,
            "Clinical Plan",
            plan,
            document,
            plan,
        )

    # 9. MONITORING

    monitoring = extract_section(
        text,
        r"Monitoring\s*(?:&|and)\s*Diagnostics",
        [r"Disposition"],
    )

    if monitoring:

        add_finding(
            findings,
            evidence,
            "Clinical Plan",
            "Monitoring: " + monitoring,
            document,
            monitoring,
        )

    # 10. MEDICATION MENTIONS

    extract_medications(
        text,
        document,
        findings,
        evidence,
    )


# --------------------------------------------------
# EXTRACT FINDINGS FROM ALL DOCUMENTS
# --------------------------------------------------

def extract_clinical_findings(documents):

    findings = {
        category: [] for category in CATEGORIES
    }

    evidence = []

    for document in documents:

        extract_document(
            document,
            findings,
            evidence,
        )

    return findings, evidence


# --------------------------------------------------
# OLLAMA LOCAL LLM - DISCHARGE SUMMARY GENERATION
# --------------------------------------------------

def generate_ollama_discharge_draft(findings, documents):
    """
    Generate a clinician-reviewable draft using a local Ollama LLM.
    """

    import os
    from ollama import Client

    model = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    base_url = os.getenv(
        "OLLAMA_BASE_URL",
        "http://localhost:11434",
    )

    client = Client(
        host=base_url,
        timeout=180,
    )

    source_ids = [doc.id for doc in documents]

    source_data = {
        "findings": findings,
        "documents": [
            {
                "document_id": doc.id,
                "document_type": doc.document_type,
                "title": doc.title,
                "status": doc.status,
            }
            for doc in documents
        ],
    }

    prompt = f"""
You are MEDUSA-X, a clinical document intelligence assistant.

Generate a structured DISCHARGE SUMMARY DRAFT using ONLY
the supplied extracted clinical information.

STRICT SAFETY RULES:

1. Never invent clinical information.
2. Never create or infer a diagnosis.
3. Never prescribe medicines or treatment.
4. Never change investigation values or units.
5. Never assume missing information.
6. Clearly identify missing information.
7. Report possible conflicts only when supplied documents
   explicitly contain different values for the same item.
8. Never resolve conflicts yourself.
9. Preserve medication names and documented dosages exactly.
10. Preserve source document IDs.
11. Do not claim that a doctor approved the report.
12. If information is unavailable, write:
    "Not available in supplied documents."

Use these headings:

1. Clinical Overview
2. Documented Diagnoses
3. Symptoms and Clinical History
4. Examination Findings
5. Investigation Results
6. Vitals
7. Medication Information
8. Allergies
9. Missing Information
10. Possible Conflicting Information
11. Documents Reviewed
12. Clinician Verification Checklist

Only use these source document IDs:
{source_ids}

For every finding, retain its source document ID wherever possible.

This is a draft for clinician review, NOT a final discharge
instruction or independent medical opinion.

SOURCE DATA:

{json.dumps(source_data, ensure_ascii=False, default=str)}
"""

    response = client.chat(
        model=model,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        options={
            "temperature": 0.1,
        },
    )

    summary = response.message.content

    if not summary or not summary.strip():
        raise ValueError("Ollama returned an empty response.")

    return summary.strip()


# --------------------------------------------------
# BUILD CLINICAL SUMMARY
# --------------------------------------------------

def build_clinical_summary(patient, documents):

    findings, evidence = extract_clinical_findings(documents)

    try:

        summary_text = generate_ollama_discharge_draft(
            findings,
            documents,
        )

        engine = "Ollama Local LLM - MEDUSA-X"

    except Exception as error:

        print(f"Ollama generation failed: {error}")

        # Extraction-only fallback.
        # This is NOT a reconciled discharge summary.

        sections = [
            "MEDUSA-X CLINICAL INTELLIGENCE REPORT",
            f"Patient: {patient.full_name}",
            f"Documents reviewed: {len(documents)}",
            "",
            "LOCAL AI GENERATION UNAVAILABLE",
            "Existing document extraction report generated.",
        ]

        for category, items in findings.items():

            sections.extend(["", category.upper()])

            if not items:
                sections.append(
                    "No matching information extracted."
                )
                continue

            for item in items:

                sections.append(
                    f"- {item['value']} "
                    f"[Source: {item['document']}; "
                    f"Document ID: {item['document_id']}]"
                )

        sections.extend([
            "",
            "CLINICAL VERIFICATION REQUIRED",
            "A qualified clinician must verify all information.",
            "This prototype does not independently diagnose "
            "or recommend treatment.",
        ])

        summary_text = "\n".join(sections)

        engine = "MEDUSA-X Existing Extraction Fallback"

    return summary_text, findings, evidence, engine
