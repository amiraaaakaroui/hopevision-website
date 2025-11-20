import { Brain, Shield, Lock, Key, Download, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function AdminSecurity({ onNavigate }: Props) {
  const accessLogs = [
    {
      user: 'Dr Karim Ayari',
      action: 'Consultation dossier patient',
      resource: 'PAT-2025-00234',
      ip: '192.168.1.45',
      time: '31 Oct 2025 14:30',
      status: 'success'
    },
    {
      user: 'Dr Salma Mansouri',
      action: 'Modification diagnostic',
      resource: 'PAT-2025-00189',
      ip: '192.168.1.67',
      time: '31 Oct 2025 14:15',
      status: 'success'
    },
    {
      user: 'Admin',
      action: 'Création utilisateur',
      resource: 'USER-Dr-Khalil',
      ip: '192.168.1.12',
      time: '31 Oct 2025 13:45',
      status: 'success'
    },
    {
      user: 'Inconnu',
      action: 'Tentative connexion',
      resource: 'Login',
      ip: '203.0.113.42',
      time: '31 Oct 2025 12:20',
      status: 'blocked'
    },
    {
      user: 'Dr Ahmed Khalil',
      action: 'Export données',
      resource: 'Rapport mensuel',
      ip: '192.168.1.89',
      time: '31 Oct 2025 11:30',
      status: 'success'
    }
  ];

  const complianceChecks = [
    { name: 'Chiffrement AES-256', status: 'pass', description: 'Données au repos' },
    { name: 'TLS 1.3', status: 'pass', description: 'Données en transit' },
    { name: 'Authentification 2FA', status: 'pass', description: 'Tous les utilisateurs' },
    { name: 'Logs d\'audit', status: 'pass', description: 'Conservation 5 ans' },
    { name: 'Sauvegarde chiffrée', status: 'pass', description: 'Quotidienne automatique' },
    { name: 'Tests de pénétration', status: 'warning', description: 'Derniers: Il y a 2 mois' },
    { name: 'Mise à jour sécurité', status: 'pass', description: 'À jour' },
    { name: 'Accès minimum privilège', status: 'pass', description: 'Rôles configurés' }
  ];

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
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('admin-users')}
            >
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
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
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
        {/* Security Status */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Statut sécurité</p>
                <p className="text-2xl text-green-600">Optimal</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tentatives bloquées</p>
                <p className="text-3xl text-red-600">12</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Ce mois-ci</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">2FA activé</p>
                <p className="text-3xl text-green-600">100%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Utilisateurs</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dernier audit</p>
                <p className="text-2xl text-gray-900">3j</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Il y a 3 jours</p>
          </Card>
        </div>

        {/* Compliance Checks */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 mb-1">Conformité RGPD & HDS</h3>
              <p className="text-sm text-gray-600">Vérifications de sécurité et conformité</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter rapport
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {complianceChecks.map((check, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {check.status === 'pass' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-900">{check.name}</p>
                    <p className="text-xs text-gray-600">{check.description}</p>
                  </div>
                </div>
                {check.status === 'pass' ? (
                  <Badge className="bg-green-600">Conforme</Badge>
                ) : (
                  <Badge className="bg-yellow-500">Attention</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Certifications */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Certification HDS</h3>
                <p className="text-sm text-gray-600">Hébergeur de Données de Santé</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <Badge className="bg-green-600">Certifié</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Validité:</span>
                <span className="text-gray-900">31 Déc 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">N° certification:</span>
                <span className="text-gray-900">HDS-2024-00123</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">Conformité RGPD</h3>
                <p className="text-sm text-gray-600">Protection des données</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <Badge className="bg-blue-600">Conforme</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DPO:</span>
                <span className="text-gray-900">Désigné</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dernier audit:</span>
                <span className="text-gray-900">Oct 2025</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-indigo-50 border-indigo-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">ISO 27001</h3>
                <p className="text-sm text-gray-600">Gestion de la sécurité</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <Badge className="bg-indigo-600">Certifié</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Validité:</span>
                <span className="text-gray-900">15 Jun 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">N° certification:</span>
                <span className="text-gray-900">ISO-27001-2024</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Access Logs */}
        <Card className="mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900 mb-1">Logs d'accès récents</h3>
            <p className="text-sm text-gray-600">Traçabilité complète des actions utilisateurs</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Adresse IP</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessLogs.map((log, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {log.user.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-900">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900">{log.action}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {log.resource}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{log.ip}</TableCell>
                  <TableCell className="text-sm text-gray-600">{log.time}</TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <Badge className="bg-green-600">Autorisé</Badge>
                    ) : (
                      <Badge className="bg-red-600">Bloqué</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Info */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-gray-900 mb-2">Sécurité & Conformité</h3>
              <p className="text-gray-700 text-sm mb-3">
                HopeVisionAI implémente les meilleures pratiques de sécurité pour protéger les données médicales sensibles :
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Chiffrement de bout en bout (AES-256 + TLS 1.3)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Authentification à deux facteurs obligatoire</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Logs d'audit conservés 5 ans (conformité HDS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Sauvegardes chiffrées quotidiennes avec rétention 30 jours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Tests de pénétration trimestriels par cabinet externe</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
