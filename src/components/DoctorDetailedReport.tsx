import { ArrowLeft, Download, Share2, FileText, Brain, Shield, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorDetailedReport({ onNavigate }: Props) {
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
                onClick={() => onNavigate('doctor-patient-file')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au dossier
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <h1 className="text-gray-900">Rapport médical détaillé</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                Export FHIR
              </Button>
              <Button 
                size="sm"
                onClick={() => onNavigate('booking-service-selection')}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager & Réserver
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="hypotheses">Hypothèses</TabsTrigger>
            <TabsTrigger value="xai">XAI Multimodal</TabsTrigger>
            <TabsTrigger value="action-plan">Plan d'action</TabsTrigger>
            <TabsTrigger value="traceability">Traçabilité</TabsTrigger>
            <TabsTrigger value="full-report">Rapport complet</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-gray-900">Résumé exécutif</h2>
                  <Badge className="bg-yellow-500">Consultation recommandée</Badge>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-gray-900 mb-2">Patient</h3>
                    <p className="text-gray-700">Nadia Ben Salem, 34 ans, Féminin</p>
                    <p className="text-sm text-gray-600">ID: PAT-2025-00234 • Dossier créé le 31 Oct 2025</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-gray-900 mb-2">Motif de consultation</h3>
                    <p className="text-gray-700">
                      Toux sèche persistante depuis 5 jours, accompagnée de fièvre (38.4°C), 
                      fatigue modérée à élevée (7/10), et léger essoufflement lors des activités quotidiennes.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-gray-900 mb-3">Diagnostic IA principal</h3>
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-900">Pneumonie atypique à Mycoplasma pneumoniae</p>
                        <Badge className="bg-blue-600">78%</Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        Basé sur l'analyse multimodale combinant symptômes textuels, 
                        pattern vocal (essoufflement à 68%), et marqueurs inflammatoires (CRP 38 mg/L).
                      </p>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-gray-900 mb-2">Recommandations prioritaires</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-red-600">1</span>
                        </div>
                        <p className="text-gray-700">Radiographie thoracique en priorité</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-yellow-600">2</span>
                        </div>
                        <p className="text-gray-700">PCR Mycoplasma pneumoniae pour confirmation</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-green-600">3</span>
                        </div>
                        <p className="text-gray-700">Antibiothérapie empirique (Azithromycine)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-gray-900 mb-4">Métriques clés</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Confiance globale</span>
                        <span className="text-blue-600">78%</span>
                      </div>
                      <Progress value={78} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Niveau de gravité</span>
                        <Badge className="bg-yellow-500">Modéré</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Sources de données</span>
                        <span className="text-gray-900">4</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">Texte</Badge>
                        <Badge variant="outline" className="text-xs">Voix</Badge>
                        <Badge variant="outline" className="text-xs">Bio</Badge>
                        <Badge variant="outline" className="text-xs">Anamnèse</Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-green-50 border-green-200">
                  <h3 className="text-gray-900 mb-3">Validation médicale</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Médecin</span>
                      <span className="text-gray-900">Dr Karim Ayari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spécialité</span>
                      <span className="text-gray-900">Médecine Générale</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut</span>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        En révision
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Hypotheses Tab */}
          <TabsContent value="hypotheses" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Hypothèses diagnostiques</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-900 mb-4">Hypothèses retenues</h3>
                  <div className="space-y-4">
                    {[
                      {
                        name: 'Pneumonie atypique (Mycoplasma pneumoniae)',
                        confidence: 78,
                        evidence: [
                          'Toux sèche persistante (5 jours)',
                          'Pattern vocal essoufflement 68%',
                          'CRP élevée (38 mg/L)',
                          'Contact récent avec personne malade',
                          'Absence de production purulente'
                        ],
                        severity: 'medium'
                      },
                      {
                        name: 'Bronchite aiguë',
                        confidence: 18,
                        evidence: [
                          'Toux depuis moins d\'une semaine',
                          'Fièvre modérée',
                          'Absence de signes de gravité'
                        ],
                        severity: 'low'
                      },
                      {
                        name: 'COVID-19',
                        confidence: 11,
                        evidence: [
                          'Symptômes respiratoires',
                          'Fatigue importante',
                          'Fièvre présente'
                        ],
                        severity: 'medium'
                      }
                    ].map((hypo, idx) => (
                      <Card key={idx} className="p-6 border-2">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-gray-900 mb-2">{hypo.name}</h4>
                            <div className="flex items-center gap-3">
                              <Progress value={hypo.confidence} className="flex-1" />
                              <span className="text-blue-600 min-w-[3rem]">{hypo.confidence}%</span>
                            </div>
                          </div>
                          <Badge className={
                            hypo.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-600'
                          }>
                            {hypo.severity === 'medium' ? 'Modéré' : 'Faible'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Éléments en faveur :</p>
                          <ul className="space-y-1">
                            {hypo.evidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-gray-900 mb-4">Hypothèses écartées</h3>
                  <div className="space-y-3">
                    {[
                      {
                        name: 'Tuberculose pulmonaire',
                        confidence: 8,
                        reason: 'Durée trop courte, absence de sueurs nocturnes intenses, pas de perte de poids'
                      },
                      {
                        name: 'Embolie pulmonaire',
                        confidence: 5,
                        reason: 'Pas de facteurs de risque thromboembolique, absence de douleur pleurétique aiguë'
                      },
                      {
                        name: 'Insuffisance cardiaque',
                        confidence: 3,
                        reason: 'Âge jeune, pas d\'antécédents cardiaques, absence d\'œdème'
                      }
                    ].map((hypo, idx) => (
                      <Card key={idx} className="p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-gray-700">{hypo.name}</h4>
                          <Badge variant="outline" className="text-gray-500">
                            {hypo.confidence}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{hypo.reason}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* XAI Tab */}
          <TabsContent value="xai" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Pourquoi cette décision ? (XAI Multimodal)</h2>
              
              <div className="space-y-6">
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-3">Analyse textuelle (Poids: 40%)</h3>
                      <p className="text-gray-700 mb-4">
                        Les mots-clés extraits du récit du patient indiquent fortement une infection respiratoire atypique.
                      </p>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-gray-700 leading-relaxed">
                          "<span className="bg-yellow-200 px-1">Toux sèche</span> depuis{' '}
                          <span className="bg-yellow-200 px-1">5 jours</span>, accompagnée d'une{' '}
                          <span className="bg-red-200 px-1">fièvre à 38.4°C</span> et d'une{' '}
                          <span className="bg-yellow-200 px-1">légère fatigue</span>. J'ai remarqué un{' '}
                          <span className="bg-red-200 px-1">léger essoufflement</span> lors de mes activités."
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Badge variant="outline" className="bg-yellow-50">Symptômes clés</Badge>
                        <Badge variant="outline" className="bg-red-50">Signaux d'alerte</Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-purple-50 border-purple-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-3">Analyse vocale (Poids: 25%)</h3>
                      <p className="text-gray-700 mb-4">
                        Le pattern vocal révèle un essoufflement modéré compatible avec une atteinte respiratoire.
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-2xl mb-1 text-yellow-600">68%</div>
                          <div className="text-sm text-gray-600">Essoufflement détecté</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-2xl mb-1 text-green-600">92%</div>
                          <div className="text-sm text-gray-600">Clarté vocale</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-2xl mb-1 text-blue-600">Normal</div>
                          <div className="text-sm text-gray-600">Tonalité</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-green-50 border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-3">Signaux biomédicaux (Poids: 35%)</h3>
                      <p className="text-gray-700 mb-4">
                        Les marqueurs inflammatoires confirment une infection active avec réponse systémique.
                      </p>
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-700">CRP (Protéine C-réactive)</span>
                            <span className="text-red-600">38 mg/L ↑</span>
                          </div>
                          <Progress value={75} className="mb-1" />
                          <p className="text-xs text-gray-600">Normale: &lt;10 mg/L • Indique inflammation importante</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-700">Température corporelle</span>
                            <span className="text-yellow-600">38.4°C ↑</span>
                          </div>
                          <Progress value={80} className="mb-1" />
                          <p className="text-xs text-gray-600">Normale: 36-37°C • Fièvre modérée</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>

          {/* Action Plan Tab */}
          <TabsContent value="action-plan" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-gray-900 mb-4">Examens complémentaires</h3>
                <div className="space-y-3">
                  {[
                    {
                      name: 'Radiographie thoracique',
                      priority: 'high',
                      reason: 'Confirmer pneumonie et évaluer étendue',
                      timeline: 'Urgent - Dans les 24h'
                    },
                    {
                      name: 'PCR Mycoplasma pneumoniae',
                      priority: 'medium',
                      reason: 'Confirmation étiologique',
                      timeline: '2-3 jours'
                    },
                    {
                      name: 'PCR COVID-19',
                      priority: 'medium',
                      reason: 'Diagnostic différentiel',
                      timeline: '24-48h'
                    },
                    {
                      name: 'Gaz du sang artériel',
                      priority: 'low',
                      reason: 'Si aggravation respiratoire',
                      timeline: 'Si nécessaire'
                    }
                  ].map((exam, idx) => (
                    <Card key={idx} className={`p-4 ${
                      exam.priority === 'high' 
                        ? 'border-2 border-red-300 bg-red-50' 
                        : exam.priority === 'medium'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-gray-900">{exam.name}</h4>
                        <Badge className={
                          exam.priority === 'high' 
                            ? 'bg-red-600' 
                            : exam.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                        }>
                          {exam.priority === 'high' ? 'Prioritaire' : exam.priority === 'medium' ? 'Recommandé' : 'Optionnel'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{exam.reason}</p>
                      <p className="text-xs text-gray-600">Délai: {exam.timeline}</p>
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-gray-900 mb-4">Plan thérapeutique</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-gray-900 mb-3">Antibiothérapie empirique</h4>
                    <Card className="p-4 bg-green-50 border-green-200">
                      <p className="text-gray-900 mb-2">Azithromycine 500mg</p>
                      <p className="text-sm text-gray-700 mb-3">
                        1 comprimé par jour pendant 3 jours
                      </p>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-xs text-gray-600">Attention: Allergie pénicilline notée</p>
                      </div>
                    </Card>
                  </div>

                  <div>
                    <h4 className="text-gray-900 mb-3">Traitement symptomatique</h4>
                    <div className="space-y-2">
                      <Card className="p-3 bg-blue-50">
                        <p className="text-sm text-gray-900">Paracétamol 1g</p>
                        <p className="text-xs text-gray-600">Toutes les 6h si fièvre &gt;38°C</p>
                      </Card>
                      <Card className="p-3 bg-blue-50">
                        <p className="text-sm text-gray-900">Hydratation</p>
                        <p className="text-xs text-gray-600">Minimum 2L d'eau par jour</p>
                      </Card>
                      <Card className="p-3 bg-blue-50">
                        <p className="text-sm text-gray-900">Repos</p>
                        <p className="text-xs text-gray-600">Arrêt de travail 5-7 jours</p>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-gray-900 mb-3">Surveillance</h4>
                    <Card className="p-4 bg-yellow-50 border-yellow-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700">Température 2x/jour</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700">Consultation de contrôle J+7</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700">Urgences si aggravation respiratoire</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Traceability Tab */}
          <TabsContent value="traceability" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Traçabilité des décisions (IA vs Médecin)</h2>
              
              <div className="space-y-4">
                {[
                  {
                    decision: 'Diagnostic principal',
                    aiProposal: 'Pneumonie atypique (78%)',
                    doctorValidation: 'Validé',
                    status: 'validated',
                    comment: 'Diagnostic cohérent avec le tableau clinique'
                  },
                  {
                    decision: 'Radiographie thoracique',
                    aiProposal: 'Recommandé (priorité haute)',
                    doctorValidation: 'Validé et prescrit',
                    status: 'validated',
                    comment: 'Examen nécessaire pour confirmation'
                  },
                  {
                    decision: 'PCR COVID-19',
                    aiProposal: 'Recommandé (priorité moyenne)',
                    doctorValidation: 'Validé',
                    status: 'validated',
                    comment: 'Important pour diagnostic différentiel'
                  },
                  {
                    decision: 'Hémoculture',
                    aiProposal: 'Recommandé (priorité moyenne)',
                    doctorValidation: 'Non prescrit',
                    status: 'modified',
                    comment: 'Non nécessaire pour pneumonie atypique ambulatoire'
                  },
                  {
                    decision: 'Antibiothérapie',
                    aiProposal: 'Azithromycine 500mg',
                    doctorValidation: 'Validé',
                    status: 'validated',
                    comment: 'Traitement adapté, allergie pénicilline respectée'
                  }
                ].map((item, idx) => (
                  <Card key={idx} className={`p-4 ${
                    item.status === 'validated' ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-gray-900">{item.decision}</h3>
                      <Badge className={item.status === 'validated' ? 'bg-green-600' : 'bg-yellow-600'}>
                        {item.status === 'validated' ? 'Validé' : 'Modifié'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Proposition IA</p>
                        <p className="text-sm text-gray-900">{item.aiProposal}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Décision médicale</p>
                        <p className="text-sm text-gray-900">{item.doctorValidation}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="text-gray-600">Commentaire:</span> {item.comment}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 bg-blue-50 border-blue-200 mt-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-gray-900 mb-2">Conformité et responsabilité</h3>
                    <p className="text-sm text-gray-700">
                      L'IA est un outil d'aide à la décision. La responsabilité médicale finale 
                      repose sur le médecin traitant (Dr Karim Ayari). Toutes les décisions sont 
                      tracées et horodatées conformément aux exigences réglementaires.
                    </p>
                  </div>
                </div>
              </Card>
            </Card>
          </TabsContent>

          {/* Full Report Tab */}
          <TabsContent value="full-report">
            <Card className="p-8 bg-white">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-gray-900 mb-2">Rapport médical complet</h2>
                <p className="text-gray-600">HopeVisionAI - Plateforme d'aide à la décision médicale</p>
                <p className="text-sm text-gray-500">Généré le 31 Octobre 2025 à 15:24</p>
              </div>

              <Separator className="my-8" />

              <div className="space-y-8 text-sm">
                <div>
                  <h3 className="text-gray-900 mb-3">1. Informations patient</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Nom complet</p>
                      <p className="text-gray-900">Nadia Ben Salem</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Âge / Sexe</p>
                      <p className="text-gray-900">34 ans / Féminin</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Identifiant</p>
                      <p className="text-gray-900">PAT-2025-00234</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date de consultation</p>
                      <p className="text-gray-900">31 Octobre 2025</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-gray-900 mb-3">2. Anamnèse et symptômes</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    La patiente présente une toux sèche persistante depuis 5 jours, accompagnée d'une 
                    fièvre à 38.4°C, d'une fatigue marquée (7/10) et d'un léger essoufflement lors des 
                    activités quotidiennes. Contact récent avec une personne malade il y a 7 jours. 
                    Pas de douleurs thoraciques majeures, ni de sueurs nocturnes significatives.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 mb-2">Antécédents médicaux pertinents:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Asthme léger (contrôlé)</li>
                      <li>Anémie légère</li>
                      <li>Allergie: Pénicilline</li>
                      <li>Vaccins à jour (COVID-19 sept 2025, Grippe oct 2025)</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-gray-900 mb-3">3. Résultats d'analyse IA multimodale</h3>
                  <p className="text-gray-700 mb-4">
                    L'analyse multimodale combinant les données textuelles, vocales et biomédicales 
                    suggère avec une confiance de 78% un diagnostic de pneumonie atypique à Mycoplasma pneumoniae.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-gray-900 mb-3">4. Diagnostic médical</h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-900 mb-2">Pneumonie atypique à Mycoplasma pneumoniae (présumée)</p>
                    <p className="text-gray-700">
                      Diagnostic retenu par le Dr Karim Ayari, en accord avec l'analyse IA. 
                      Confirmation radiologique et biologique à réaliser.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-gray-900 mb-3">5. Plan de prise en charge</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-900 mb-2">Examens complémentaires:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Radiographie thoracique (urgent - 24h)</li>
                        <li>PCR Mycoplasma pneumoniae</li>
                        <li>PCR COVID-19</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-900 mb-2">Traitement prescrit:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Azithromycine 500mg - 1cp/jour pendant 3 jours</li>
                        <li>Paracétamol 1g toutes les 6h si fièvre</li>
                        <li>Hydratation abondante (2L/jour minimum)</li>
                        <li>Repos avec arrêt de travail 5-7 jours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-gray-900 mb-3">6. Surveillance et suivi</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Consultation de contrôle dans 7 jours</li>
                    <li>Température à surveiller 2 fois par jour</li>
                    <li>Urgences en cas d'aggravation respiratoire</li>
                  </ul>
                </div>

                <Separator />

                <div className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Médecin traitant</p>
                      <p className="text-gray-900">Dr Karim Ayari</p>
                      <p className="text-sm text-gray-600">Médecine Générale</p>
                      <p className="text-sm text-gray-600">N° RPPS: 10001234567</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 mb-1">Signature numérique</p>
                      <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                        <Shield className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">31/10/2025 15:24</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Ce rapport a été généré avec l'assistance de l'IA HopeVisionAI. La décision médicale finale 
                  reste sous la responsabilité du médecin traitant. Document conforme RGPD et réglementations en vigueur.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}