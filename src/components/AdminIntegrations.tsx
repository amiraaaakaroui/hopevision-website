import { Brain, Link, CheckCircle, AlertCircle, RefreshCw, Plus, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function AdminIntegrations({ onNavigate }: Props) {
  const integrations = [
    {
      name: 'FHIR Server - Hospital Central',
      type: 'FHIR R4',
      endpoint: 'https://fhir.hospital-central.tn/r4',
      status: 'active',
      lastSync: 'Il y a 5 min',
      records: 1234
    },
    {
      name: 'HL7 Interface - Clinic Pasteur',
      type: 'HL7 v2.5',
      endpoint: 'tcp://hl7.pasteur.tn:2575',
      status: 'active',
      lastSync: 'Il y a 15 min',
      records: 892
    },
    {
      name: 'FHIR Server - Lab BioMedical',
      type: 'FHIR R4',
      endpoint: 'https://fhir.biomedical.tn/r4',
      status: 'active',
      lastSync: 'Il y a 30 min',
      records: 567
    },
    {
      name: 'HL7 Interface - Hospital Regional',
      type: 'HL7 v2.7',
      endpoint: 'tcp://hl7.regional.tn:2575',
      status: 'warning',
      lastSync: 'Il y a 2h',
      records: 423
    },
    {
      name: 'FHIR Server - Polyclinique Nord',
      type: 'FHIR R4',
      endpoint: 'https://fhir.nord.tn/r4',
      status: 'error',
      lastSync: 'Il y a 1 jour',
      records: 0
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Connecté</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Attention</Badge>;
      case 'error':
        return <Badge className="bg-red-600">Erreur</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    return type.includes('FHIR') ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600';
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
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('admin-users')}
            >
              Utilisateurs
            </button>
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total intégrations</p>
                <p className="text-3xl text-gray-900">5</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Link className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Actives</p>
                <p className="text-3xl text-green-600">3</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avec alertes</p>
                <p className="text-3xl text-yellow-600">1</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En erreur</p>
                <p className="text-3xl text-red-600">1</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end mb-6">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle intégration
          </Button>
        </div>

        {/* Integrations List */}
        <div className="space-y-4">
          {integrations.map((integration, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-3 py-1 rounded-lg text-sm ${getTypeColor(integration.type)}`}>
                      {integration.type}
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                  
                  <h3 className="text-gray-900 mb-2">{integration.name}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Link className="w-4 h-4" />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {integration.endpoint}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Dernière sync:</span>
                      <span className="text-gray-900 ml-2">{integration.lastSync}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Enregistrements:</span>
                      <span className="text-gray-900 ml-2">{integration.records.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {getStatusIcon(integration.status)}
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Synchroniser
                  </Button>
                  <Button variant="outline" size="sm">
                    Configurer
                  </Button>
                </div>
              </div>

              {integration.status === 'error' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-900 mb-1">Erreur de connexion</p>
                      <p className="text-xs text-red-700">
                        Impossible de se connecter à l'endpoint. Vérifiez les credentials et la disponibilité du serveur.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {integration.status === 'warning' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-900 mb-1">Synchronisation retardée</p>
                      <p className="text-xs text-yellow-700">
                        La dernière synchronisation a pris plus de temps que prévu. Vérifiez les performances du serveur.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Link className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-gray-900 mb-2">Interopérabilité FHIR/HL7</h3>
              <p className="text-gray-700 text-sm mb-3">
                HopeVisionAI supporte les standards internationaux d'interopérabilité médicale :
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>FHIR R4</strong> - Fast Healthcare Interoperability Resources (REST API)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>HL7 v2.x</strong> - Health Level 7 messaging standard (TCP/IP)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Synchronisation bidirectionnelle des données patients et résultats d'analyses</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Chiffrement de bout en bout conforme aux normes HDS</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
