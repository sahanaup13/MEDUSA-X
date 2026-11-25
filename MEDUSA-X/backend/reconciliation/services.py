import re

from records.models import ClinicalDocument
from .models import ReconciliationIssue


AUTO_DIAGNOSIS_NOTE = "AUTO_DIAGNOSIS_REVIEW"
AUTO_MEDICATION_NOTE = "AUTO_MEDICATION_REVIEW"


# ==================================================
# 1. DIAGNOSIS EXTRACTION
# ==================================================

def extract_diagnosis(text):

    pattern = (
        r"(?:Preliminary Assessment|Final Diagnosis|"
        r"Primary Diagnosis|Working Diagnosis|"
        r"Clinical Impression|Diagnosis)\s*:\s*"
        r"(.+?)(?=\s+(?:Immediate Stabilization|"
        r"Monitoring|Disposition|Laboratory Investigation)"
        r"\s*:|$)"
    )

    found = []

    for match in re.finditer(
        pattern,
        text or "",
        re.IGNORECASE | re.DOTALL
    ):

        value = re.sub(
            r"\s+",
            " ",
            match.group(1)
        ).strip(" .,:;-")

        if value and value.lower() not in [
            "none",
            "nil",
            "unknown",
            "not available",
            "no diagnosis"
        ]:

            if value.lower() not in [
                item.lower() for item in found
            ]:
                found.append(value)

    return found


# ==================================================
# 2. DIAGNOSIS RECONCILIATION
# ==================================================

def run_diagnosis_reconciliation(patient_id):

    documents = ClinicalDocument.objects.filter(
        patient_id=patient_id,
        status="EXTRACTED"
    ).exclude(extracted_text="")

    diagnoses = []

    for document in documents:

        for diagnosis in extract_diagnosis(
            document.extracted_text
        ):

            diagnoses.append({
                "document": document.title,
                "diagnosis": diagnosis
            })

    unique = {}

    for item in diagnoses:

        key = item["diagnosis"].strip().lower()

        unique.setdefault(key, item)

    issues = ReconciliationIssue.objects.filter(
        patient_id=patient_id,
        issue_type="DIAGNOSIS",
        reviewer_note__startswith=AUTO_DIAGNOSIS_NOTE,
        resolved=False
    )

    if len(unique) < 2:
        issues.delete()
        return

    evidence = "\n\n".join(
        f"Document: {item['document']}\n"
        f"Diagnosis: {item['diagnosis']}"
        for item in unique.values()
    )

    description = (
        "Different diagnosis statements were found across "
        "uploaded documents. They may represent changes "
        "over time or coexisting conditions. "
        "Clinician verification is required."
    )

    issue = issues.first()

    if issue:

        issue.description = description
        issue.evidence = evidence

        issue.save(
            update_fields=[
                "description",
                "evidence"
            ]
        )

    else:

        ReconciliationIssue.objects.create(
            patient_id=patient_id,
            issue_type="DIAGNOSIS",
            description=description,
            evidence=evidence,
            reviewer_note=(
                AUTO_DIAGNOSIS_NOTE
                + ": Rule-based detection. "
                "Clinician review required."
            ),
            resolved=False
        )


# ==================================================
# 3. MEDICATION EXTRACTION
# ==================================================

MEDICATION_NAMES = [
    "aspirin",
    "clopidogrel",
    "atorvastatin",
    "paracetamol",
    "acetaminophen",
    "ibuprofen",
    "metformin",
    "amlodipine",
    "pantoprazole",
    "omeprazole",
    "heparin",
    "insulin",
    "warfarin",
    "azithromycin",
    "amoxicillin",
    "ceftriaxone",
    "nitroglycerin",
    "furosemide",
    "losartan",
    "telmisartan",
    "metoprolol",
    "bisoprolol",
]

MEDICATION_PATTERN = re.compile(
    r"\b("
    + "|".join(
        re.escape(name)
        for name in sorted(
            MEDICATION_NAMES,
            key=len,
            reverse=True
        )
    )
    + r")\b",
    re.IGNORECASE
)

DOSE_PATTERN = re.compile(
    r"\b\d+(?:\.\d+)?\s*"
    r"(?:mg|mcg|µg|ug|g|ml|mL|units?|IU)\b",
    re.IGNORECASE
)


