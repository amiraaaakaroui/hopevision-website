# HopeVisionAI - Database Schema Design Summary

## Domain Model Summary

Based on the frontend codebase analysis, HopeVisionAI is a medical decision-support platform with the following core entities:

### Core Entities

1. **User/Profile** - Base user entity linked to Supabase auth.users, with role-based profiles (patient, doctor, admin)

2. **Patient Profile** - Extends profile with medical information (blood group, allergies, medical history, weight, height)

3. **Doctor Profile** - Extends profile with professional information (specialty, license number, rating, consultation price)

4. **Pre-Analysis** - Patient symptom submission with multimodal inputs (text, voice, images, documents)

5. **AI Report** - Generated analysis from pre-analysis, containing diagnostic hypotheses, confidence scores, and recommendations

6. **Diagnostic Hypotheses** - Multiple possible diagnoses per report with confidence levels and explanations

7. **Appointment** - Consultations between patients and doctors (teleconsultation or in-person)

8. **Doctor Notes** - Doctor's review, diagnosis, and prescription based on AI report

9. **Discussion** - Collaborative hub for doctors to discuss complex cases

10. **Documents** - Medical documents uploaded by patients (lab results, reports, etc.)

11. **Timeline Events** - Patient care timeline tracking all events in their journey

12. **Prescriptions** - Structured prescriptions issued by doctors

13. **Exam Results** - Laboratory and imaging results

14. **Chat Messages** - Real-time communication (AI-patient precision chat, doctor-patient chat)

---

## Schema Design

### Table Relationships

```
profiles (1) ──< (1) patient_profiles
profiles (1) ──< (1) doctor_profiles

patient_profiles (1) ──< (*) pre_analyses
pre_analyses (1) ──< (1) ai_reports
ai_reports (1) ──< (*) diagnostic_hypotheses

patient_profiles (1) ──< (*) documents
pre_analyses (1) ──< (*) documents

patient_profiles (*) ──<─> (*) doctor_profiles (via patient_doctor_assignments)
patient_profiles (1) ──< (*) appointments ──> (*) doctor_profiles

appointments (1) ──< (*) doctor_notes
ai_reports (1) ──< (*) doctor_notes

doctor_profiles (*) ──<─> (*) discussions (via discussion_participants)
discussions (1) ──< (*) discussion_messages

pre_analyses (1) ──< (*) chat_precision_messages
patient_profiles (*) ──<─> (*) doctor_profiles (via doctor_chat_messages)

patient_profiles (1) ──< (*) timeline_events
patient_profiles (1) ──< (*) prescriptions
patient_profiles (1) ──< (*) exam_results
```

### Key Design Decisions

1. **Role-based Profiles**: Single `profiles` table linked to `auth.users`, with separate `patient_profiles` and `doctor_profiles` tables for role-specific data

2. **Multimodal Pre-Analysis**: `pre_analyses` table stores text, voice transcripts, image URLs, and document URLs as arrays

3. **Flexible AI Data**: `explainability_data` and `extracted_data` use JSONB for flexible storage of AI analysis results

4. **Assignment System**: `patient_doctor_assignments` table tracks which doctors can access which patients (via appointments, shared reports, or collaboration)

5. **Timeline Tracking**: `timeline_events` provides a unified view of patient care journey

6. **Collaborative Discussions**: Separate `discussions`, `discussion_participants`, and `discussion_messages` tables for doctor-to-doctor collaboration

---

## Table Descriptions

### 1. `profiles`
Base user profile linked to Supabase auth.users. Stores common fields (name, email, DOB) and role.

**Relationships:**
- One-to-one with `patient_profiles` or `doctor_profiles` (depending on role)

**Used in screens:**
- All authentication screens
- Patient/Doctor dashboards
- Profile management

---

### 2. `patient_profiles`
Patient-specific medical information.

**Key fields:**
- `patient_id`: Unique identifier (e.g., PAT-2025-00234)
- `blood_group`, `allergies`, `medical_history`

**Relationships:**
- One-to-many with `pre_analyses`, `appointments`, `documents`, `timeline_events`

**Used in screens:**
- `PatientHistory.tsx` - Patient info sidebar
- `PatientTimeline.tsx` - Patient summary
- `DoctorPatientFile.tsx` - Patient info sidebar

---

### 3. `doctor_profiles`
Doctor-specific professional information.

**Key fields:**
- `specialty`, `rpps_number`, `rating`, `consultation_price`

**Relationships:**
- One-to-many with `appointments`, `doctor_notes`, `prescriptions`
- Many-to-many with `patient_profiles` via `patient_doctor_assignments`

**Used in screens:**
- `DoctorDashboard.tsx` - Doctor info
- `BookingProviderSelection.tsx` - Doctor listings
- `SignupDoctorStep1.tsx` - Doctor registration

---

### 4. `pre_analyses`
Patient symptom submissions with multimodal inputs.

**Key fields:**
- `text_input`, `voice_transcript`, `image_urls[]`, `document_urls[]`
- `status`: draft → submitted → processing → completed
- `ai_processing_status`: Tracks AI processing state

