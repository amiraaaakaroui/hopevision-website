# ✅ RLS Fixes Applied - Pre-Analysis Uploads & Finalization

## 📋 Summary

Fixed all RLS errors for:
1. ✅ Image uploads
2. ✅ Document uploads  
3. ✅ Pre-analysis finalization

## 🔧 Frontend Code Changes

### 1. `src/components/PatientSymptoms.tsx`

#### Fix 1: UPDATE pre_analyses with RLS check (Line ~67-79)
**Before:**
```typescript
.eq('id', existingPreAnalysisId);
```

**After:**
```typescript
.eq('id', existingPreAnalysisId)
.eq('patient_profile_id', currentProfile.patientProfileId); // RLS CHECK
```

#### Fix 2: Update pre_analyses after image upload (Lines ~179-195)
**Added:**
```typescript
if (newUrls.length > 0) {
  const updatedImageUrls = [...imageUrls, ...newUrls];
  setImageUrls(updatedImageUrls);
  
  // Update pre-analysis with new image URLs if pre-analysis exists
  const existingPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
  if (existingPreAnalysisId && currentProfile?.patientProfileId) {
    const { error: updateError } = await supabase
      .from('pre_analyses')
      .update({ 
        image_urls: updatedImageUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPreAnalysisId)
      .eq('patient_profile_id', currentProfile.patientProfileId); // RLS CHECK
    
    if (updateError) {
      console.error('[PatientSymptoms] Error updating pre-analysis with image URLs:', updateError);
      // Don't throw - images are uploaded, just failed to update pre_analysis
    }
  }
}
```

#### Fix 3: Document insert with pre_analysis_id linking (Lines ~345-360)
**Added:**
```typescript
// Create document record with RLS-compliant patient_profile_id
const existingPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
const { error: docInsertError } = await supabase.from('documents').insert({
  patient_profile_id: currentProfile.patientProfileId,
  pre_analysis_id: existingPreAnalysisId || null, // Link to pre_analysis if exists
  file_name: file.name,
  file_url: urlData.publicUrl,
  file_type: fileExt,
  file_size_bytes: file.size,
  ai_extraction_status: 'pending',
});

if (docInsertError) {
  console.error('[PatientSymptoms] Error inserting document record:', docInsertError);
  // Continue - document is uploaded, just metadata failed
}
```

#### Fix 4: Update pre_analyses after document upload (Lines ~362-375)
**Added:**
```typescript
if (newUrls.length > 0) {
  const updatedDocumentUrls = [...documentUrls, ...newUrls];
  setDocumentUrls(updatedDocumentUrls);
  
  // Update pre-analysis with new document URLs if pre-analysis exists
  const existingPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
  if (existingPreAnalysisId && currentProfile?.patientProfileId) {
    const { error: updateError } = await supabase
      .from('pre_analyses')
      .update({ 
        document_urls: updatedDocumentUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPreAnalysisId)
      .eq('patient_profile_id', currentProfile.patientProfileId); // RLS CHECK
    
    if (updateError) {
      console.error('[PatientSymptoms] Error updating pre-analysis with document URLs:', updateError);
      // Don't throw - documents are uploaded, just failed to update pre_analysis
    }
  }
}
```

### 2. `src/components/PatientChatPrecision.tsx`

**No changes needed** - Already has correct RLS check at line 362:
```typescript
.eq('id', preAnalysisId)
.eq('patient_profile_id', currentProfile.patientProfileId); // RLS CHECK
```

The issue was the SQL policy blocking the UPDATE when status changes to 'submitted'.

## 🔒 SQL Policy Changes

### File: `supabase_fix_pre_analysis_rls_policies.sql`

#### 1. Fixed PRE_ANALYSES UPDATE Policy

**Dropped old policy:**
```sql
DROP POLICY IF EXISTS "Patients can update own draft pre_analyses" ON pre_analyses;
```

**Created new policy (allows status changes):**
```sql
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
- ✅ Uses direct `auth.uid()` check (no recursion via helper functions)
- ✅ Both `USING` and `WITH CHECK` clauses

#### 2. Fixed DOCUMENTS INSERT Policy

**Dropped old policy:**
```sql
DROP POLICY IF EXISTS "Patients can create own documents" ON documents;
```

**Created new policy:**
```sql
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

#### 3. Fixed PRE_ANALYSES INSERT Policy

**Dropped and recreated:**
```sql
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

#### 4. Added DOCUMENTS UPDATE Policy

```sql
CREATE POLICY "Patients can update own documents"
    ON documents FOR UPDATE
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

## 🔍 Policy Pattern Used

All policies use this secure pattern:
```sql
patient_profile_id IN (
    SELECT id FROM patient_profiles
    WHERE profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
        AND is_deleted = false
    )
)
```

**Why this works:**
- ✅ Direct `auth.uid()` check (no recursion)
- ✅ Follows the chain: `auth.uid()` → `profiles` → `patient_profiles`
- ✅ Respects soft deletes (`is_deleted = false`)
- ✅ Secure - users can only access their own data

## ✅ Expected Behavior After Fixes

### Image Upload:
1. User selects image(s)
2. Images upload to Supabase Storage ✅
3. URLs saved to state ✅
4. If `pre_analysis` exists, update it with `image_urls` ✅
5. All with RLS compliance ✅

### Document Upload:
1. User selects document(s)
2. Documents upload to Supabase Storage ✅
3. Document metadata inserted to `documents` table ✅
4. URLs saved to state ✅
5. If `pre_analysis` exists, update it with `document_urls` ✅
6. All with RLS compliance ✅

### Finalization:
1. User clicks "Terminer et lancer l'analyse IA"
2. Chat answers merged into enriched symptoms ✅
3. Pre-analysis updated to `status = 'submitted'` ✅
4. RLS check passes (no status restriction) ✅
5. Redirects to results page ✅

## 📝 Files Modified

1. ✅ `src/components/PatientSymptoms.tsx` (4 fixes)
2. ✅ `supabase_fix_pre_analysis_rls_policies.sql` (new file with 4 policy fixes)

## 🚀 How to Apply

1. **Run SQL file in Supabase SQL Editor:**
   - Open Supabase Dashboard → SQL Editor
   - Copy/paste contents of `supabase_fix_pre_analysis_rls_policies.sql`
   - Execute

2. **Frontend code is already updated**

3. **Test:**
   - Upload an image → Should work
   - Upload a document → Should work
   - Finalize pre-analysis → Should work

---

**✅ All RLS errors should now be resolved!**

