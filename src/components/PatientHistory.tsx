import { Brain, Calendar, FileText, AlertCircle, Bell, Activity, LogOut, Clock, ArrowRight, Eye, CalendarCheck, Target, Info, FileCheck, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { TimelineEvent, Appointment, PreAnalysis, AIReport, PatientProfile, Profile } from '../types/database';
import { clearAnalysisSession, startNewAnalysis } from '../services/analysisWorkflowService';
import { getRecentPreAnalyses, getPreAnalysisWithReport } from '../services/preAnalysisService';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface TimelineItem {
  date: string;
  displayDate: string;
  type: string;
  title: string;
  doctor: string;
  status: string;
  details: string;
  isPreAnalysis?: boolean;
  preAnalysisId?: string;
  overall_severity?: 'low' | 'medium' | 'high';
}

interface RecentAnalysis {
  id: string;
  status: PreAnalysis['status'];
  created_at: string;
  text_input?: string;
  image_urls?: string[];
  document_urls?: string[];
  voice_transcript?: string;
  selected_chips?: string[];
  primary_diagnosis?: string;
  overall_severity?: 'low' | 'medium' | 'high';
  overall_confidence?: number;
}

export function PatientHistory({ onNavigate }: Props) {
  const { currentProfile, isPatient } = useAuth();
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ consultations: 0, analyses: 0, rappels: 0, preAnalyses: 0 });
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    // CRITICAL: Clear any active analysis session when returning to dashboard
    // This ensures that starting a new analysis doesn't reuse old data
    clearAnalysisSession();

    if (!isPatient || !currentProfile?.patientProfileId) {
      setLoading(false);
      return;
    }

    loadPatientData();
  }, [currentProfile, isPatient]);

  const loadPatientData = async () => {
    if (!currentProfile?.patientProfileId) return;

    try {
      // Load patient profile with profile info
      const { data: patient, error: patientError } = await supabase
        .from('patient_profiles')
        .select(`
          *,
          profiles (
            id,
            full_name,
            date_of_birth
          )
        `)
        .eq('id', currentProfile.patientProfileId)
        .single();

      if (patientError) throw patientError;
      if (patient) {
        setPatientProfile(patient);
        setProfile(patient.profiles as Profile);
      }

      // Load timeline events
      const { data: timelineEvents, error: timelineError } = await supabase
        .from('timeline_events')
        .select(`
          *,
          related_appointment:appointments!timeline_events_related_appointment_id_fkey (
            id,
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
        .eq('patient_profile_id', currentProfile.patientProfileId)
        .order('event_date', { ascending: false })
        .limit(20);

      // CRITICAL: Load ALL recent pre-analyses (draft, submitted, completed, booked)
      // Don't filter by status - show everything so user doesn't lose data
      const analyses = await getRecentPreAnalyses(currentProfile.patientProfileId, 10);
      console.log(`[PatientHistory] Loaded ${analyses.length} pre-analyses (all statuses)`);

      const analysesWithReports = await Promise.all(
        analyses.map(async (analysis) => {
          const withReport = await getPreAnalysisWithReport(analysis.id);
          return {
            id: analysis.id,
            status: analysis.status,
            created_at: analysis.created_at,
            text_input: analysis.text_input,
            image_urls: analysis.image_urls,
            document_urls: analysis.document_urls,
            voice_transcript: analysis.voice_transcript,
            selected_chips: analysis.selected_chips,
            primary_diagnosis: withReport?.ai_reports?.[0]?.primary_diagnosis,
            overall_severity: withReport?.ai_reports?.[0]?.overall_severity,
            overall_confidence: withReport?.ai_reports?.[0]?.overall_confidence,
          } as RecentAnalysis;
        })
      );
      setRecentAnalyses(analysesWithReports);
      console.log(`[PatientHistory] ✅ Prepared ${analysesWithReports.length} analyses for display`);

      // Format timeline events
      const formattedTimeline: TimelineItem[] = [];

      if (!timelineError && timelineEvents) {
        timelineEvents.forEach((event: any) => {
          let title = event.event_title;
          let doctor = '';
          let details = event.event_description || '';

          if (event.event_type === 'appointment' && event.related_appointment) {
            const appt = event.related_appointment;
            if (appt.doctor_profiles?.profiles) {
              doctor = `Dr ${appt.doctor_profiles.profiles.full_name}`;
            }
          } else if (event.event_type === 'ai_report' && event.related_ai_report) {
            const report = event.related_ai_report;
            if (report.primary_diagnosis && report.overall_confidence) {
              details = `Confiance: ${report.overall_confidence}% - ${report.primary_diagnosis}`;
            }
          }

          const eventDate = new Date(event.event_date);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formattedDate = `${eventDate.getDate()} ${months[eventDate.getMonth()]} ${eventDate.getFullYear()}`;

          formattedTimeline.push({
            date: eventDate.toISOString(),
            displayDate: formattedDate,
            type: event.event_type === 'appointment' ? 'consultation' : event.event_type === 'exam' ? 'analysis' : event.event_type,
            title,
            doctor: doctor || 'En attente',
            status: event.status || 'pending',
            details,
            isPreAnalysis: false
          });
        });
      }

      // Add pre-analyses to timeline
      analysesWithReports.forEach((analysis) => {
        const date = new Date(analysis.created_at);
        
        // Résumé intelligent
        let summary = 'Aucun symptôme saisi...';
        const hasText = analysis.text_input && analysis.text_input.trim().length > 0;
        const hasImages = analysis.image_urls && analysis.image_urls.length > 0;
        const hasDocuments = analysis.document_urls && analysis.document_urls.length > 0;
        const hasVoice = analysis.voice_transcript && analysis.voice_transcript.trim().length > 0;
        const hasChips = analysis.selected_chips && analysis.selected_chips.length > 0;
        
        if (hasText) {
          summary = analysis.text_input!.length > 50 
            ? `${analysis.text_input!.substring(0, 50)}...` 
            : analysis.text_input!;
        } else if (hasChips && analysis.selected_chips) {
          summary = analysis.selected_chips.join(', ');
        } else if (hasVoice) {
          summary = analysis.voice_transcript!.length > 50
            ? `${analysis.voice_transcript!.substring(0, 50)}...`
            : analysis.voice_transcript!;
        } else {
          const dataTypes: string[] = [];
          if (hasImages) dataTypes.push(`${analysis.image_urls!.length} image${analysis.image_urls!.length > 1 ? 's' : ''}`);
          if (hasDocuments) dataTypes.push(`${analysis.document_urls!.length} document${analysis.document_urls!.length > 1 ? 's' : ''}`);
          if (hasVoice) dataTypes.push('enregistrement vocal');
          
          if (dataTypes.length > 0) {
            summary = `Analyse ${dataTypes.join(' et ')}`;
          }
        }

        let title = 'Pré-analyse IA';
        let details = summary;
        let status = analysis.status;

        if (analysis.primary_diagnosis) {
          title = `Pré-analyse IA - ${analysis.primary_diagnosis}`;
          if (analysis.overall_confidence) {
            details = `Confiance: ${analysis.overall_confidence}% - ${analysis.primary_diagnosis}`;
            if (analysis.status === 'completed' || analysis.status === 'booked') {
              details += ' - Consultation recommandée';
            } else {
              details += ' - En attente de consultation';
            }
          }
        } else if (analysis.status === 'draft') {
          details = 'En cours de saisie...';
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

        formattedTimeline.push({
          date: date.toISOString(),
          displayDate: formattedDate,
          type: 'pre_analysis',
          title,
          doctor: '',
          status: status === 'completed' ? 'completed' : status === 'draft' ? 'pending' : status === 'booked' ? 'completed' : 'pending',
          details,
          isPreAnalysis: true,
          preAnalysisId: analysis.id,
          overall_severity: analysis.overall_severity
        });
      });

      // Sort by date (most recent first)
      formattedTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTimeline(formattedTimeline);

      // Load appointments for stats
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('patient_profile_id', currentProfile.patientProfileId);

      // Load exam results for stats
      const { data: examResults } = await supabase
        .from('exam_results')
        .select('id')
        .eq('patient_profile_id', currentProfile.patientProfileId);

      // Load pending pre-analyses for rappels
      const { data: pendingPreAnalyses } = await supabase
        .from('pre_analyses')
        .select('id, status')
        .eq('patient_profile_id', currentProfile.patientProfileId)
        .in('status', ['submitted', 'processing']);

      // Count all pre-analyses for stats
      const { data: allPreAnalyses } = await supabase
        .from('pre_analyses')
        .select('id')
        .eq('patient_profile_id', currentProfile.patientProfileId);

      setStats({
        consultations: appointments?.length || 0,
        analyses: examResults?.length || 0,
        rappels: pendingPreAnalyses?.length || 0,
        preAnalyses: allPreAnalyses?.length || 0
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('landing');
  };

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <FileText className="w-5 h-5" />;
      case 'alert': return <Bell className="w-5 h-5" />;
      case 'analysis': return <Activity className="w-5 h-5" />;
      case 'pre_analysis': return <FileText className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-600';
      case 'alert': return 'bg-yellow-100 text-yellow-600';
      case 'analysis': return 'bg-green-100 text-green-600';
      case 'pre_analysis': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'completed': return <Badge className="bg-green-600">Terminé</Badge>;
      case 'reminder': return <Badge variant="outline">Rappel</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">HopeVisionAI</h1>
              <p className="text-xs text-gray-500">Espace Patient</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigate('patient-dashboard')}
              className="bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tableau de bord
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* COLONNE GAUCHE - Profil & Actions rapides */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              {loading ? (
                <div className="text-center py-4">Chargement...</div>
              ) : profile && patientProfile ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-gray-900">{profile.full_name}</h3>
                      <p className="text-gray-600">{getAge(profile.date_of_birth) ? `${getAge(profile.date_of_birth)} ans` : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {patientProfile.blood_group && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Groupe sanguin</span>
                        <span className="text-gray-900">{patientProfile.blood_group}</span>
                      </div>
                    )}
                    {patientProfile.allergies && patientProfile.allergies.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Allergies</span>
                        <span className="text-gray-900">{patientProfile.allergies.join(', ')}</span>
                      </div>
                    )}
                    {timeline.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Dernière visite</span>
                        <span className="text-gray-900">{timeline[0]?.displayDate}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucune donnée disponible</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('signup-patient-step2')}
                  >
                    Compléter mon profil
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                  disabled={isCreatingNew}
                  onClick={async () => {
                    if (!currentProfile?.patientProfileId) {
                      alert('Veuillez vous connecter');
                      return;
                    }

                    setIsCreatingNew(true);
                    try {
                      const newPreAnalysisId = await startNewAnalysis({
                        patientProfileId: currentProfile.patientProfileId,
                      });

                      console.log(`[PatientHistory] ✅ Created new pre-analysis: ${newPreAnalysisId}`);
                      onNavigate('patient-symptoms');
                    } catch (error: any) {
                      console.error('[PatientHistory] Error creating new analysis:', error);
                      alert(`Erreur lors de la création: ${error.message || 'Veuillez réessayer.'}`);
                    } finally {
                      setIsCreatingNew(false);
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isCreatingNew ? 'Création...' : 'Nouvelle pré-analyse'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate('patient-timeline')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Voir ma timeline
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Mes rendez-vous
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Mes analyses
                </Button>
              </div>
            </Card>

            {/* Rappel */}
            {stats.rappels > 0 && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-gray-900 mb-1">Rappel</h3>
                    <p className="text-sm text-gray-700">
                      Vous avez {stats.rappels} pré-analyse{stats.rappels > 1 ? 's' : ''} en attente. Planifiez une consultation.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* COLONNE DROITE - Historique de santé */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-gray-900 mb-2">Historique de santé</h2>
              <p className="text-gray-600">Consultations, analyses et rappels</p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Chargement de l'historique...</div>
            ) : timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <Card key={item.isPreAnalysis ? item.preAnalysisId : index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-gray-900 mb-1">{item.title}</h3>
                            {item.doctor && <p className="text-sm text-gray-600">{item.doctor}</p>}
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{item.details}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {item.displayDate}
                          </div>
                          {item.isPreAnalysis ? (
                            <div className="flex gap-2">
                              {item.status === 'pending' && item.preAnalysisId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    sessionStorage.setItem('currentPreAnalysisId', item.preAnalysisId!);
                                    onNavigate('patient-symptoms');
                                  }}
                                >
                                  Reprendre
                                </Button>
                              )}
                              {(item.status === 'completed' || item.preAnalysisId) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (item.preAnalysisId) {
                                      sessionStorage.setItem('currentPreAnalysisId', item.preAnalysisId);
                                      onNavigate('patient-detailed-report');
                                    }
                                  }}
                                >
                                  Voir détails
                                </Button>
                              )}
                            </div>
                          ) : (
                          <Button variant="ghost" size="sm">
                            Voir détails
                          </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Aucun historique disponible</p>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-8">
              <Card className="p-4 text-center">
                <div className="text-2xl text-blue-600 mb-1">{stats.consultations}</div>
                <div className="text-sm text-gray-600">Consultations</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl text-green-600 mb-1">{stats.analyses}</div>
                <div className="text-sm text-gray-600">Analyses</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl text-purple-600 mb-1">{stats.preAnalyses}</div>
                <div className="text-sm text-gray-600">Pré-analyses</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl text-yellow-600 mb-1">{stats.rappels}</div>
                <div className="text-sm text-gray-600">Rappels actifs</div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}