**Relationships:**
- Many-to-one with `patient_profiles`
- One-to-one with `ai_reports`
- One-to-many with `documents`, `chat_precision_messages`

**Used in screens:**
- `PatientSymptoms.tsx` - Symptom input
- `PatientResults.tsx` - Results display
- `DoctorDashboard.tsx` - Incoming cases

---

### 5. `ai_reports`
AI-generated analysis from pre-analysis.

**Key fields:**
- `overall_severity`, `overall_confidence`, `primary_diagnosis`
- `explainability_data`: JSONB for multimodal analysis details
- `recommendation_action`, `recommendation_text`

**Relationships:**
- One-to-one with `pre_analyses`
- One-to-many with `diagnostic_hypotheses`
- One-to-many with `doctor_notes`

**Used in screens:**
- `PatientResults.tsx` - AI results display
- `PatientDetailedReport.tsx` - Detailed report
- `DoctorDetailedReport.tsx` - Doctor view of report

---

### 6. `diagnostic_hypotheses`
Multiple diagnostic hypotheses per AI report.

**Key fields:**
- `disease_name`, `confidence`, `severity`, `keywords[]`
- `is_primary`: Flags the main hypothesis
- `is_excluded`: For hypotheses that were ruled out

**Relationships:**
- Many-to-one with `ai_reports`

**Used in screens:**
- `PatientResults.tsx` - Hypothesis cards
- `DoctorDetailedReport.tsx` - Hypotheses tab

---

### 7. `appointments`
Consultations between patients and doctors.

**Key fields:**
- `appointment_type`: teleconsultation, in_person, follow_up, lab_exam
- `status`: scheduled → confirmed → in_progress → completed
- `scheduled_date`, `scheduled_time`, `duration_minutes`
- `price`, `payment_status`, `payment_method`
- `report_shared`: Whether AI report was shared with doctor

**Relationships:**
- Many-to-one with `patient_profiles` and `doctor_profiles`
- Optional links to `pre_analyses` and `ai_reports`
- One-to-many with `doctor_notes`, `prescriptions`, `exam_results`

**Used in screens:**
- `BookingSchedule.tsx` - Appointment scheduling
- `BookingPayment.tsx` - Payment processing
- `PatientHistory.tsx` - Appointment history
- `DoctorDashboard.tsx` - Doctor's appointments

---

### 8. `doctor_notes`
Doctor's review, diagnosis, and prescription.

**Key fields:**
- `doctor_diagnosis`, `doctor_notes`
- `ai_diagnosis_validated`, `ai_diagnosis_modified`
- `prescription_text`, `prescription_data` (JSONB)
- `recommended_exams` (JSONB), `treatment_plan`

**Relationships:**
- Many-to-one with `doctor_profiles`, `patient_profiles`
- Optional links to `appointments` and `ai_reports`

**Used in screens:**
- `DoctorPatientFile.tsx` - Decision tab
- `DoctorDetailedReport.tsx` - Medical validation

---

### 9. `discussions`
Collaborative discussions between doctors about a patient/case.

**Key fields:**
- `title`, `status`: active, resolved, archived
- `created_by_doctor_id`

**Relationships:**
- Many-to-one with `patient_profiles`
- Many-to-many with `doctor_profiles` via `discussion_participants`
- One-to-many with `discussion_messages`

**Used in screens:**
- `DoctorCollaboration.tsx` - Discussion list and chat

---

### 10. `discussion_messages`
Messages in collaborative discussions.

**Key fields:**
- `message_text`, `mentions` (JSONB for @mentions)

**Relationships:**
- Many-to-one with `discussions` and `doctor_profiles`

**Used in screens:**
- `DoctorCollaboration.tsx` - Message display

---

### 11. `documents`
Medical documents uploaded by patients.

**Key fields:**
- `file_name`, `file_url`, `file_type`, `file_size_bytes`
- `ai_extraction_status`, `extracted_data` (JSONB)

**Relationships:**
- Many-to-one with `patient_profiles`
- Optional link to `pre_analyses`

**Used in screens:**
- `PatientSymptoms.tsx` - Document upload
- `DoctorPatientFile.tsx` - Documents tab

---

### 12. `timeline_events`
Patient care timeline tracking.

**Key fields:**
- `event_type`: pre_analysis, ai_report, anamnesis, appointment, exam, etc.
- `event_title`, `event_description`, `status`
- Links to related entities (pre_analysis, appointment, ai_report)

**Relationships:**
- Many-to-one with `patient_profiles`
- Optional links to related entities

**Used in screens:**
- `PatientTimeline.tsx` - Complete timeline view

---

### 13. `prescriptions`
Structured prescriptions.

**Key fields:**
- `prescription_text`, `prescription_data` (JSONB)
- `status`: active, completed, cancelled

**Relationships:**
- Many-to-one with `doctor_profiles`, `patient_profiles`
- Optional link to `appointments` and `doctor_notes`

