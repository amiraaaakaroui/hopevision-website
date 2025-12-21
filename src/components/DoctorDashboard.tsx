import { Brain, Filter, Search, AlertCircle, FileText, Image as ImageIcon, Mic, User, Clock, LogOut, Users, LayoutGrid } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { PatientProfile, Profile, PreAnalysis, AIReport, DoctorProfile } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface CaseItem {
  patient: string;
  age: number | null;
  severity: 'low' | 'medium' | 'high' | undefined;
  aiDiagnosis: string;
  confidence: number;
  dataTypes: string[];
  status: string;
  time: string;
  patientProfileId: string;
  preAnalysisId?: string;
  aiReportId?: string;
}

export function DoctorDashboard({ onNavigate }: Props) {
  const { currentProfile, isDoctor } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    urgent: 0,
    treatedToday: 0,
    avgTime: '0m'
  });
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    if (!isDoctor || !currentProfile?.doctorProfileId) {
      setLoading(false);
      return;
    }

    loadDashboardData();
  }, [currentProfile, isDoctor]);

  const loadDashboardData = async () => {
    if (!currentProfile?.doctorProfileId) return;

    try {
      // Load doctor profile
      const { data: doctor, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select(`
          *,
          profiles (
            id,
            full_name
          )
        `)
        .eq('id', currentProfile.doctorProfileId)
        .single();

      if (!doctorError && doctor) {
        setDoctorProfile(doctor);
        setProfile(doctor.profiles as Profile);
      }

      // Load assigned patients with their latest pre-analyses and AI reports
      const { data: assignments, error: assignmentsError } = await supabase
        .from('patient_doctor_assignments')
        .select(`
          patient_profiles (
            id,
            profiles (
              id,
              full_name,
              date_of_birth
            )
          ),
          pre_analyses (
            id,
            status,
            text_input,
            image_urls,
            document_urls,
            voice_transcript,
            created_at,
            ai_reports (
              id,
              primary_diagnosis,
              overall_confidence,
              overall_severity,
              created_at
            )
          )
        `)
        .eq('doctor_profile_id', currentProfile.doctorProfileId)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (assignments) {
        const formattedCases: CaseItem[] = [];
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        assignments.forEach((assignment: any) => {
          const patient = assignment.patient_profiles;
          if (!patient) return;

          const preAnalyses = assignment.pre_analyses || [];
          const latestPreAnalysis = preAnalyses
            .filter((pa: any) => pa.status === 'completed' || pa.status === 'submitted')
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          if (!latestPreAnalysis) return;

          const aiReport = latestPreAnalysis.ai_reports?.[0];
          if (!aiReport) return;

          // Calculate age
          const dob = patient.profiles?.date_of_birth;
          const age = dob ? Math.floor((now.getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

          // Determine data types
          const dataTypes: string[] = [];
          if (latestPreAnalysis.text_input) dataTypes.push('text');
          if (latestPreAnalysis.voice_transcript) dataTypes.push('voice');
          if (latestPreAnalysis.image_urls && latestPreAnalysis.image_urls.length > 0) dataTypes.push('image');
          if (latestPreAnalysis.document_urls && latestPreAnalysis.document_urls.length > 0) dataTypes.push('documents');

          // Determine status
          let status = 'new';
          const reportAge = now.getTime() - new Date(aiReport.created_at).getTime();
          const minutesAgo = Math.floor(reportAge / (1000 * 60));
          
          if (minutesAgo < 30) status = 'new';
          else if (aiReport.overall_severity === 'high') status = 'urgent';
          else status = 'pending';

          // Format time ago
          let timeStr = '';
          if (minutesAgo < 60) {
            timeStr = `Il y a ${minutesAgo} min`;
          } else if (minutesAgo < 1440) {
            const hoursAgo = Math.floor(minutesAgo / 60);
            timeStr = `Il y a ${hoursAgo}h`;
          } else {
            const daysAgo = Math.floor(minutesAgo / 1440);
            timeStr = `Il y a ${daysAgo}j`;
          }

          formattedCases.push({
            patient: patient.profiles?.full_name || 'Patient inconnu',
            age,
            severity: aiReport.overall_severity,
            aiDiagnosis: aiReport.primary_diagnosis || 'En attente',
            confidence: aiReport.overall_confidence || 0,
            dataTypes,
            status,
            time: timeStr,
            patientProfileId: patient.id,
            preAnalysisId: latestPreAnalysis.id,
            aiReportId: aiReport.id
          });
        });

        setCases(formattedCases);

        // Calculate stats
        const pendingCount = formattedCases.filter(c => c.status === 'pending' || c.status === 'new').length;
        const urgentCount = formattedCases.filter(c => c.severity === 'high').length;

        // Count treated today (appointments completed today)
        const { data: todayAppointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('doctor_profile_id', currentProfile.doctorProfileId)
          .eq('status', 'completed')
          .gte('completed_at', todayStart.toISOString());

        setStats({
          pending: pendingCount,
          urgent: urgentCount,
          treatedToday: todayAppointments?.length || 0,
          avgTime: '18m' // TODO: Calculate from actual appointment durations
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('landing');
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = !searchQuery || 
      c.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aiDiagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'urgent': return <Badge className="bg-red-600">Urgent</Badge>;
      case 'new': return <Badge className="bg-blue-600">Nouveau</Badge>;
      case 'pending': return <Badge variant="outline">En attente</Badge>;
      default: return null;
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">HopeVisionAI</h1>
                <p className="text-xs text-gray-500">Espace Médecin</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">{profile?.full_name || 'Médecin'}</p>
                  <p className="text-xs text-gray-500">{doctorProfile?.specialty || ''}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-6">
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
              Cas entrants
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('doctor-collaboration')}
            >
              Collaboration
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('doctor-audit')}
            >
              Journal d'activité
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">Tableau de bord</h2>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate('doctor-kanban')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Vue Kanban
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate('doctor-patient-management')}
            >
              <Users className="w-4 h-4 mr-2" />
              Gestion patients
            </Button>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cas en attente</p>
                  <p className="text-3xl text-gray-900">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cas urgents</p>
                  <p className="text-3xl text-red-600">{stats.urgent}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Traités aujourd'hui</p>
                  <p className="text-3xl text-green-600">{stats.treatedToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Temps moyen</p>
                  <p className="text-3xl text-gray-900">{stats.avgTime}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="Rechercher un patient, diagnostic..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes urgences</SelectItem>
                <SelectItem value="high">Urgence élevée</SelectItem>
                <SelectItem value="medium">Modéré</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Plus de filtres
            </Button>
          </div>
        </Card>

        {/* Cases Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Diagnostic IA</TableHead>
                <TableHead>Confiance</TableHead>
                <TableHead>Données</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Temps</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Chargement des cas...
                  </TableCell>
                </TableRow>
              ) : filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucun cas trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((caseItem, index) => (
                  <TableRow 
                    key={index} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (caseItem.patientProfileId) {
                        sessionStorage.setItem('selectedPatientProfileId', caseItem.patientProfileId);
                        if (caseItem.preAnalysisId) {
                          sessionStorage.setItem('selectedPreAnalysisId', caseItem.preAnalysisId);
                        }
                        if (caseItem.aiReportId) {
                          sessionStorage.setItem('selectedAiReportId', caseItem.aiReportId);
                        }
                      }
                      onNavigate('doctor-patient-file');
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-gray-100">
                            {getInitials(caseItem.patient)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-gray-900">{caseItem.patient}</p>
                          {caseItem.age !== null && (
                            <p className="text-sm text-gray-500">{caseItem.age} ans</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {caseItem.severity && (
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(caseItem.severity)}`}></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-900">{caseItem.aiDiagnosis}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full" 
                            style={{ width: `${caseItem.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{caseItem.confidence}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {caseItem.dataTypes.map((type, i) => (
                          <div key={i} className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                            {getDataTypeIcon(type)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(caseItem.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {caseItem.time}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (caseItem.patientProfileId) {
                            sessionStorage.setItem('selectedPatientProfileId', caseItem.patientProfileId);
                            if (caseItem.preAnalysisId) {
                              sessionStorage.setItem('selectedPreAnalysisId', caseItem.preAnalysisId);
                            }
                            if (caseItem.aiReportId) {
                              sessionStorage.setItem('selectedAiReportId', caseItem.aiReportId);
                            }
                          }
                          onNavigate('doctor-patient-file');
                        }}
                      >
                        Ouvrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}