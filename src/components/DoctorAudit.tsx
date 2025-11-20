import { Brain, Calendar, CheckCircle, X, Edit, LogOut, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorAudit({ onNavigate }: Props) {
  const auditLogs = [
    {
      date: '31 Oct 2025 14:30',
      patient: 'Nadia Ben Salem',
      action: 'Validation diagnostic',
      aiDiagnosis: 'Pneumonie atypique',
      doctorDecision: 'Validé (concordant)',
      user: 'Dr Karim Ayari',
      status: 'validated'
    },
    {
      date: '31 Oct 2025 13:15',
      patient: 'Ahmed Mansour',
      action: 'Modification diagnostic',
      aiDiagnosis: 'Infarctus suspecté',
      doctorDecision: 'Angine instable',
      user: 'Dr Karim Ayari',
      status: 'modified'
    },
    {
      date: '31 Oct 2025 11:45',
      patient: 'Leila Trabelsi',
      action: 'Validation diagnostic',
      aiDiagnosis: 'Rhinite allergique',
      doctorDecision: 'Validé (concordant)',
      user: 'Dr Karim Ayari',
      status: 'validated'
    },
    {
      date: '31 Oct 2025 10:20',
      patient: 'Mohamed Karoui',
      action: 'Rejet diagnostic',
      aiDiagnosis: 'Diabète type 2',
      doctorDecision: 'Pré-diabète',
      user: 'Dr Karim Ayari',
      status: 'rejected'
    },
    {
      date: '30 Oct 2025 16:50',
      patient: 'Fatma Dhaoui',
      action: 'Validation diagnostic',
      aiDiagnosis: 'Hypertension',
      doctorDecision: 'Validé (concordant)',
      user: 'Dr Karim Ayari',
      status: 'validated'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'modified': return <Edit className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <X className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated': return <Badge className="bg-green-600">Concordant</Badge>;
      case 'modified': return <Badge className="bg-yellow-500">Modifié</Badge>;
      case 'rejected': return <Badge className="bg-red-600">Divergent</Badge>;
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
                    KA
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">Dr Karim Ayari</p>
                  <p className="text-xs text-gray-500">Médecine Générale</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
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
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('doctor-dashboard')}
            >
              Cas entrants
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('doctor-collaboration')}
            >
              Collaboration
            </button>
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
              Journal d'activité
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Validations</p>
                <p className="text-3xl text-green-600">23</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Concordance: 82%</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Modifications</p>
                <p className="text-3xl text-yellow-600">4</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">14% des cas</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejets</p>
                <p className="text-3xl text-red-600">1</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">4% des cas</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total traités</p>
                <p className="text-3xl text-gray-900">28</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Ce mois-ci</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="validated">Validations</SelectItem>
                <SelectItem value="modified">Modifications</SelectItem>
                <SelectItem value="rejected">Rejets</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="week">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="all">Tout l'historique</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Plus de filtres
            </Button>
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Diagnostic IA</TableHead>
                <TableHead>Décision Médecin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{log.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-gray-900">{log.patient}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <p className="text-gray-900">{log.aiDiagnosis}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-gray-900">{log.doctorDecision}</p>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {log.user.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-900">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Info */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-gray-900 mb-2">À propos du journal d'activité</h3>
              <p className="text-gray-700 text-sm">
                Ce journal permet de tracer toutes vos décisions cliniques et leur concordance avec 
                les suggestions de l'IA. Ces données sont essentielles pour l'amélioration continue 
                du système et pour la conformité réglementaire (traçabilité HDS).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