def extract_medications(text):
    """
    Extract medication names and nearby doses.

    Handles PDF line breaks between medication names
    and dose information.
    """

    if not text:
        return []

    # Normalize whitespace, including PDF line breaks.
    normalized_text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    medication_matches = list(
        MEDICATION_PATTERN.finditer(normalized_text)
    )

    found = []

    for index, match in enumerate(medication_matches):

        medication = match.group(1).lower()

        # Restrict dose search to this medication's section.
        if index + 1 < len(medication_matches):

            end_position = medication_matches[
                index + 1
            ].start()

        else:

            end_position = min(
                match.end() + 150,
                len(normalized_text)
            )

        section = normalized_text[
            match.end():end_position
        ]

        dose_match = DOSE_PATTERN.search(section)

        dose = (
            dose_match.group(0).strip()
            if dose_match
            else ""
        )

        context = normalized_text[
            match.start():end_position
        ].strip()

        found.append({
            "medication": medication,
            "dose": dose,
            "context": context[:300]
        })

    return found


# ==================================================
# 4. MEDICATION RECONCILIATION
# ==================================================

def run_medication_reconciliation(patient_id):

    documents = ClinicalDocument.objects.filter(
        patient_id=patient_id,
        status="EXTRACTED"
    ).exclude(extracted_text="")

    records = []

    for document in documents:

        medications = extract_medications(
            document.extracted_text
        )

        for item in medications:

            records.append({
                **item,
                "document": document.title,
                "document_id": document.id
            })

    grouped = {}

    for item in records:

        key = item["medication"].lower()

        grouped.setdefault(key, []).append(item)

    conflicts = []
    missing = []

    for medication, mentions in grouped.items():

        doses = {
            item["dose"].lower()
            for item in mentions
            if item["dose"]
        }

        # Different documented doses.
        if len(doses) > 1:

            conflicts.append({
                "medication": medication,
                "mentions": mentions
            })

        # Mentions without identifiable doses.
        without_dose = [
            item
            for item in mentions
            if not item["dose"]
        ]

        if without_dose:

            missing.append({
                "medication": medication,
                "mentions": without_dose
            })

    # ------------------------------------------------
    # MEDICATION DOSE CONFLICTS
    # ------------------------------------------------

    issue = ReconciliationIssue.objects.filter(
        patient_id=patient_id,
        issue_type="MEDICATION",
        reviewer_note__startswith=AUTO_MEDICATION_NOTE,
        resolved=False
    ).first()

    if conflicts:

        evidence_parts = []

        for conflict in conflicts:

            evidence_parts.append(
                f"Medication: {conflict['medication']}"
            )

            for item in conflict["mentions"]:

                evidence_parts.append(
                    f"Document: {item['document']}\n"
                    f"Dose: {item['dose'] or 'Not specified'}\n"
                    f"Context: {item['context']}"
                )

        evidence = "\n\n".join(evidence_parts)

        description = (
            "Different dose information was found for "
            "the same medication across uploaded records. "
            "Clinician verification is required."
        )

        if issue:

            issue.description = description
            issue.evidence = evidence

            issue.save(
                update_fields=[
                    "description",
                    "evidence"
                ]
            )

        else:

            ReconciliationIssue.objects.create(
                patient_id=patient_id,
                issue_type="MEDICATION",
                description=description,
                evidence=evidence,
                reviewer_note=(
                    AUTO_MEDICATION_NOTE
                    + ": Automatically detected dose differences. "
                    "Clinician review required."
                ),
                resolved=False
            )

    elif issue:

        issue.delete()

    # ------------------------------------------------
    # MISSING MEDICATION INFORMATION
    # ------------------------------------------------

    missing_issue = ReconciliationIssue.objects.filter(
        patient_id=patient_id,
        issue_type="MISSING",
        reviewer_note__startswith=AUTO_MEDICATION_NOTE,
        resolved=False
    ).first()

    if missing:

        evidence_parts = []

        for item in missing:

            evidence_parts.append(
                f"Medication: {item['medication']}"
            )

            for mention in item["mentions"]:

                evidence_parts.append(
                    f"Document: {mention['document']}\n"
                    f"Context: {mention['context']}"
                )

        evidence = "\n\n".join(evidence_parts)

        description = (
            "Medication mentions were found without "
            "identifiable dose information. "
            "Clinician verification is required."
        )

        if missing_issue:

            missing_issue.description = description
            missing_issue.evidence = evidence

            missing_issue.save(
                update_fields=[
                    "description",
                    "evidence"
                ]
            )

        else:

            ReconciliationIssue.objects.create(
                patient_id=patient_id,
                issue_type="MISSING",
                description=description,
                evidence=evidence,
                reviewer_note=(
                    AUTO_MEDICATION_NOTE
                    + ": Missing medication information. "
                    "Clinician review required."
                ),
                resolved=False
            )

    elif missing_issue:

        missing_issue.delete()


# ==================================================
# 5. RUN ALL RECONCILIATION
# ==================================================

def run_all_reconciliation(patient_id):

    run_diagnosis_reconciliation(patient_id)

    run_medication_reconciliation(patient_id)