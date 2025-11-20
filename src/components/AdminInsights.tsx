import { Brain, TrendingUp, MapPin, Activity, Users, AlertCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function AdminInsights({ onNavigate }: Props) {
  const diseaseDistribution = [
    { name: 'Infections respiratoires', value: 32, color: '#2563EB' },
    { name: 'Maladies cardiovasculaires', value: 24, color: '#DC2626' },
    { name: 'Diabète', value: 18, color: '#F59E0B' },
    { name: 'Allergies', value: 15, color: '#10B981' },
    { name: 'Autres', value: 11, color: '#6B7280' }
  ];

  const monthlyTrends = [
    { month: 'Mai', cases: 189, pneumonia: 45, covid: 23, flu: 67 },
    { month: 'Juin', cases: 245, pneumonia: 58, covid: 18, flu: 89 },
    { month: 'Juil', cases: 312, pneumonia: 71, covid: 15, flu: 112 },
    { month: 'Août', cases: 389, pneumonia: 89, covid: 12, flu: 145 },
    { month: 'Sept', cases: 467, pneumonia: 104, covid: 19, flu: 178 },
    { month: 'Oct', cases: 523, pneumonia: 118, covid: 24, flu: 201 }
  ];

  const regionalData = [
    { region: 'Tunis', cases: 234, population: 1200000, rate: 19.5 },
    { region: 'Sfax', cases: 156, population: 600000, rate: 26.0 },
    { region: 'Sousse', cases: 98, population: 450000, rate: 21.8 },
    { region: 'Bizerte', cases: 87, population: 350000, rate: 24.9 },
    { region: 'Gabès', cases: 45, population: 280000, rate: 16.1 }
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
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('admin-security')}
            >
              Sécurité
            </button>
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
              Global Insights
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cas analysés</p>
                <p className="text-3xl text-gray-900">2,125</p>
              </div>
              <Badge className="bg-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +18%
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">6 derniers mois</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Patients actifs</p>
                <p className="text-3xl text-blue-600">1,847</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Derniers 6 mois</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Régions couvertes</p>
                <p className="text-3xl text-indigo-600">24</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tunisie</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alertes actives</p>
                <p className="text-3xl text-yellow-600">3</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tendances émergentes</p>
          </Card>
        </div>

        {/* Map Placeholder */}
        <Card className="p-6 mb-8">
          <h3 className="text-gray-900 mb-4">Carte de santé - Tunisie</h3>
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Carte interactive des cas par région</p>
              <p className="text-sm text-gray-500">
                Visualisation géographique des tendances épidémiologiques en Tunisie
              </p>
            </div>
            
            {/* Sample Markers */}
            <div className="absolute top-1/4 left-1/3 w-12 h-12 bg-red-600 rounded-full opacity-50 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-yellow-500 rounded-full opacity-50 animate-pulse"></div>
            <div className="absolute bottom-1/3 left-1/2 w-10 h-10 bg-green-600 rounded-full opacity-50 animate-pulse"></div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Disease Distribution */}
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Distribution des maladies</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {diseaseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Trends */}
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Tendances mensuelles</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pneumonia" stroke="#2563EB" strokeWidth={2} name="Pneumonie" />
                <Line type="monotone" dataKey="covid" stroke="#DC2626" strokeWidth={2} name="COVID-19" />
                <Line type="monotone" dataKey="flu" stroke="#10B981" strokeWidth={2} name="Grippe" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Regional Analysis */}
        <Card className="p-6 mb-8">
          <h3 className="text-gray-900 mb-4">Analyse régionale</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="region" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="cases" fill="#2563EB" radius={[8, 8, 0, 0]} name="Cas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Alerts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="text-gray-900 mb-2">Pic infections respiratoires</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Augmentation de 28% des cas de pneumonie dans la région de Sfax cette semaine.
                </p>
                <Badge className="bg-yellow-500">Surveillance active</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Activity className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-gray-900 mb-2">Tendance saisonnière</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Augmentation normale des cas de grippe prévue pour les 2 prochaines semaines.
                </p>
                <Badge className="bg-blue-600">Information</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="text-gray-900 mb-2">Amélioration continue</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Le taux de détection précoce des maladies chroniques a augmenté de 15%.
                </p>
                <Badge className="bg-green-600">Positif</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Info */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-gray-900 mb-2">Global Health Insights</h3>
              <p className="text-gray-700 text-sm mb-3">
                Les données sont totalement anonymisées et agrégées pour protéger la vie privée des patients 
                tout en permettant l'analyse épidémiologique.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Activity className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Détection précoce des épidémies émergentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Cartographie en temps réel des tendances de santé</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Support aux décisions de santé publique</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
