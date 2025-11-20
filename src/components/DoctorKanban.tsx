import { ArrowLeft, Plus, Filter, FileText, Activity, User, CheckCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorKanban({ onNavigate }: Props) {
  const columns = [
    {
      id: 'to-see',
      title: 'À voir',
      color: 'blue',
      count: 3,
      cases: [
        {
          patient: 'Nadia Ben Salem',
          age: 34,
          id: 'PAT-2025-00234',
          diagnosis: 'Pneumonie atypique',
          confidence: 78,
          priority: 'medium',
          time: '15 min'
        },
        {
          patient: 'Ahmed Mansour',
          age: 52,
          id: 'PAT-2025-00198',
          diagnosis: 'Infarctus suspecté',
          confidence: 84,
          priority: 'high',
          time: '5 min'
        },
        {
          patient: 'Leila Trabelsi',
          age: 28,
          id: 'PAT-2025-00156',
          diagnosis: 'Rhinite allergique',
          confidence: 92,
          priority: 'low',
          time: '1h'
        }
      ]
    },
    {
      id: 'in-progress',
      title: 'En cours',
      color: 'yellow',
      count: 2,
      cases: [
        {
          patient: 'Mohamed Karoui',
          age: 45,
          id: 'PAT-2025-00201',
          diagnosis: 'Diabète type 2',
          confidence: 78,
          priority: 'medium',
          time: 'Aujourd\'hui 14h'
        },
        {
          patient: 'Fatma Hajji',
          age: 62,
          id: 'CAB-2025-0008',
          diagnosis: 'Hypertension',
          confidence: null,
          priority: 'medium',
          time: 'En consultation'
        }
      ]
    },
    {
      id: 'exams',
      title: 'Examens',
      color: 'purple',
      count: 2,
      cases: [
        {
          patient: 'Youssef Ben Ali',
          age: 38,
          id: 'PAT-2025-00178',
          diagnosis: 'Bronchite aiguë',
          confidence: 82,
          priority: 'low',
          time: 'Radio prévue demain'
        },
        {
          patient: 'Sara Mansouri',
          age: 29,
          id: 'PAT-2025-00145',
          diagnosis: 'Gastrite',
          confidence: 75,
          priority: 'low',
          time: 'Résultats en attente'
        }
      ]
    },
    {
      id: 'validation',
      title: 'Validation',
      color: 'orange',
      count: 1,
      cases: [
        {
          patient: 'Karim Zahri',
          age: 55,
          id: 'PAT-2025-00189',
          diagnosis: 'Pneumonie bactérienne',
          confidence: 88,
          priority: 'medium',
          time: 'Rapport à signer'
        }
      ]
    },
    {
      id: 'followup',
      title: 'Suivi',
      color: 'green',
      count: 3,
      cases: [
        {
          patient: 'Amira Slimani',
          age: 41,
          id: 'PAT-2025-00112',
          diagnosis: 'COVID-19',
          confidence: 94,
          priority: 'low',
          time: 'RDV J+7'
        },
        {
          patient: 'Mehdi Touati',
          age: 33,
          id: 'PAT-2025-00098',
          diagnosis: 'Angine',
          confidence: 91,
          priority: 'low',
          time: 'Contrôle dans 3j'
        },
        {
          patient: 'Ines Gharbi',
          age: 47,
          id: 'CAB-2025-0003',
          diagnosis: 'Arthrose',
          confidence: null,
          priority: 'low',
          time: 'Suivi mensuel'
        }
      ]
    }
  ];

  const getColumnColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'border-blue-500 bg-blue-50',
      yellow: 'border-yellow-500 bg-yellow-50',
      purple: 'border-purple-500 bg-purple-50',
      orange: 'border-orange-500 bg-orange-50',
      green: 'border-green-500 bg-green-50'
    };
    return colors[color] || 'border-gray-500 bg-gray-50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

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
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900">Pipeline clinicien</h1>
                  <p className="text-xs text-gray-500">Vue Kanban des cas en cours</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
              <Button 
                size="sm"
                onClick={() => onNavigate('doctor-new-patient')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau patient
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-6 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {columns.map((col) => (
            <Card key={col.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{col.title}</p>
                  <p className="text-2xl text-gray-900">{col.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColumnColor(col.color)}`}>
                  {col.id === 'to-see' && <FileText className="w-6 h-6 text-blue-600" />}
                  {col.id === 'in-progress' && <Clock className="w-6 h-6 text-yellow-600" />}
                  {col.id === 'exams' && <Activity className="w-6 h-6 text-purple-600" />}
                  {col.id === 'validation' && <User className="w-6 h-6 text-orange-600" />}
                  {col.id === 'followup' && <CheckCircle className="w-6 h-6 text-green-600" />}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-5 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              {/* Column Header */}
              <Card className={`p-4 border-t-4 ${getColumnColor(column.color)}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900">{column.title}</h3>
                  <Badge variant="outline">{column.count}</Badge>
                </div>
              </Card>

              {/* Cases */}
              <div className="space-y-3">
                {column.cases.map((caseItem, idx) => (
                  <Card 
                    key={idx}
                    className="p-4 cursor-move hover:shadow-lg transition-shadow border-l-4"
                    style={{ 
                      borderLeftColor: caseItem.priority === 'high' 
                        ? '#DC2626' 
                        : caseItem.priority === 'medium'
                        ? '#EAB308'
                        : '#059669'
                    }}
                    onClick={() => onNavigate('doctor-patient-file')}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {caseItem.patient.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-gray-900">{caseItem.patient}</p>
                            <p className="text-xs text-gray-500">{caseItem.age} ans</p>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(caseItem.priority)}`}></div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1">{caseItem.id}</p>
                        <p className="text-sm text-gray-900">{caseItem.diagnosis}</p>
                        {caseItem.confidence && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full" 
                                style={{ width: `${caseItem.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{caseItem.confidence}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 pt-3 border-t border-gray-100">
                        <Clock className="w-3 h-3" />
                        <span>{caseItem.time}</span>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Add Card Button */}
                <button 
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600 text-sm"
                  onClick={() => onNavigate('doctor-new-patient')}
                >
                  <Plus className="w-4 h-4 mx-auto mb-1" />
                  Ajouter un cas
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2">Glisser-déposer pour changer l'état</h3>
              <p className="text-sm text-gray-700 mb-4">
                Organisez vos cas en les déplaçant entre les colonnes. Les changements sont enregistrés automatiquement 
                et synchronisés avec le système.
              </p>
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-900 mb-1">À voir</p>
                  <p className="text-gray-600">Nouveaux cas IA à examiner</p>
                </div>
                <div>
                  <p className="text-gray-900 mb-1">En cours</p>
                  <p className="text-gray-600">Consultations en cours ou prévues</p>
                </div>
                <div>
                  <p className="text-gray-900 mb-1">Examens</p>
                  <p className="text-gray-600">En attente de résultats d'examens</p>
                </div>
                <div>
                  <p className="text-gray-900 mb-1">Validation</p>
                  <p className="text-gray-600">Rapport à valider et signer</p>
                </div>
                <div>
                  <p className="text-gray-900 mb-1">Suivi</p>
                  <p className="text-gray-600">Contrôle et suivi post-traitement</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
