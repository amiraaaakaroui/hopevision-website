# HopeVisionAI - Example Supabase Queries

This document provides example queries using the Supabase JavaScript client that match the frontend flows.

## Setup

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## 1. Patient Dashboard - Load Patient History

**Screen:** `PatientHistory.tsx`

```typescript
// Get current patient profile
const { data: profile } = await supabase
  .from('profiles')
  .select('id, full_name, role')
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
  .single()

// Get patient profile details
const { data: patientProfile } = await supabase
  .from('patient_profiles')
  .select('*, profiles(*)')
  .eq('profile_id', profile.id)
  .single()

// Get all pre-analyses with AI reports
const { data: preAnalyses } = await supabase
  .from('pre_analyses')
  .select(`
    *,
    ai_reports (
      id,
      overall_severity,
      overall_confidence,
      primary_diagnosis,
      created_at
    )
  `)
  .eq('patient_profile_id', patientProfile.id)
  .order('created_at', { ascending: false })

// Get appointments
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    doctor_profiles (
      id,
      specialty,
      profiles (
        full_name
      )
    )
  `)
  .eq('patient_profile_id', patientProfile.id)
  .order('scheduled_date', { ascending: false })

// Get timeline events
const { data: timeline } = await supabase
  .from('timeline_events')
  .select('*')
  .eq('patient_profile_id', patientProfile.id)
  .order('event_date', { ascending: false })
```

---

## 2. Patient Symptoms - Create New Pre-Analysis

**Screen:** `PatientSymptoms.tsx`

```typescript
// Step 1: Get patient profile ID
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
  .single()

const { data: patientProfile } = await supabase
  .from('patient_profiles')
  .select('id')
  .eq('profile_id', profile.id)
  .single()

// Step 2: Create pre-analysis
const { data: preAnalysis, error } = await supabase
  .from('pre_analyses')
  .insert({
    patient_profile_id: patientProfile.id,
    status: 'draft',
    text_input: 'Toux sèche depuis 5 jours',
    selected_chips: ['5 jours', 'Toux sèche', 'Fièvre'],
    image_urls: ['https://storage.supabase.co/...'],
    document_urls: ['https://storage.supabase.co/...']
  })
  .select()
  .single()

// Step 3: Upload documents to Supabase Storage (if needed)
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('patient-documents')
  .upload(`${patientProfile.id}/${preAnalysis.id}/document.pdf`, file)

// Step 4: Update pre-analysis with document URLs
await supabase
  .from('pre_analyses')
  .update({ document_urls: [uploadData.path] })
  .eq('id', preAnalysis.id)
```

---

## 3. Patient Chat Precision - Add Messages

**Screen:** `PatientChatPrecision.tsx`

```typescript
// Get pre-analysis ID (from previous step)
const preAnalysisId = '...'

// Add patient message
const { data: message } = await supabase
  .from('chat_precision_messages')
  .insert({
    pre_analysis_id: preAnalysisId,
    sender_type: 'patient',
    message_text: 'Cela fait 5 jours maintenant'
  })
  .select()
  .single()

// Trigger AI response (via Edge Function)
const { data: aiResponse } = await supabase.functions.invoke('generate-ai-response', {
  body: {
    pre_analysis_id: preAnalysisId,
    conversation_history: [...]
  }
})

// Add AI message
await supabase
  .from('chat_precision_messages')
  .insert({
    pre_analysis_id: preAnalysisId,
    sender_type: 'ai',
    message_text: aiResponse.message
  })

// Get all messages for display
const { data: messages } = await supabase
  .from('chat_precision_messages')
  .select('*')
  .eq('pre_analysis_id', preAnalysisId)
  .order('created_at', { ascending: true })
