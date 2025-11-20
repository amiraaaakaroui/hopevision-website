import { Brain, FileText, AlertCircle, Info, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientDetailedReport({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-gray-900">HopeVisionAI</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Étape 5 sur 6</span>
            <span className="text-sm text-gray-600">Rapport détaillé</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '83%' }}></div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h2 className="text-gray-900">Rapport d'analyse détaillé</h2>
          </div>
          <p className="text-gray-600">
            Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Alert */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-900">
              <span className="font-medium">Rappel important :</span> Ce rapport est une aide à la décision médicale basée sur l'intelligence artificielle. 
              Il ne remplace pas l'avis d'un professionnel de santé qualifié.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* 1. Résumé des symptômes */}
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Résumé de vos symptômes
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Symptôme principal</p>
                  <p className="text-gray-900">Toux sèche persistante</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Durée</p>
                  <p className="text-gray-900">5 jours</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Température</p>
                  <p className="text-gray-900">38.4°C (fièvre modérée)</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Autres symptômes</p>
                  <p className="text-gray-900">Essoufflement, fatigue</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Votre description :</span> "Toux sèche depuis 5 jours, surtout le soir et la nuit. 
                  Fièvre autour de 38°C. Je me sens fatigué(e) et j'ai parfois du mal à respirer pendant mes activités habituelles."
                </p>
              </div>
            </div>
          </Card>

          {/* 2. Hypothèses diagnostiques */}
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Hypothèses diagnostiques par IA
            </h3>
            <div className="space-y-4">
              {/* Hypothèse principale */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-gray-900">Pneumonie atypique</h4>
                      <Badge className="bg-blue-600">Hypothèse principale</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Consultation recommandée
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl text-blue-600">71%</div>
                    <div className="text-sm text-gray-600">Confiance</div>
                  </div>
                </div>
                <Progress value={71} className="mb-3" />
                <p className="text-sm text-gray-700 mb-3">
                  L'analyse détecte une combinaison caractéristique : toux sèche persistante, fièvre modérée, 
                  essoufflement et fatigue. Ces symptômes, associés à leur durée et évolution, sont cohérents 
                  avec une pneumonie atypique.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Toux sèche</Badge>
                  <Badge variant="secondary">Fièvre 38.4°C</Badge>
                  <Badge variant="secondary">Essoufflement</Badge>
                  <Badge variant="secondary">Durée 5 jours</Badge>
                  <Badge variant="secondary">Fatigue</Badge>
                </div>
              </div>

              {/* Hypothèses alternatives */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="text-gray-900 mb-3">Hypothèses alternatives</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900">Bronchite aiguë</p>
                      <Progress value={18} className="mt-1" />
                    </div>
                    <span className="text-gray-600 ml-4">18%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900">COVID-19</p>
                      <Progress value={11} className="mt-1" />
                    </div>
                    <span className="text-gray-600 ml-4">11%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Explication détaillée */}
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Pourquoi cette analyse ?
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-gray-900 mb-2">Éléments détectés par l'IA :</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><span className="font-medium">Pattern temporel :</span> Aggravation nocturne de la toux (typique des infections respiratoires basses)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><span className="font-medium">Analyse vocale :</span> Détection d'un essoufflement léger dans l'enregistrement audio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><span className="font-medium">Durée des symptômes :</span> 5 jours correspond à la phase typique de développement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span><span className="font-medium">Fièvre modérée :</span> 38.4°C est cohérent avec une infection respiratoire</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="text-gray-900 mb-2">Comparaison avec la base de données clinique</h5>
                <p className="text-sm text-gray-700">
                  L'IA a comparé votre cas avec <span className="font-medium">12,847 cas similaires</span> dans sa base de données. 
                  Dans 73% de ces cas avec un profil symptomatique similaire, le diagnostic confirmé était une pneumonie atypique.
                </p>
              </div>
            </div>
          </Card>

          {/* 4. Recommandations */}
          <Card className="p-6 border-l-4 border-yellow-500">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              Recommandations
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Action recommandée
                </h4>
                <p className="text-gray-700 mb-3">
                  <span className="font-medium">Consultation médicale recommandée dans les 24-48h</span>
                </p>
                <p className="text-sm text-gray-700">
                  Compte tenu de la durée des symptômes et de leur nature, une consultation permettra de :
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li>• Confirmer ou infirmer le diagnostic par examen clinique</li>
                  <li>• Prescrire des examens complémentaires si nécessaire (radio pulmonaire, analyses)</li>
                  <li>• Mettre en place un traitement adapté</li>
                </ul>
              </div>

              <div>
                <h4 className="text-gray-900 mb-3">En attendant la consultation :</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="text-green-900 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      À faire
                    </h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Repos et hydratation (2L/jour minimum)</li>
                      <li>• Surveiller la température</li>
                      <li>• Aérer régulièrement votre chambre</li>
                      <li>• Paracétamol si fièvre &gt;38.5°C</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <h5 className="text-red-900 mb-1 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Signes d'alerte
                    </h5>
                    <p className="text-sm text-gray-700 mb-1">Consultez en urgence si :</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Difficulté respiratoire importante</li>
                      <li>• Fièvre &gt;39.5°C persistante</li>
                      <li>• Douleur thoracique</li>
                      <li>• Confusion, malaise</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 5. Prochaines étapes */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-gray-900 mb-3">Prochaines étapes</h3>
            <p className="text-gray-700 mb-4">
              Nous vous recommandons de partager ce rapport avec un médecin. Vous pouvez dès maintenant 
              consulter notre réseau de médecins disponibles et prendre rendez-vous.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Ce rapport sera automatiquement partagé avec le médecin que vous consulterez</span>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => onNavigate('patient-results')}>
            Retour aux résultats
          </Button>
          <Button 
            variant="outline"
            onClick={() => onNavigate('patient-timeline')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Voir ma timeline
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigate('patient-orientation')}
          >
            Passer à l'orientation médicale
          </Button>
        </div>
      </div>
    </div>
  );
}