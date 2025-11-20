import { ArrowLeft, Plus, Search, Filter, Users, Building2, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorPatientManagement({ onNavigate }: Props) {
  const platformPatients = [
    {
      name: 'Nadia Ben Salem',
      age: 34,
      id: 'PAT-2025-00234',
      status: 'Consultation recommandée',
      lastVisit: '31 Oct 2025',
      source: 'platform',
      aiScore: 78
    },
    {
      name: 'Ahmed Mansour',
      age: 52,
      id: 'PAT-2025-00198',
      status: 'Urgent',
      lastVisit: '31 Oct 2025',
      source: 'platform',
      aiScore: 84
    },
    {
      name: 'Leila Trabelsi',
      age: 28,
      id: 'PAT-2025-00156',
      status: 'Suivi en cours',
      lastVisit: '30 Oct 2025',
      source: 'platform',
      aiScore: 92
    }
  ];

  const cabinetPatients = [
    {
      name: 'Mohamed Karoui',
      age: 45,
      id: 'CAB-2025-0012',
      status: 'Suivi diabète',
      lastVisit: '28 Oct 2025',
      source: 'cabinet',
      aiScore: null
    },
    {
      name: 'Fatma Hajji',
      age: 62,
      id: 'CAB-2025-0008',
      status: 'Hypertension',
      lastVisit: '25 Oct 2025',
      source: 'cabinet',
      aiScore: null
    },
    {
      name: 'Youssef Ben Ali',
      age: 38,
      id: 'CAB-2025-0015',
      status: 'Consultation annuelle',
      lastVisit: '29 Oct 2025',
      source: 'cabinet',
      aiScore: null
    }
  ];

  const allPatients = [...platformPatients, ...cabinetPatients].sort((a, b) => 
    new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
  );

  const getStatusColor = (status: string) => {
    if (status.includes('Urgent')) return 'bg-red-600';
    if (status.includes('recommandée')) return 'bg-yellow-500';
    return 'bg-blue-600';
  };

  const renderPatientTable = (patients: typeof allPatients) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Identifiant</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Dernière visite</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Score IA</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient, index) => (
          <TableRow key={index} className="hover:bg-gray-50">
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-500">{patient.age} ans</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-gray-600">{patient.id}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(patient.status)}>
                {patient.status}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-600">{patient.lastVisit}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {patient.source === 'platform' ? (
                  <>
                    <Database className="w-3 h-3 mr-1" />
                    Plateforme
                  </>
                ) : (
                  <>
                    <Building2 className="w-3 h-3 mr-1" />
                    Cabinet
                  </>
                )}
              </Badge>
            </TableCell>
            <TableCell>
              {patient.aiScore ? (
                <div className="flex items-center gap-2">
                  <div className="w-12 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full" 
                      style={{ width: `${patient.aiScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">{patient.aiScore}%</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">N/A</span>
              )}
            </TableCell>
            <TableCell>
              <Button 
                size="sm"
                onClick={() => onNavigate('doctor-patient-file')}
              >
                Voir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900">Gestion des patients</h1>
                  <p className="text-xs text-gray-500">Plateforme & Cabinet</p>
                </div>
              </div>
            </div>
            <Button onClick={() => onNavigate('doctor-new-patient')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau patient cabinet
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total patients</p>
                <p className="text-3xl text-gray-900">{allPatients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Patients plateforme</p>
                <p className="text-3xl text-indigo-600">{platformPatients.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Patients cabinet</p>
                <p className="text-3xl text-green-600">{cabinetPatients.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Consultations cette semaine</p>
                <p className="text-3xl text-gray-900">18</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600">+12%</span>
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
                placeholder="Rechercher un patient par nom, ID..." 
                className="pl-10"
              />
            </div>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">Tous les statuts</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="consultation">Consultation recommandée</SelectItem>
                <SelectItem value="suivi">Suivi en cours</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="recent">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="name">Par nom</SelectItem>
                <SelectItem value="ai-score">Par score IA</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Plus de filtres
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <Tabs defaultValue="all" className="w-full">
            <div className="border-b border-gray-200 px-6">
              <TabsList className="bg-transparent h-auto p-0 space-x-6">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Tous ({allPatients.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="platform"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Patients plateforme ({platformPatients.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="cabinet"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Patients cabinet ({cabinetPatients.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              {renderPatientTable(allPatients)}
            </TabsContent>

            <TabsContent value="platform" className="mt-0">
              {renderPatientTable(platformPatients)}
            </TabsContent>

            <TabsContent value="cabinet" className="mt-0">
              {renderPatientTable(cabinetPatients)}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