```

---

## 4. Patient Results - Load AI Report

**Screen:** `PatientResults.tsx`

```typescript
// Get AI report with hypotheses
const { data: aiReport } = await supabase
  .from('ai_reports')
  .select(`
    *,
    diagnostic_hypotheses (
      id,
      disease_name,
      confidence,
      severity,
      keywords,
      explanation,
      is_primary
    )
  `)
  .eq('pre_analysis_id', preAnalysisId)
  .single()

// Format for UI
const results = aiReport.diagnostic_hypotheses
  .filter(h => !h.is_excluded)
  .map(h => ({
    disease: h.disease_name,
    confidence: h.confidence,
    severity: h.severity,
    keywords: h.keywords,
    explanation: h.explanation
  }))
```

---

## 5. Doctor Dashboard - Load Incoming Cases

**Screen:** `DoctorDashboard.tsx`

```typescript
// Get doctor profile
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
  .single()

const { data: doctorProfile } = await supabase
  .from('doctor_profiles')
  .select('id')
  .eq('profile_id', profile.id)
  .single()

// Get assigned patients with pending pre-analyses
const { data: cases } = await supabase
  .from('patient_doctor_assignments')
  .select(`
    patient_profiles (
      id,
      profiles (
        full_name
      )
    ),
    pre_analyses!inner (
      id,
      status,
      text_input,
      created_at,
      ai_reports (
        id,
        primary_diagnosis,
        overall_confidence,
        overall_severity
      )
    )
  `)
  .eq('doctor_profile_id', doctorProfile.id)
  .eq('assignment_type', 'shared_report')
  .eq('pre_analyses.status', 'completed')

// Format for UI
const formattedCases = cases.map(c => ({
  patient: c.patient_profiles.profiles.full_name,
  age: c.patient_profiles.age,
  severity: c.pre_analyses[0].ai_reports.overall_severity,
  aiDiagnosis: c.pre_analyses[0].ai_reports.primary_diagnosis,
  confidence: c.pre_analyses[0].ai_reports.overall_confidence,
  status: 'new',
  time: formatTimeAgo(c.pre_analyses[0].created_at)
}))
```

---

## 6. Doctor Patient File - Load Complete Patient Data

**Screen:** `DoctorPatientFile.tsx`

```typescript
const patientProfileId = '...'

// Get patient info
const { data: patient } = await supabase
  .from('patient_profiles')
  .select(`
    *,
    profiles (
      full_name,
      email,
      date_of_birth
    )
  `)
  .eq('id', patientProfileId)
  .single()

// Get pre-analyses with AI reports
const { data: preAnalyses } = await supabase
  .from('pre_analyses')
  .select(`
    *,
    ai_reports (
      *,
      diagnostic_hypotheses (
        *
      )
    )
  `)
  .eq('patient_profile_id', patientProfileId)
  .order('created_at', { ascending: false })

// Get documents
const { data: documents } = await supabase
  .from('documents')
  .select('*')
  .eq('patient_profile_id', patientProfileId)
  .order('uploaded_at', { ascending: false })

// Get doctor notes
const { data: doctorNotes } = await supabase
  .from('doctor_notes')
  .select('*')
  .eq('patient_profile_id', patientProfileId)
  .eq('doctor_profile_id', doctorProfileId)
  .order('created_at', { ascending: false })

// Get exam results
const { data: examResults } = await supabase
  .from('exam_results')
  .select('*')
  .eq('patient_profile_id', patientProfileId)
  .order('created_at', { ascending: false })
```

---

## 7. Doctor Notes - Create/Update Diagnosis

**Screen:** `DoctorPatientFile.tsx` (Decision tab)

```typescript
// Create or update doctor note
const { data: existingNote } = await supabase
  .from('doctor_notes')
  .select('id')
  .eq('patient_profile_id', patientProfileId)
  .eq('doctor_profile_id', doctorProfileId)
  .eq('ai_report_id', aiReportId)
  .maybeSingle()

