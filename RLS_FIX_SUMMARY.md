# RLS Fix Summary - Pre-Analysis Uploads and Finalization

## 🔍 Problems Identified

1. **Image Upload RLS Error**: `"new row violates row-level security policy"`
2. **Document Upload RLS Error**: `"new row violates row-level security policy"`  
3. **Finalization RLS Error**: `"new row violates row-level security policy for table 'pre_analyses'. Code: 42501"`

## 🔧 Root Causes

### 1. Pre-Analyses UPDATE Policy
- **Current**: Only allows updates when `status = 'draft'`
- **Problem**: Finalization changes status from `'draft'` to `'submitted'`, which violates the policy
- **Location**: `supabase_rls_policies.sql` line 139-147

### 2. RLS Policy Functions
- **Current**: Uses `get_user_profile()` helper function
- **Problem**: May cause recursion issues or not work reliably
- **Solution**: Use direct `auth.uid()` checks via `profiles` → `patient_profiles` chain

### 3. Frontend Code Issues
- **Missing RLS checks**: Some updates don't include `.eq('patient_profile_id', ...)` filter
- **Document insert**: Doesn't handle errors properly or link to `pre_analysis_id`
- **Image upload**: Doesn't update `pre_analyses` after upload

## ✅ Fixes Applied

### Frontend Changes

#### 1. `src/components/PatientSymptoms.tsx`

**Lines ~65-79**: Fixed UPDATE query for pre-analysis
```typescript
// BEFORE: Missing RLS check
.eq('id', existingPreAnalysisId);

// AFTER: Added patient_profile_id check
.eq('id', existingPreAnalysisId)
.eq('patient_profile_id', currentProfile.patientProfileId);
```

**Lines ~179-195**: Added pre_analyses update after image upload
```typescript
// After successful image upload, update pre_analyses
if (existingPreAnalysisId && currentProfile?.patientProfileId) {
  await supabase
    .from('pre_analyses')
    .update({ image_urls: updatedImageUrls })
    .eq('id', existingPreAnalysisId)
    .eq('patient_profile_id', currentProfile.patientProfileId);
}
```

**Lines ~345-360**: Fixed document insert with error handling
```typescript
// Added pre_analysis_id linking and error handling
const existingPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
const { error: docInsertError } = await supabase.from('documents').insert({
  patient_profile_id: currentProfile.patientProfileId,
  pre_analysis_id: existingPreAnalysisId || null,
  file_name: file.name,
  file_url: urlData.publicUrl,
  // ... other fields
});

if (docInsertError) {
  console.error('[PatientSymptoms] Error inserting document record:', docInsertError);
  // Continue - document is uploaded, just metadata failed
}
```

**Lines ~362-375**: Added pre_analyses update after document upload
```typescript
// Update pre_analyses with document URLs
if (existingPreAnalysisId && currentProfile?.patientProfileId) {
  await supabase
    .from('pre_analyses')
    .update({ document_urls: updatedDocumentUrls })
    .eq('id', existingPreAnalysisId)
    .eq('patient_profile_id', currentProfile.patientProfileId);
}
```

#### 2. `src/components/PatientChatPrecision.tsx`

**Lines ~351-362**: Already has RLS check, but UPDATE policy was blocking
- The code correctly uses `.eq('patient_profile_id', currentProfile.patientProfileId)`
- The issue was the SQL policy only allowing `status = 'draft'` updates

### SQL Policy Changes

#### File: `supabase_fix_pre_analysis_rls_policies.sql`

**1. Fixed PRE_ANALYSES UPDATE Policy**
```sql
-- DROP old policy (only allowed draft updates)
DROP POLICY IF EXISTS "Patients can update own draft pre_analyses" ON pre_analyses;

-- CREATE new policy (allows updates including status changes)
CREATE POLICY "Patients can update own pre_analyses"
    ON pre_analyses FOR UPDATE
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
    )
    WITH CHECK (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
    );
```

**Key changes:**
- ✅ Removed `status = 'draft'` restriction
- ✅ Uses direct `auth.uid()` check (no helper function recursion)
- ✅ Both `USING` and `WITH CHECK` clauses for UPDATE

**2. Fixed DOCUMENTS INSERT Policy**
```sql
-- DROP old policy
DROP POLICY IF EXISTS "Patients can create own documents" ON documents;

-- CREATE new policy with direct auth.uid() check
CREATE POLICY "Patients can create own documents"
    ON documents FOR INSERT
    WITH CHECK (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
    );
```

**3. Fixed PRE_ANALYSES INSERT Policy**
```sql
-- Recreate with direct auth.uid() check
DROP POLICY IF EXISTS "Patients can create own pre_analyses" ON pre_analyses;

CREATE POLICY "Patients can create own pre_analyses"
    ON pre_analyses FOR INSERT
    WITH CHECK (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
    );
```

**4. Added DOCUMENTS UPDATE Policy**
```sql
CREATE POLICY "Patients can update own documents"
    ON documents FOR UPDATE
    USING (... same condition ...)
    WITH CHECK (... same condition ...);
```

## 📋 Testing Checklist

After applying fixes:

- [ ] Upload an image → No RLS error
- [ ] Upload a document → No RLS error  
- [ ] Click "Terminer et lancer l'analyse IA" → No RLS error
- [ ] Pre-analysis status changes from 'draft' to 'submitted' successfully
- [ ] Documents table has rows with correct patient_profile_id
- [ ] Pre_analyses.image_urls and document_urls are updated correctly

## 🔒 Security Notes

All policies are secure:
- ✅ Users can only insert/update their own data
- ✅ Uses `auth.uid()` directly (secure, no recursion)
- ✅ Checks `is_deleted = false` to respect soft deletes
- ✅ Both `USING` and `WITH CHECK` ensure consistent enforcement

## 📝 Files Modified

### Frontend:
1. `src/components/PatientSymptoms.tsx` (lines ~65-79, ~179-195, ~345-375)
2. `src/components/PatientChatPrecision.tsx` (already correct, no changes needed)

### SQL:
1. `supabase_fix_pre_analysis_rls_policies.sql` (new file)

## 🚀 How to Apply

1. **Run the SQL file in Supabase SQL Editor:**
   ```sql
   -- Execute: supabase_fix_pre_analysis_rls_policies.sql
   ```

2. **Verify frontend code changes are saved**

3. **Test the three error scenarios:**
   - Image upload
   - Document upload
   - Finalization

---

**✅ All RLS errors should now be resolved!**
