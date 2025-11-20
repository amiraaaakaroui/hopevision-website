import { Brain, Search, Plus, Edit, Trash2, Shield, LogOut, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function AdminUsers({ onNavigate }: Props) {
  const users = [
    {
      name: 'Dr Karim Ayari',
      email: 'dr.ayari@hopevision.tn',
      role: 'Médecin',
      specialty: 'Médecine Générale',
      status: 'active',
      cases: 28,
      lastActive: '5 min'
    },
    {
      name: 'Dr Salma Mansouri',
      email: 'dr.mansouri@hopevision.tn',
      role: 'Médecin',
      specialty: 'Pneumologie',
      status: 'active',
      cases: 45,
      lastActive: '2h'
    },
    {
      name: 'Dr Ahmed Khalil',
      email: 'dr.khalil@hopevision.tn',
      role: 'Médecin',
      specialty: 'Médecine Interne',
      status: 'active',
      cases: 32,
      lastActive: '1h'
    },
    {
      name: 'Sarah Ben Ali',
      email: 's.benali@hopevision.tn',
      role: 'Data Steward',
      specialty: 'Gestion données',
      status: 'active',
      cases: 0,
      lastActive: '30 min'
    },
    {
      name: 'Admin Principal',
      email: 'admin@hopevision.tn',
      role: 'Administrateur',
      specialty: 'Administration système',
      status: 'active',
      cases: 0,
      lastActive: 'Maintenant'
    },
    {
      name: 'Dr Mohamed Trabelsi',
      email: 'dr.trabelsi@hopevision.tn',
      role: 'Médecin',
      specialty: 'Cardiologie',
      status: 'inactive',
      cases: 12,
      lastActive: '2 semaines'
    }
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Médecin':
        return <Badge className="bg-blue-600">Médecin</Badge>;
      case 'Administrateur':
        return <Badge className="bg-indigo-600">Admin</Badge>;
      case 'Data Steward':
        return <Badge className="bg-green-600">Data Steward</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-600">Actif</Badge>
    ) : (
      <Badge variant="outline">Inactif</Badge>
    );
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
                <p className="text-xs text-gray-500">Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Administrateur système</p>
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
              onClick={() => onNavigate('admin-dashboard')}
            >
              Dashboard
            </button>
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
              Utilisateurs
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('admin-integrations')}
            >
              Intégrations
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('admin-validation')}
            >
              Validation Center
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('admin-security')}
            >
              Sécurité
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('admin-insights')}
            >
              Global Insights
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total utilisateurs</p>
            <p className="text-3xl text-gray-900">42</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Médecins actifs</p>
            <p className="text-3xl text-blue-600">34</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Administrateurs</p>
            <p className="text-3xl text-indigo-600">3</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Data Stewards</p>
            <p className="text-3xl text-green-600">5</p>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="Rechercher un utilisateur..." 
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="doctor">Médecins</SelectItem>
                  <SelectItem value="admin">Administrateurs</SelectItem>
                  <SelectItem value="steward">Data Stewards</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter utilisateur
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Cas traités</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-gray-600">{user.specialty}</TableCell>
                  <TableCell className="text-gray-900">{user.cases}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{user.lastActive}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Info */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-gray-900 mb-2">Gestion des accès</h3>
              <p className="text-gray-700 text-sm">
                Tous les utilisateurs sont soumis à une authentification à deux facteurs (2FA). 
                Les rôles et permissions sont gérés selon le principe du moindre privilège pour 
                garantir la conformité RGPD et HDS.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
