import { ArrowLeft, CheckCircle, Clock, FileText, Calendar, Activity, Download, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { TimelineEvent, AIReport, Appointment, PatientProfile, Profile } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface TimelineItem {
  id: string;
  status: 'completed' | 'active' | 'pending';
  title: string;
  description: string;
  date: string;
  time: string;
  details: string[];
  icon: typeof Activity;
  color: string;
  eventType?: string;
}

export function PatientTimeline({ onNavigate }: Props) {
  const { currentProfile, isPatient } = useAuth();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [caseSummary, setCaseSummary] = useState<any>(null);
  const [stats, setStats] = useState({ consultations: 0, exams: 0, documents: 0 });

  useEffect(() => {
    if (!isPatient || !currentProfile?.patientProfileId) {
      setLoading(false);
      return;
    }

    loadTimelineData();
  }, [currentProfile, isPatient]);

  const loadTimelineData = async () => {
    if (!currentProfile?.patientProfileId) return;

    try {
      // Load patient profile
      const { data: patient, error: patientError } = await supabase
        .from('patient_profiles')
        .select(`
          *,
          profiles (
            id,
            full_name,
            patient_id
          )
        `)
        .eq('id', currentProfile.patientProfileId)
        .single();

      if (!patientError && patient) {
        setPatientProfile(patient);
        setProfile(patient.profiles as Profile);
      }

      // Load timeline events with related entities
      const { data: events, error: eventsError } = await supabase
        .from('timeline_events')
        .select(`
          *,
          related_appointment:appointments!timeline_events_related_appointment_id_fkey (
            id,
            appointment_type,
            scheduled_date,
            scheduled_time,
            duration_minutes,
            doctor_profiles (
              profiles (
                full_name
              )
            )
          ),
          related_ai_report:ai_reports!timeline_events_related_ai_report_id_fkey (
            id,
            primary_diagnosis,
            overall_confidence,
            overall_severity
          ),
          related_pre_analysis:pre_analyses!timeline_events_related_pre_analysis_id_fkey (
            id,
            status
          )
        `)
        .eq('patient_profile_id', currentProfile.patientProfileId)
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;

      if (events) {
        const formattedTimeline: TimelineItem[] = events.map((event: any) => {
          let details: string[] = [];
          let description = event.event_description || '';

          // Build details based on event type and related entities
          if (event.event_type === 'appointment' && event.related_appointment) {
            const appt = event.related_appointment;
            const doctorName = appt.doctor_profiles?.profiles?.full_name || 'Médecin';
            details = [
              `Praticien: ${doctorName}`,
              `Type: ${appt.appointment_type === 'teleconsultation' ? 'Téléconsultation' : 'Consultation en présentiel'}`,
              `Durée: ${appt.duration_minutes || 30} min`,
              appt.report_shared ? 'Rapport partagé avec le médecin' : ''
            ].filter(Boolean);
          } else if (event.event_type === 'ai_report' && event.related_ai_report) {
            const report = event.related_ai_report;
            if (report.primary_diagnosis && report.overall_confidence) {
              details = [
                `Diagnostic: ${report.primary_diagnosis}`,
                `Confiance: ${report.overall_confidence}%`,
                'Explications XAI disponibles',
                'Plan d\'action défini'
              ];
            }
          } else if (event.event_type === 'pre_analysis' && event.related_pre_analysis) {
            details = [
              'Symptômes saisis et analysés',
              'Analyse multimodale en cours',
              'Traitement par IA'
            ];
          } else if (event.event_type === 'exam') {
            details = [
              'Examens complémentaires prescrits',
              'En attente de résultats'
            ];
          }

          const eventDate = new Date(event.event_date);
          const dateStr = eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          // Determine icon based on event type
          let IconComponent = Activity;
          if (event.event_type === 'appointment') IconComponent = Calendar;
          else if (event.event_type === 'ai_report' || event.event_type === 'doctor_note') IconComponent = FileText;
          else if (event.event_type === 'exam') IconComponent = Activity;

          return {
            id: event.id,
            status: (event.status || 'pending') as 'completed' | 'active' | 'pending',
            title: event.event_title,
            description: description || event.event_title,
            date: dateStr,
            time: timeStr,
            details: details.length > 0 ? details : [description],
            icon: IconComponent,
            color: event.status === 'completed' ? 'green' : event.status === 'active' ? 'blue' : 'gray',
            eventType: event.event_type
          };
        });

        setTimeline(formattedTimeline);

        // Load latest AI report for case summary
        const { data: latestReport } = await supabase
          .from('ai_reports')
          .select('*')
          .eq('patient_profile_id', currentProfile.patientProfileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestReport) {
          setCaseSummary({
            diagnosis: latestReport.primary_diagnosis || 'En attente',
            confidence: latestReport.overall_confidence || 0,
            severity: latestReport.overall_severity || 'medium'
          });
        }

        // Load stats
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_profile_id', currentProfile.patientProfileId);

        const { data: exams } = await supabase
          .from('exam_results')
          .select('id')
          .eq('patient_profile_id', currentProfile.patientProfileId);

        const { data: documents } = await supabase
          .from('documents')
          .select('id')
          .eq('patient_profile_id', currentProfile.patientProfileId);

        setStats({
          consultations: appointments?.length || 0,
          exams: exams?.length || 0,
          documents: documents?.length || 0
        });
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const completedSteps = timeline.filter(t => t.status === 'completed').length;
  const totalSteps = timeline.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const activeEvent = timeline.find(t => t.status === 'active');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'active':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'pending':
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'active': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50';
    }
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
                onClick={() => onNavigate('patient-history')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-gray-900">Timeline de prise en charge</h1>
                  <p className="text-xs text-gray-500">
                    {profile?.full_name || 'Patient'} {patientProfile?.patient_id ? `• ID: ${patientProfile.patient_id}` : ''}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter la timeline
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Chargement de la timeline...</p>
              </Card>
            ) : timeline.length > 0 ? (
              <>
                <Card className="p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-gray-900">Progression globale</h2>
                    <span className="text-blue-600">{completedSteps}/{totalSteps} étapes</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </Card>

                <div className="space-y-6">
                  {timeline.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Connecting Line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-[23px] top-[60px] w-0.5 h-full bg-gray-200"></div>
                  )}
                  
                  <Card className={`p-6 ${getStatusColor(item.status)}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.status === 'completed' 
                          ? 'bg-green-100' 
                          : item.status === 'active'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-gray-900 mb-1">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <Badge className={
                            item.status === 'completed' 
                              ? 'bg-green-600' 
                              : item.status === 'active'
                              ? 'bg-blue-600'
                              : 'bg-gray-400'
                          }>
                            {item.status === 'completed' ? 'Terminé' : item.status === 'active' ? 'En cours' : 'À venir'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {item.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.time}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {item.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              {item.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full m-1"></div>
                                </div>
                              )}
                              <p className="text-sm text-gray-700">{detail}</p>
                            </div>
                          ))}
                        </div>

                        {item.status === 'active' && (
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <Button 
                              size="sm"
                              onClick={() => onNavigate('booking-service-selection')}
                            >
                              Gérer la consultation
                            </Button>
                          </div>
                        )}

                        {item.status === 'pending' && item.id === 5 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate('booking-service-selection')}
                            >
                              Réserver les examens
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Aucun événement dans la timeline</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {caseSummary && (
              <Card className="p-6">
                <h3 className="text-gray-900 mb-4">Résumé du cas</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diagnostic</span>
                    <span className="text-gray-900">{caseSummary.diagnosis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confiance IA</span>
                    <span className="text-blue-600">{caseSummary.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gravité</span>
                    <Badge className={
                      caseSummary.severity === 'high' ? 'bg-red-600' :
                      caseSummary.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-green-600'
                    }>
                      {caseSummary.severity === 'high' ? 'Élevée' :
                       caseSummary.severity === 'medium' ? 'Modérée' :
                       'Faible'}
                    </Badge>
                  </div>
                </div>
              </Card>
            )}

            {activeEvent && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-gray-900 mb-3">Étape actuelle</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <activeEvent.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900">{activeEvent.title}</p>
                    <p className="text-sm text-gray-600">{activeEvent.date} à {activeEvent.time}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{activeEvent.description}</p>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3 text-sm">
                {timeline.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Événements</span>
                    <span className="text-gray-900">{timeline.length} au total</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultations</span>
                  <span className="text-gray-900">{stats.consultations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Examens</span>
                  <span className="text-gray-900">{stats.exams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="text-gray-900">{stats.documents}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-gray-900 mb-3">Actions requises</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>Préparer les questions pour la consultation</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>Réserver les examens complémentaires</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>Vérifier la connexion internet</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
