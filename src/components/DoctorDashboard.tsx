import { Brain, Filter, Search, AlertCircle, FileText, Image as ImageIcon, Mic, User, Clock, LogOut, Users, LayoutGrid } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorDashboard({ onNavigate }: Props) {
  const cases = [
    {
      patient: 'Nadia Ben Salem',
      age: 34,
      severity: 'medium',
      aiDiagnosis: 'Pneumonie atypique',
      confidence: 71,
      dataTypes: ['text', 'voice', 'image'],
      status: 'new',
      time: 'Il y a 15 min'
    },
    {
      patient: 'Ahmed Mansour',
      age: 52,
      severity: 'high',
      aiDiagnosis: 'Infarctus suspecté',
      confidence: 84,
      dataTypes: ['text', 'image'],
      status: 'urgent',
      time: 'Il y a 5 min'
    },
    {
      patient: 'Leila Trabelsi',
      age: 28,
      severity: 'low',
      aiDiagnosis: 'Rhinite allergique',
      confidence: 92,
      dataTypes: ['text'],
      status: 'pending',
      time: 'Il y a 1h'
    },
    {
      patient: 'Mohamed Karoui',
      age: 45,
      severity: 'medium',
      aiDiagnosis: 'Diabète type 2',
      confidence: 78,
      dataTypes: ['text', 'voice'],
      status: 'pending',
      time: 'Il y a 2h'
    }
  ];

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
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cas en attente</p>
                <p className="text-3xl text-gray-900">12</p>
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
                <p className="text-3xl text-red-600">3</p>
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
                <p className="text-3xl text-green-600">8</p>
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
                <p className="text-3xl text-gray-900">18m</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="Rechercher un patient, diagnostic..." 
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes spécialités</SelectItem>
                <SelectItem value="general">Médecine générale</SelectItem>
                <SelectItem value="cardio">Cardiologie</SelectItem>
                <SelectItem value="pneumo">Pneumologie</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
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
              {cases.map((caseItem, index) => (
                <TableRow key={index} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gray-100">
                          {caseItem.patient.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-gray-900">{caseItem.patient}</p>
                        <p className="text-sm text-gray-500">{caseItem.age} ans</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(caseItem.severity)}`}></div>
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
                      onClick={() => onNavigate('doctor-patient-file')}
                    >
                      Ouvrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}