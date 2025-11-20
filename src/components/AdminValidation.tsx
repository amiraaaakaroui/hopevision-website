import { Brain, CheckCircle, X, TrendingUp, RefreshCw, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function AdminValidation({ onNavigate }: Props) {
  const validationSamples = [
    {
      id: 'VAL-001',
      diagnosis: 'Pneumonie atypique',
      aiConfidence: 71,
      doctorDecision: 'Concordant',
      accuracy: true,
      date: '31 Oct 2025'
    },
    {
      id: 'VAL-002',
      diagnosis: 'Infarctus',
      aiConfidence: 84,
      doctorDecision: 'Modifié',
      accuracy: false,
      date: '31 Oct 2025'
    },
    {
      id: 'VAL-003',
      diagnosis: 'Rhinite allergique',
      aiConfidence: 92,
      doctorDecision: 'Concordant',
      accuracy: true,
      date: '31 Oct 2025'
    },
    {
      id: 'VAL-004',
      diagnosis: 'Diabète type 2',
      aiConfidence: 78,
      doctorDecision: 'Modifié',
      accuracy: false,
      date: '31 Oct 2025'
    },
    {
      id: 'VAL-005',
      diagnosis: 'Hypertension',
      aiConfidence: 88,
      doctorDecision: 'Concordant',
      accuracy: true,
      date: '30 Oct 2025'
    }
  ];

  const accuracyTrend = [
    { month: 'Jun', accuracy: 78 },
    { month: 'Jul', accuracy: 81 },
    { month: 'Aug', accuracy: 83 },
    { month: 'Sep', accuracy: 85 },
    { month: 'Oct', accuracy: 87 }
  ];

  const rocData = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.05, tpr: 0.65 },
    { fpr: 0.1, tpr: 0.78 },
    { fpr: 0.15, tpr: 0.84 },
    { fpr: 0.2, tpr: 0.87 },
    { fpr: 0.3, tpr: 0.91 },
    { fpr: 0.5, tpr: 0.95 },
    { fpr: 1, tpr: 1 }
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
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
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
                <p className="text-sm text-gray-600 mb-1">Précision globale</p>
                <p className="text-3xl text-green-600">87%</p>
              </div>
              <Badge className="bg-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3%
              </Badge>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cas validés</p>
                <p className="text-3xl text-gray-900">456</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Concordance</p>
                <p className="text-3xl text-blue-600">82%</p>
              </div>
              <Badge className="bg-blue-600">Bon</Badge>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Faux positifs</p>
                <p className="text-3xl text-yellow-600">8%</p>
              </div>
              <Badge className="bg-yellow-500">Acceptable</Badge>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Accuracy Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-1">Évolution de la précision</h3>
                <p className="text-sm text-gray-600">Précision du modèle IA sur 5 mois</p>
              </div>
              <Badge className="bg-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +9%
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[70, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* ROC Curve */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-1">Courbe ROC</h3>
                <p className="text-sm text-gray-600">Performance du modèle (AUC = 0.91)</p>
              </div>
              <Badge className="bg-green-600">Excellent</Badge>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="fpr" 
                  name="Taux faux positifs"
                  domain={[0, 1]}
                  stroke="#9ca3af"
                />
                <YAxis 
                  type="number" 
                  dataKey="tpr" 
                  name="Taux vrais positifs"
                  domain={[0, 1]}
                  stroke="#9ca3af"
                />
                <Tooltip />
                <Scatter 
                  data={rocData} 
                  fill="#2563EB"
                  line={{ stroke: '#2563EB', strokeWidth: 3 }}
                />
                <Scatter 
                  data={[{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }]} 
                  fill="transparent"
                  line={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Validation Samples */}
        <Card className="mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 mb-1">Échantillons de validation</h3>
                <p className="text-sm text-gray-600">Comparaison IA vs décision médicale</p>
              </div>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Diagnostic IA</TableHead>
                <TableHead>Confiance IA</TableHead>
                <TableHead>Décision Médecin</TableHead>
                <TableHead>Précision</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validationSamples.map((sample) => (
                <TableRow key={sample.id} className="hover:bg-gray-50">
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {sample.id}
                    </code>
                  </TableCell>
                  <TableCell className="text-gray-900">{sample.diagnosis}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full" 
                          style={{ width: `${sample.aiConfidence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{sample.aiConfidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sample.accuracy ? (
                      <Badge className="bg-green-600">Concordant</Badge>
                    ) : (
                      <Badge className="bg-yellow-500">Modifié</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {sample.accuracy ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Correct</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <X className="w-4 h-4" />
                        <span className="text-sm">Divergent</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{sample.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Analyser
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Brain className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">Amélioration continue du modèle</h3>
                <p className="text-gray-700 text-sm mb-4">
                  Les cas où l'IA et le médecin divergent sont automatiquement analysés pour 
                  améliorer les futures prédictions.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Lancer retraining du modèle
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Métriques de performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sensibilité (Recall)</span>
                <span className="text-gray-900">89%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Spécificité</span>
                <span className="text-gray-900">91%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Précision (Precision)</span>
                <span className="text-gray-900">87%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">F1-Score</span>
                <span className="text-gray-900">88%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">AUC-ROC</span>
                <span className="text-gray-900">0.91</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