**Used in screens:**
- `DoctorPatientFile.tsx` - Prescription tab

---

### 14. `exam_results`
Laboratory and imaging results.

**Key fields:**
- `exam_type`, `exam_name`, `lab_name`
- `results_data` (JSONB), `results_file_url`
- `status`: pending, completed, cancelled

**Relationships:**
- Many-to-one with `patient_profiles`
- Optional links to `appointments` and `doctor_profiles`

**Used in screens:**
- `DoctorPatientFile.tsx` - Exam results display
- `PatientTimeline.tsx` - Exam events

---

### 15. `chat_precision_messages`
AI-patient chat during pre-analysis.

**Key fields:**
- `sender_type`: ai or patient
- `message_text`

**Relationships:**
- Many-to-one with `pre_analyses`

**Used in screens:**
- `PatientChatPrecision.tsx` - Chat interface

---

### 16. `doctor_chat_messages`
Real-time doctor-patient chat.

**Key fields:**
- `sender_type`: doctor or patient
- `message_text`, `status`: sent, delivered, read

**Relationships:**
- Many-to-one with `patient_profiles` and `doctor_profiles`

**Used in screens:**
- `DoctorChatRelay.tsx` - Doctor-patient chat

---

### 17. `patient_doctor_assignments`
Tracks which doctors can access which patients.

**Key fields:**
- `assignment_type`: appointment, shared_report, collaboration, cabinet_patient

**Relationships:**
- Many-to-many between `patient_profiles` and `doctor_profiles`
- Optional link to `ai_reports` (if report was shared)

**Purpose:**
- Controls access via RLS policies
- Tracks how patient-doctor relationship was established

---

## Row Level Security (RLS) Strategy

### General Principles

1. **Patients** can only see and modify their own data
2. **Doctors** can only see patients assigned to them (via appointments, shared reports, or collaboration)
3. **Admins** can see everything
4. **Helper functions** (`get_user_profile()`, `get_user_role()`) simplify policy logic

### Key Policies

- **Profiles**: Users see own profile; admins see all
- **Pre-Analyses**: Patients see own; doctors see assigned patients
- **AI Reports**: Patients see own; doctors see assigned patients
- **Appointments**: Patients see own; doctors see their appointments
- **Doctor Notes**: Patients see notes about them; doctors see their own notes
- **Discussions**: Only participating doctors can view
- **Documents**: Patients see own; doctors see assigned patients

---

## Example Queries

See `supabase_example_queries.md` for detailed examples covering:
- Patient dashboard loading
- Creating pre-analyses
- Loading AI reports
- Doctor dashboard cases
- Creating appointments
- Collaborative discussions
- Timeline loading
- And more...

---

## Assumptions Made

1. **Hospital/Clinic Support**: Added `hospitals` and `doctor_hospital_affiliations` tables, though not heavily used in current UI

2. **Payment Processing**: `appointments` table includes payment fields, but actual payment processing is handled externally

3. **File Storage**: Document/image URLs stored as TEXT; actual files stored in Supabase Storage

4. **AI Processing**: AI report generation assumed to be handled via Supabase Edge Functions

5. **Real-time Chat**: `doctor_chat_messages` supports real-time communication; implementation uses Supabase Realtime

6. **Anamnesis Questions**: Added `anamnesis_questions` table for AI-generated questions, though UI shows this as part of chat

7. **Soft Deletes**: Only `profiles` table has `is_deleted` flag; other tables use hard deletes with CASCADE

8. **Patient ID Format**: `patient_id` stored as TEXT (e.g., PAT-2025-00234); generation logic handled in application

---

## Next Steps

1. **Run SQL files**:
   - Execute `supabase_schema.sql` to create all tables
   - Execute `supabase_rls_policies.sql` to enable RLS and create policies

2. **Set up Storage buckets**:
   - `patient-documents` - For uploaded documents
   - `patient-images` - For symptom images
   - `patient-audio` - For voice recordings

3. **Create Edge Functions**:
   - `generate-ai-report` - Process pre-analysis and generate AI report
   - `extract-document-data` - Extract data from uploaded documents
   - `generate-ai-response` - Generate AI chat responses

4. **Test RLS policies**:
   - Verify patients can only see own data
   - Verify doctors can only see assigned patients
   - Test admin access

5. **Implement application logic**:
   - Patient ID generation (PAT-YYYY-XXXXX)
   - Auto-create `patient_doctor_assignments` on appointment creation
   - Auto-create timeline events on key actions

---

## Files Generated

1. **supabase_schema.sql** - Complete DDL for all tables, indexes, and triggers
2. **supabase_rls_policies.sql** - Row Level Security policies
3. **supabase_example_queries.md** - Example Supabase JS client queries
4. **SCHEMA_DESIGN_SUMMARY.md** - This document

---

## Questions or Issues?

If you need to modify the schema:
- Add new fields to existing tables
- Create new tables for additional features
- Adjust RLS policies for different access patterns
- Modify relationships based on new requirements

The schema is designed to be flexible and extensible while maintaining data integrity and security.