if (existingNote) {
  // Update existing note
  await supabase
    .from('doctor_notes')
    .update({
      doctor_diagnosis: 'Pneumonie atypique confirmée',
      doctor_notes: 'Diagnostic cohérent avec le tableau clinique...',
      ai_diagnosis_validated: true,
      validation_comment: 'Diagnostic IA validé',
      prescription_text: 'Azithromycine 500mg/j pendant 3 jours',
      recommended_exams: [
        { name: 'Radiographie thoracique', priority: 'high' },
        { name: 'PCR COVID-19', priority: 'medium' }
      ],
      updated_at: new Date().toISOString()
    })
    .eq('id', existingNote.id)
} else {
  // Create new note
  await supabase
    .from('doctor_notes')
    .insert({
      doctor_profile_id: doctorProfileId,
      patient_profile_id: patientProfileId,
      ai_report_id: aiReportId,
      doctor_diagnosis: 'Pneumonie atypique confirmée',
      doctor_notes: 'Diagnostic cohérent...',
      ai_diagnosis_validated: true,
      prescription_text: 'Azithromycine 500mg/j pendant 3 jours'
    })
}

// Create prescription
await supabase
  .from('prescriptions')
  .insert({
    doctor_profile_id: doctorProfileId,
    patient_profile_id: patientProfileId,
    prescription_text: 'Azithromycine 500mg/j pendant 3 jours',
    prescription_data: {
      medications: [
        {
          name: 'Azithromycine',
          dosage: '500mg',
          frequency: '1 fois par jour',
          duration: '3 jours'
        }
      ]
    }
  })
```

---

## 8. Doctor Collaboration - Load Discussions

**Screen:** `DoctorCollaboration.tsx`

```typescript
// Get all discussions the doctor participates in
const { data: discussions } = await supabase
  .from('discussion_participants')
  .select(`
    *,
    discussions (
      id,
      title,
      status,
      patient_profiles (
        id,
        profiles (
          full_name
        )
      ),
      discussion_messages (
        id,
        message_text,
        created_at,
        doctor_profiles (
          profiles (
            full_name
          )
        )
      )
    )
  `)
  .eq('doctor_profile_id', doctorProfileId)
  .order('discussions.updated_at', { ascending: false })

// Format for UI
const formattedConversations = discussions.map(d => ({
  patient: d.discussions.patient_profiles.profiles.full_name,
  participants: d.discussions.discussion_participants.map(p => 
    p.doctor_profiles.profiles.full_name
  ),
  lastMessage: d.discussions.discussion_messages[0]?.message_text,
  time: formatTimeAgo(d.discussions.discussion_messages[0]?.created_at)
}))

// Send a message in a discussion
await supabase
  .from('discussion_messages')
  .insert({
    discussion_id: discussionId,
    doctor_profile_id: doctorProfileId,
    message_text: 'Je confirme l\'indication de radio thoracique',
    mentions: ['@pneumo'] // Optional mentions
  })
```

---

## 9. Booking - Create Appointment

**Screen:** `BookingSchedule.tsx` → `BookingPayment.tsx`

```typescript
// Step 1: Create appointment
const { data: appointment } = await supabase
  .from('appointments')
  .insert({
    patient_profile_id: patientProfileId,
    doctor_profile_id: doctorProfileId,
    pre_analysis_id: preAnalysisId,
    ai_report_id: aiReportId,
    appointment_type: 'teleconsultation',
    status: 'scheduled',
    scheduled_date: '2025-11-01T16:00:00Z',
    scheduled_time: '16:00:00',
    duration_minutes: 30,
    location_type: 'online',
    price: 45.00,
    payment_status: 'pending',
    report_shared: true,
    report_shared_at: new Date().toISOString()
  })
  .select()
  .single()

// Step 2: Create patient-doctor assignment
await supabase
  .from('patient_doctor_assignments')
  .insert({
    patient_profile_id: patientProfileId,
    doctor_profile_id: doctorProfileId,
    assignment_type: 'appointment',
    ai_report_id: aiReportId
  })

