import { Brain, FileText, Image as ImageIcon, Mic, Activity, CheckCircle, X, Download, Save, ArrowLeft, Upload, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { PatientProfile, Profile, AIReport, DiagnosticHypothesis, PreAnalysis, Document, DoctorNote, ExamResult } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorPatientFile({ onNavigate }: Props) {
  const { currentProfile, isDoctor } = useAuth();
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [hypotheses, setHypotheses] = useState<DiagnosticHypothesis[]>([]);
  const [preAnalysis, setPreAnalysis] = useState<PreAnalysis | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDoctor || !currentProfile?.doctorProfileId) {
      setLoading(false);
      return;
    }

    const patientId = sessionStorage.getItem('selectedPatientProfileId');
    const preAnalysisId = sessionStorage.getItem('selectedPreAnalysisId');
    const aiReportId = sessionStorage.getItem('selectedAiReportId');

    if (patientId) {
      loadPatientData(patientId, preAnalysisId || undefined, aiReportId || undefined);
    } else {
      setLoading(false);
    }
  }, [currentProfile, isDoctor]);

  const loadPatientData = async (patientProfileId: string, preAnalysisId?: string, aiReportId?: string) => {
    try {
      // Load patient profile
      const { data: patient, error: patientError } = await supabase
        .from('patient_profiles')
        .select(`
          *,
          profiles (
            id,
            full_name,
            date_of_birth,
            email
          )
        `)
        .eq('id', patientProfileId)
        .single();

      if (patientError) throw patientError;
      if (patient) {
        setPatientProfile(patient);
        setProfile(patient.profiles as Profile);
      }

      // Load AI report
      if (aiReportId) {
        const { data: report, error: reportError } = await supabase
          .from('ai_reports')
          .select(`
            *,
            diagnostic_hypotheses (*)
          `)
          .eq('id', aiReportId)
          .single();

        if (!reportError && report) {
          setAiReport(report as AIReport);
          setHypotheses((report.diagnostic_hypotheses || []) as DiagnosticHypothesis[]);
        }
      } else if (preAnalysisId) {
        const { data: report, error: reportError } = await supabase
          .from('ai_reports')
          .select(`
            *,
            diagnostic_hypotheses (*)
          `)
          .eq('pre_analysis_id', preAnalysisId)
          .single();

        if (!reportError && report) {
          setAiReport(report as AIReport);
          setHypotheses((report.diagnostic_hypotheses || []) as DiagnosticHypothesis[]);
        }
      }

      // Load pre-analysis
      if (preAnalysisId) {
        const { data: preAnalysisData, error: preAnalysisError } = await supabase
          .from('pre_analyses')
          .select('*')
          .eq('id', preAnalysisId)
          .single();

        if (!preAnalysisError && preAnalysisData) {
          setPreAnalysis(preAnalysisData as PreAnalysis);
        }
      }

      // Load documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_profile_id', patientProfileId)
        .order('uploaded_at', { ascending: false });

      if (docs) setDocuments(docs as Document[]);

      // Load doctor notes
      const { data: notes } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('patient_profile_id', patientProfileId)
        .eq('doctor_profile_id', currentProfile.doctorProfileId)
        .order('created_at', { ascending: false });

      if (notes) setDoctorNotes(notes as DoctorNote[]);

      // Load exam results
      const { data: exams } = await supabase
        .from('exam_results')
        .select('*')
        .eq('patient_profile_id', patientProfileId)
        .order('exam_date', { ascending: false });

      if (exams) setExamResults(exams as ExamResult[]);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !patientProfile || !currentProfile?.doctorProfileId || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('doctor_notes')
        .insert({
          patient_profile_id: patientProfile.id,
          doctor_profile_id: currentProfile.doctorProfileId,
          note_text: noteText,
        });

      if (error) throw error;

      setNoteText('');
      // Reload notes
      const { data: notes } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('patient_profile_id', patientProfile.id)
        .eq('doctor_profile_id', currentProfile.doctorProfileId)
        .order('created_at', { ascending: false });

      if (notes) setDoctorNotes(notes as DoctorNote[]);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Erreur lors de la sauvegarde de la note');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const age = Math.floor((new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('doctor-dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    NB
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-gray-900">{profile?.full_name || 'Patient'}</h1>
                  <p className="text-xs text-gray-500">
                    {calculateAge(profile?.date_of_birth) !== null ? `${calculateAge(profile?.date_of_birth)} ans` : ''} 
                    {patientProfile?.patient_id ? ` • ID: ${patientProfile.patient_id}` : ''}
                  </p>
                </div>
              </div>
              {aiReport && (
                <Badge className={
                  aiReport.overall_severity === 'high' ? 'bg-red-600' :
                  aiReport.overall_severity === 'medium' ? 'bg-yellow-500' :
                  'bg-green-600'
                }>
                  {aiReport.overall_severity === 'high' ? 'Urgence élevée' :
                   aiReport.overall_severity === 'medium' ? 'Consultation recommandée' :
                   'Surveillance'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider diagnostic
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patient Info Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Informations patient</h3>
              <div className="space-y-3 text-sm">
                {calculateAge(profile?.date_of_birth) !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Âge</span>
                    <span className="text-gray-900">{calculateAge(profile?.date_of_birth)} ans</span>
                  </div>
                )}
                {patientProfile?.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sexe</span>
                    <span className="text-gray-900">
                      {patientProfile.gender === 'female' ? 'Féminin' :
                       patientProfile.gender === 'male' ? 'Masculin' :
                       'Autre'}
                    </span>
                  </div>
                )}
                {patientProfile?.blood_group && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Groupe sanguin</span>
                    <span className="text-gray-900">{patientProfile.blood_group}</span>
                  </div>
                )}
                {patientProfile?.allergies && patientProfile.allergies.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allergies</span>
                    <span className="text-gray-900">{patientProfile.allergies.join(', ')}</span>
                  </div>
                )}
                {patientProfile?.weight_kg && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Poids</span>
                    <span className="text-gray-900">{patientProfile.weight_kg} kg</span>
                  </div>
                )}
                {patientProfile?.height_cm && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taille</span>
                    <span className="text-gray-900">{patientProfile.height_cm} cm</span>
                  </div>
                )}
              </div>
            </Card>

            {patientProfile && (patientProfile.medical_history || patientProfile.surgical_history || patientProfile.family_history) && (
              <Card className="p-6">
                <h3 className="text-gray-900 mb-4">Antécédents</h3>
                <div className="space-y-3">
                  {patientProfile.medical_history && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Médicaux</p>
                      <p className="text-sm text-gray-900">{patientProfile.medical_history}</p>
                    </div>
                  )}
                  {patientProfile.surgical_history && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Chirurgicaux</p>
                      <p className="text-sm text-gray-900">{patientProfile.surgical_history}</p>
                    </div>
                  )}
                  {patientProfile.family_history && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Familiaux</p>
                      <p className="text-sm text-gray-900">{patientProfile.family_history}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Analyses récentes</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">CRP</span>
                    <span className="text-red-600">38 mg/L ↑</span>
                  </div>
                  <Progress value={75} className="h-1" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Globules blancs</span>
                    <span className="text-gray-900">11.2 × 10⁹/L</span>
                  </div>
                  <Progress value={60} className="h-1" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Température</span>
                    <span className="text-yellow-600">38.4°C ↑</span>
                  </div>
                  <Progress value={80} className="h-1" />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Tabs defaultValue="fusion">
                <TabsList className="grid w-full grid-cols-7 mb-6">
                  <TabsTrigger value="fusion">Fusion IA</TabsTrigger>
                  <TabsTrigger value="anamnesis">Anamnèse IA</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="explainability">Explicabilité</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
                  <TabsTrigger value="decision">Ma Décision</TabsTrigger>
                  <TabsTrigger value="report">Rapport</TabsTrigger>
                </TabsList>

                <TabsContent value="fusion" className="space-y-6">
                  <div>
                    <h3 className="text-gray-900 mb-4">Résumé multimodal IA</h3>
                    <Card className="p-6 bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gray-900 mb-2">Diagnostic IA suggéré</h4>
                          <p className="text-gray-700 mb-3">
                            {aiReport?.summary || 'Aucun résumé disponible'}
                          </p>
                        </div>
                      </div>
                      {aiReport && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl text-blue-600 mb-1">{aiReport.overall_confidence || 0}%</div>
                            <div className="text-sm text-gray-600">Confiance globale</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl text-green-600 mb-1">
                              {[preAnalysis?.text_input, preAnalysis?.voice_transcript, preAnalysis?.image_urls?.length].filter(Boolean).length}
                            </div>
                            <div className="text-sm text-gray-600">Sources de données</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl mb-1 ${
                              aiReport.overall_severity === 'high' ? 'text-red-600' :
                              aiReport.overall_severity === 'medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {aiReport.overall_severity === 'high' ? 'Élevé' :
                               aiReport.overall_severity === 'medium' ? 'Modéré' :
                               'Faible'}
                            </div>
                            <div className="text-sm text-gray-600">Niveau de gravité</div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-gray-900 mb-4">Hypothèses diagnostiques</h3>

                    <div className="space-y-3">
                      {hypotheses.length > 0 ? (

                        hypotheses.map((hypothesis, i) => (
                          <Card key={i} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-gray-900">{hypothesis.disease_name}</h4>
                              <span className="text-blue-600">{hypothesis.confidence}%</span>
                            </div>

                            {/* Correction ici */}
                            <Progress value={hypothesis.confidence} />
                          </Card>
                        ))

                      ) : (
                        <p className="text-gray-500 text-sm">
                          Aucune hypothèse diagnostique disponible.
                        </p>
                      )}
                    </div>
                  </div>

                </TabsContent>

                <TabsContent value="anamnesis" className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-900">Anamnèse assistée par IA</h3>
                      <Button 
                        onClick={() => onNavigate('doctor-anamnesis-ai')}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Lancer questionnaire IA
                      </Button>
                    </div>
                    <Card className="p-6 bg-indigo-50 border-indigo-200">
                      <div className="flex items-start gap-3 mb-4">
                        <Brain className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                        <div>
                          <h4 className="text-gray-900 mb-2">Questionnaire intelligent adaptatif</h4>
                          <p className="text-sm text-gray-700 mb-4">
                            L'IA pose des questions ciblées en fonction des symptômes déjà saisis 
                            pour affiner le diagnostic et écarter progressivement les hypothèses peu probables.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Questions dynamiques</span>
                              <p className="text-gray-900">Adaptées au contexte</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Hypothèses écartées</span>
                              <p className="text-gray-900">Explications fournies</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => onNavigate('doctor-anamnesis-consolidation')}
                      >
                        Voir la consolidation de l'anamnèse
                      </Button>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-gray-900 mb-4">Questions au patient</h3>
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          <span className="text-gray-900">Chat de précision</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onNavigate('doctor-chat-relay')}
                        >
                          Poser une question au patient
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Demandez des précisions au patient en temps réel. Les réponses seront automatiquement 
                        intégrées au dossier et analysées par l'IA.
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-900">Documents médicaux importés</h3>
                      <Button size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Importer un document
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Example imported document */}
                      <Card className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-gray-900">Bilan sanguin complet.pdf</h4>
                              <Badge className="bg-green-600">Analysé</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">Importé le 29 Octobre 2025</p>
                            
                            <Card className="p-4 bg-yellow-50 border-yellow-200">
                              <div className="flex items-start gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <h4 className="text-sm text-gray-900">Données extraites automatiquement</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">CRP:</span>
                                  <span className="text-red-600 ml-2">38 mg/L ↑</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Globules blancs:</span>
                                  <span className="text-gray-900 ml-2">11.2 × 10⁹/L</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Hémoglobine:</span>
                                  <span className="text-gray-900 ml-2">13.5 g/dL</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Plaquettes:</span>
                                  <span className="text-gray-900 ml-2">245 × 10⁹/L</span>
                                </div>
                              </div>
                            </Card>
                          </div>
                        </div>
                      </Card>

                      {/* Empty state for more documents */}
                      <Card className="p-8 bg-gray-50 border-dashed border-2 border-gray-300">
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 mb-2">Glissez-déposez des documents ici</p>
                          <p className="text-sm text-gray-500">PDF, JPG, PNG jusqu'à 10MB</p>
                          <Button variant="outline" size="sm" className="mt-4">
                            Parcourir les fichiers
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="explainability" className="space-y-6">
                  <div>
                    <h3 className="text-gray-900 mb-4">Analyse textuelle</h3>
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-900">Symptômes décrits par le patient</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        <span className="bg-yellow-200 px-1">Toux sèche</span> depuis{' '}
                        <span className="bg-yellow-200 px-1">5 jours</span>, accompagnée d'une{' '}
                        <span className="bg-red-200 px-1">fièvre à 38.4°C</span> et d'une{' '}
                        <span className="bg-yellow-200 px-1">légère fatigue</span>. J'ai remarqué un{' '}
                        <span className="bg-red-200 px-1">léger essoufflement</span> lors de mes 
                        activités quotidiennes.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Badge variant="outline" className="bg-yellow-50">Symptômes clés</Badge>
                        <Badge variant="outline" className="bg-red-50">Signaux d'alerte</Badge>
                      </div>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-gray-900 mb-4">Analyse vocale</h3>
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Mic className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-900">Pattern vocal détecté</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl mb-1">68%</div>
                          <div className="text-sm text-gray-600">Essoufflement</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl mb-1">92%</div>
                          <div className="text-sm text-gray-600">Clarté vocale</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl mb-1">Normal</div>
                          <div className="text-sm text-gray-600">Tonalité</div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-gray-900 mb-4">Analyse d'image (si disponible)</h3>
                    <Card className="p-6 bg-gray-50">
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">Aucune image médicale fournie</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-6">
                  <div>
                    <h3 className="text-gray-900 mb-4">Examens complémentaires suggérés</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Radiographie thoracique', priority: 'high', reason: 'Confirmer pneumonie' },
                        { name: 'PCR COVID-19', priority: 'medium', reason: 'Écarter COVID-19' },
                        { name: 'Hémoculture', priority: 'medium', reason: 'Identifier agent pathogène' },
                        { name: 'Gaz du sang', priority: 'low', reason: 'Évaluer fonction respiratoire' }
                      ].map((exam, i) => (
                        <Card key={i} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" className="w-5 h-5 rounded" />
                            <div>
                              <p className="text-gray-900">{exam.name}</p>
                              <p className="text-sm text-gray-600">{exam.reason}</p>
                            </div>
                          </div>
                          <Badge className={exam.priority === 'high' ? 'bg-red-600' : exam.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'}>
                            {exam.priority === 'high' ? 'Prioritaire' : exam.priority === 'medium' ? 'Recommandé' : 'Optionnel'}
                          </Badge>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-gray-900 mb-4">Traitements suggérés</h3>
                    <Card className="p-6 bg-green-50 border-green-200">
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-900">Antibiothérapie empirique</p>
                            <p className="text-sm text-gray-600">Azithromycine 500mg/j pendant 3 jours</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-900">Antipyrétique</p>
                            <p className="text-sm text-gray-600">Paracétamol 1g toutes les 6h si fièvre</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-900">Hydratation et repos</p>
                            <p className="text-sm text-gray-600">Boire minimum 2L d'eau par jour</p>
                          </div>
                        </li>
                      </ul>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="decision" className="space-y-6">
                  <div>
                    <h3 className="text-gray-900 mb-4">Votre diagnostic médical</h3>
                    <Card className="p-6">
                      <Textarea 
                        placeholder="Saisir votre diagnostic et observations cliniques..."
                        className="min-h-[150px] mb-4"
                      />
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                          <X className="w-4 h-4 mr-2" />
                          Modifier le diagnostic IA
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Valider le diagnostic IA
                        </Button>
                      </div>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-gray-900 mb-4">Prescription</h3>
                    <Card className="p-6">
                      <Textarea 
                        placeholder="Saisir l'ordonnance..."
                        className="min-h-[200px]"
                      />
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="report" className="space-y-6">
                  <Card className="p-8 bg-white">
                    <div className="text-center mb-6">
                      <h2 className="text-gray-900 mb-2">Rapport de Consultation Médical</h2>
                      <p className="text-gray-600">HopeVisionAI - 31 Octobre 2025</p>
                    </div>
                    
                    <div className="space-y-6 text-sm">
                      <div>
                        <h3 className="text-gray-900 mb-2">Patient</h3>
                        <p className="text-gray-700">Nadia Ben Salem, 34 ans</p>
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-2">Médecin</h3>
                        <p className="text-gray-700">Dr Karim Ayari - Médecine Générale</p>
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-2">Diagnostic IA</h3>
                        <p className="text-gray-700">Pneumonie atypique (confiance: 71%)</p>
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-2">Diagnostic médical</h3>
                        <p className="text-gray-700 italic">[À compléter par le médecin]</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Signature numérique</p>
                          <p className="text-gray-900">Dr Karim Ayari</p>
                        </div>
                        <Button>
                          <Save className="w-4 h-4 mr-2" />
                          Signer et finaliser
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}