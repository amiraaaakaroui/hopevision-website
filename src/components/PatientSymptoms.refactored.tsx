/**
 * PatientSymptoms Component - REFACTORED VERSION
 * Clean Architecture: UI only, all business logic in services
 */

import { Brain, Type, Mic, Image as ImageIcon, Plus, X, Upload, FileText, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Screen } from '../App';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { savePreAnalysis } from '../services/preAnalysisService';
import { uploadImages, uploadDocument, createDocumentRecord } from '../services/storageService';
import { updatePreAnalysis } from '../services/preAnalysisService';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientSymptoms({ onNavigate }: Props) {
  const { currentProfile, isPatient } = useAuth();
  const [textInput, setTextInput] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [voiceTranscriptions, setVoiceTranscriptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  // Use audio recording hook (business logic separated)
  const {
    recording: recordingAudio,
    transcribing: transcribingAudio,
    startRecording,
    stopRecording,
    transcript: latestTranscript,
    error: audioError,
  } = useAudioRecording(currentProfile?.patientProfileId);

  // Update transcriptions when new transcript is available
  useEffect(() => {
    if (latestTranscript) {
      setVoiceTranscriptions(prev => {
        // Avoid duplicates
        if (prev.includes(latestTranscript)) return prev;
        return [...prev, latestTranscript];
      });
      setTextInput(prev => {
        const prefix = prev.trim() ? '\n\n' : '';
        return `${prev}${prefix}[Enregistrement vocal]: ${latestTranscript}`;
      });
    }
  }, [latestTranscript]);

  const chips = [
    '< 24h', '1-3 jours', '5 jours', '> 1 semaine',
    'Légère', 'Modérée', 'Intense',
    'Toux sèche', 'Toux grasse', 'Fièvre', 'Douleur',
    'Essoufflement', 'Fatigue', 'Antécédents'
  ];

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter(c => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  const handleAnalyze = async () => {
    if (!isPatient || !currentProfile?.patientProfileId) {
      alert('Veuillez vous connecter en tant que patient');
      return;
    }

    if (!textInput.trim() && selectedChips.length === 0) {
      alert('Veuillez décrire vos symptômes');
      return;
    }

    setSaving(true);
    try {
      const existingPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');

      // Use service for business logic
      const preAnalysisId = await savePreAnalysis({
        patientProfileId: currentProfile.patientProfileId,
        input: {
          textInput,
          selectedChips,
          imageUrls,
          documentUrls,
          voiceTranscript: voiceTranscriptions.join('\n\n'),
        },
        existingPreAnalysisId: existingPreAnalysisId || undefined,
      });

      sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
      onNavigate('patient-chat-precision');
    } catch (error: any) {
      console.error('Error saving pre-analysis:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Veuillez réessayer.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!isPatient || !currentProfile?.patientProfileId) {
      alert('Veuillez vous connecter en tant que patient');
      return;
    }

    setUploadingImages(true);
    try {
      // Use service for upload logic
      const results = await uploadImages(
        Array.from(files),
        currentProfile.patientProfileId
      );

      const newUrls = results.map(r => r.url);
      const updatedImageUrls = [...imageUrls, ...newUrls];
      setImageUrls(updatedImageUrls);

      // Update pre-analysis if exists
      const existingPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
      if (existingPreAnalysisId) {
        try {
          await updatePreAnalysis({
            preAnalysisId: existingPreAnalysisId,
            patientProfileId: currentProfile.patientProfileId,
            input: { imageUrls: updatedImageUrls },
          });
        } catch (error) {
          console.error('Error updating pre-analysis with image URLs:', error);
          // Don't throw - images are uploaded, just failed to update pre_analysis
        }
      }
    } catch (error: any) {
      alert(`Erreur lors de l'upload: ${error.message}`);
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!isPatient || !currentProfile?.patientProfileId) {
      alert('Veuillez vous connecter en tant que patient');
      return;
    }

    setUploadingDocuments(true);
    try {
      const file = Array.from(files)[0];
      
      // Use service for upload logic
      const result = await uploadDocument(file, currentProfile.patientProfileId);

      const newUrls = [result.url];
      const updatedDocumentUrls = [...documentUrls, ...newUrls];
      setDocumentUrls(updatedDocumentUrls);

      // Create document record
      const existingPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
      try {
        await createDocumentRecord({
          patientProfileId: currentProfile.patientProfileId,
          preAnalysisId: existingPreAnalysisId || undefined,
          fileName: file.name,
          fileUrl: result.url,
          fileType: file.name.split('.').pop() || 'pdf',
          fileSizeBytes: file.size,
        });
      } catch (error) {
        console.error('Error creating document record:', error);
        // Document is uploaded, just metadata insert failed
      }

      // Update pre-analysis if exists
      if (existingPreAnalysisId) {
        try {
          await updatePreAnalysis({
            preAnalysisId: existingPreAnalysisId,
            patientProfileId: currentProfile.patientProfileId,
            input: { documentUrls: updatedDocumentUrls },
          });
        } catch (error) {
          console.error('Error updating pre-analysis with document URLs:', error);
        }
      }
    } catch (error: any) {
      alert(`Erreur lors de l'upload: ${error.message}`);
    } finally {
      setUploadingDocuments(false);
      event.target.value = '';
    }
  };

  const handleVoiceRecording = async () => {
    if (transcribingAudio) return;

    if (!recordingAudio) {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  // UI rendering (no business logic)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-gray-900">HopeVisionAI</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Étape 2 sur 6</span>
            <span className="text-sm text-gray-600">Saisie des symptômes</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Input */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Décrivez vos symptômes</h2>

              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Texte
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voix
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    placeholder="Exemple : Toux sèche depuis 5 jours, fièvre à 38.4°C, légère fatigue..."
                    className="min-h-[200px]"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  <p className="text-sm text-gray-600">
                    Décrivez vos symptômes aussi précisément que possible : durée, intensité, localisation...
                  </p>
                </TabsContent>

                <TabsContent value="voice">
                  <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <button
                      onClick={handleVoiceRecording}
                      disabled={transcribingAudio}
                      className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        recordingAudio ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {transcribingAudio ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Mic className="w-10 h-10 text-white" />
                      )}
                    </button>

                    {recordingAudio && (
                      <motion.div
                        className="flex gap-1 mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-red-600 rounded-full"
                            animate={{
                              height: [20, 40, 20],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </motion.div>
                    )}

                    <p className="text-gray-900 mb-1 font-medium">
                      {recordingAudio
                        ? 'Enregistrement en cours... (Cliquez pour arrêter)'
                        : transcribingAudio
                          ? 'Transcription et ajout au texte...'
                          : 'Appuyez pour enregistrer'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {recordingAudio
                        ? 'Parlez distinctement...'
                        : 'La transcription sera automatiquement ajoutée à votre description.'}
                    </p>

                    {audioError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{audioError}</p>
                      </div>
                    )}

                    {voiceTranscriptions.length > 0 && (
                      <div className="w-full mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-green-700 font-medium">
                            {voiceTranscriptions.length} enregistrement(s) ajouté(s) au texte
                          </p>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {voiceTranscriptions.map((text, idx) => (
                            <p key={idx} className="text-xs text-gray-600 italic border-l-2 border-green-300 pl-2">
                              "{text.substring(0, 100)}{text.length > 100 ? '...' : ''}"
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="image">
                  <div className="space-y-4">
                    <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-900 mb-1">
                        Glissez une image ou cliquez pour parcourir
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Photos de symptômes visibles, documents médicaux, analyses...
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button variant="outline" asChild>
                          <span>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une image
                          </span>
                        </Button>
                      </label>
                    </div>
                    {uploadingImages && (
                      <div className="mt-4 text-center">
                        <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Upload en cours...</p>
                      </div>
                    )}
                    {imageUrls.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600">Images uploadées:</p>
                        <div className="flex flex-wrap gap-2">
                          {imageUrls.map((url, idx) => (
                            <Badge key={idx} variant="outline" className="flex items-center gap-1">
                              Image {idx + 1}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents">
                  <div className="space-y-4">
                    <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-900 mb-1">
                        Importez vos documents médicaux
                      </p>
                      <p className="text-sm text-gray-600 mb-4 text-center">
                        Bilans biologiques, comptes-rendus, ordonnances...<br />
                        PDF, JPG, PNG jusqu'à 10MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="document-upload"
                      />
                      <label htmlFor="document-upload">
                        <Button variant="outline" asChild>
                          <span>
                            <Plus className="w-4 h-4 mr-2" />
                            Parcourir les fichiers
                          </span>
                        </Button>
                      </label>
                    </div>
                    {uploadingDocuments && (
                      <div className="mt-4 text-center">
                        <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Upload en cours...</p>
                      </div>
                    )}
                    {documentUrls.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600">Documents uploadés:</p>
                        {documentUrls.map((url, idx) => (
                          <Badge key={idx} variant="outline" className="flex items-center gap-1">
                            {url.split('/').pop() || `Document ${idx + 1}`}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => setDocumentUrls(documentUrls.filter((_, i) => i !== idx))}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                          L'IA extraira automatiquement les données clés de vos documents
                          (valeurs d'analyses, diagnostics, traitements) pour enrichir votre dossier.
                        </p>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Contextual Chips */}
          <div>
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Précisions rapides</h3>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Badge
                    key={chip}
                    variant={selectedChips.includes(chip) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedChips.includes(chip)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => toggleChip(chip)}
                  >
                    {chip}
                    {selectedChips.includes(chip) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-2">💡 Conseil</h3>
              <p className="text-sm text-gray-700">
                Plus vous êtes précis dans la description de vos symptômes,
                plus l'analyse IA sera pertinente.
              </p>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => onNavigate('patient-consent')}>
            Retour
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleAnalyze}
            disabled={saving || (!textInput.trim() && selectedChips.length === 0)}
          >
            {saving ? 'Enregistrement...' : 'Analyser mes symptômes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