// Step 3: Create timeline event
await supabase
  .from('timeline_events')
  .insert({
    patient_profile_id: patientProfileId,
    event_type: 'appointment',
    event_title: 'Consultation programmée',
    event_description: 'Téléconsultation avec Dr Karim Ayari',
    status: 'active',
    related_appointment_id: appointment.id,
    event_date: '2025-11-01T16:00:00Z'
  })

// Step 4: Update payment status (after payment)
await supabase
  .from('appointments')
  .update({
    payment_status: 'paid',
    payment_method: 'card'
  })
  .eq('id', appointment.id)
```

---

## 10. Patient Timeline - Load Complete Timeline

**Screen:** `PatientTimeline.tsx`

```typescript
const { data: timeline } = await supabase
  .from('timeline_events')
  .select(`
    *,
    related_pre_analysis:pre_analyses!timeline_events_related_pre_analysis_id_fkey (
      id,
      status
    ),
    related_appointment:appointments!timeline_events_related_appointment_id_fkey (
      id,
      appointment_type,
      doctor_profiles (
        profiles (
          full_name
        )
      )
    ),
    related_ai_report:ai_reports!timeline_events_related_ai_report_id_fkey (
      id,
      primary_diagnosis,
      overall_confidence
    )
  `)
  .eq('patient_profile_id', patientProfileId)
  .order('event_date', { ascending: false })

// Format for UI
const formattedTimeline = timeline.map(event => ({
  id: event.id,
  status: event.status,
  title: event.event_title,
  description: event.event_description,
  date: event.event_date,
  details: getEventDetails(event) // Helper function
}))
```

---

## 11. Trigger AI Report Generation (Edge Function)

**After pre-analysis submission:**

```typescript
// Submit pre-analysis
await supabase
  .from('pre_analyses')
  .update({
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    ai_processing_status: 'pending'
  })
  .eq('id', preAnalysisId)

// Trigger AI processing via Edge Function
const { data, error } = await supabase.functions.invoke('generate-ai-report', {
  body: {
    pre_analysis_id: preAnalysisId
  }
})

// The Edge Function will:
// 1. Process text, voice, images, documents
// 2. Generate diagnostic hypotheses
// 3. Create ai_report record
// 4. Create diagnostic_hypotheses records
// 5. Update pre_analysis status
```

---

## 12. Doctor Kanban - Load Cases by Status

**Screen:** `DoctorKanban.tsx`

```typescript
// Get all assigned patients with their latest pre-analysis/report
const { data: assignments } = await supabase
  .from('patient_doctor_assignments')
  .select(`
    patient_profiles (
      id,
      profiles (
        full_name
      )
    ),
    pre_analyses (
      id,
      status,
      ai_reports (
        id,
        primary_diagnosis,
        overall_confidence,
        overall_severity
      )
    ),
    doctor_notes (
      id,
      status
    )
  `)
  .eq('doctor_profile_id', doctorProfileId)

// Group by status (custom logic in application)
const kanbanColumns = {
  'to-see': assignments.filter(a => 
    a.pre_analyses[0]?.status === 'completed' && 
    !a.doctor_notes.length
  ),
  'in-progress': assignments.filter(a => 
    a.pre_analyses[0]?.status === 'in_progress'
  ),
  // ... etc
}
```

---

## Notes

1. **Authentication**: Always get the current user first using `supabase.auth.getUser()`
2. **RLS**: All queries respect Row Level Security policies automatically
3. **Real-time**: Use Supabase Realtime subscriptions for live updates:
   ```typescript
   supabase
     .channel('doctor-dashboard')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'pre_analyses'
     }, (payload) => {
       // Handle new case
     })
     .subscribe()
   ```
4. **Storage**: Use Supabase Storage for file uploads (images, documents, audio)
5. **Edge Functions**: Use for AI processing, report generation, etc.

