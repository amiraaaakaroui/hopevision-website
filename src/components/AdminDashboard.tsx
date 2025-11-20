import { Brain, Users, Activity, TrendingUp, CheckCircle, Clock, AlertTriangle, LogOut, UserX, Timer } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function AdminDashboard({ onNavigate }: Props) {
  const analysisData = [
    { month: 'Jun', cases: 245 },
    { month: 'Jul', cases: 312 },
    { month: 'Aug', cases: 389 },
    { month: 'Sep', cases: 467 },
    { month: 'Oct', cases: 523 }
  ];

  const concordanceData = [
    { month: 'Jun', concordance: 78 },
    { month: 'Jul', concordance: 81 },
    { month: 'Aug', concordance: 83 },
    { month: 'Sep', concordance: 85 },
    { month: 'Oct', concordance: 87 }
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
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
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
        {/* KPIs */}
        <div className="grid grid-cols-6 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <Badge className="bg-green-600">+12%</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Cas analysés</p>
            <p className="text-3xl text-gray-900">523</p>
            <p className="text-xs text-gray-500 mt-1">Ce mois-ci</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <Badge className="bg-green-600">+3%</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Concordance IA</p>
            <p className="text-3xl text-gray-900">87%</p>
            <p className="text-xs text-gray-500 mt-1">IA vs Médecin</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <Badge className="bg-yellow-500">-2min</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Délai médian</p>
            <p className="text-3xl text-gray-900">18min</p>
            <p className="text-xs text-gray-500 mt-1">Analyse → Décision</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Timer className="w-6 h-6 text-indigo-600" />
              </div>
              <Badge variant="outline">Stable</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Temps par état</p>
            <p className="text-3xl text-gray-900">2.4h</p>
            <p className="text-xs text-gray-500 mt-1">Moyenne traitement</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <Badge className="bg-green-600">-5%</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Taux no-show</p>
            <p className="text-3xl text-gray-900">8.2%</p>
            <p className="text-xs text-gray-500 mt-1">RDV non honorés</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <Badge variant="outline">0</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Erreurs détectées</p>
            <p className="text-3xl text-gray-900">2</p>
            <p className="text-xs text-gray-500 mt-1">Ce mois-ci</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <Badge className="bg-green-600">+5</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Médecins actifs</p>
            <p className="text-3xl text-gray-900">34</p>
            <p className="text-xs text-gray-500 mt-1">Ce mois-ci</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Cases Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-1">Évolution des cas</h3>
                <p className="text-sm text-gray-600">Nombre de cas analysés par mois</p>
              </div>
              <Badge className="bg-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="cases" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Concordance Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-1">Concordance IA/Médecin</h3>
                <p className="text-sm text-gray-600">Taux de concordance mensuel (%)</p>
              </div>
              <Badge className="bg-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3%
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={concordanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[70, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="concordance" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Activité récente</h3>
            <div className="space-y-4">
              {[
                { user: 'Dr Ayari', action: 'Validé un diagnostic', time: 'Il y a 5 min', status: 'success' },
                { user: 'Admin', action: 'Ajouté un nouveau médecin', time: 'Il y a 1h', status: 'info' },
                { user: 'Dr Mansouri', action: 'Modifié un diagnostic', time: 'Il y a 2h', status: 'warning' },
                { user: 'Système', action: 'Synchronisation FHIR réussie', time: 'Il y a 3h', status: 'success' }
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-600'
                  }`}></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Alertes système</h3>
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1">Pic d'utilisation détecté</p>
                    <p className="text-xs text-gray-600">Le nombre de requêtes a augmenté de 30% aujourd'hui</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1">Sauvegarde réussie</p>
                    <p className="text-xs text-gray-600">Dernière sauvegarde: Il y a 2 heures</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1">Mise à jour disponible</p>
                    <p className="text-xs text-gray-600">Version 2.4.1 - Améliorations de performances</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}