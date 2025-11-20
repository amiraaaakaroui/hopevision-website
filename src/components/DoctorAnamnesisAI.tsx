import { Brain, ArrowLeft, Sparkles, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Screen } from '../App';
import { useState } from 'react';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorAnamnesisAI({ onNavigate }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});

  const questions = [
    {
      id: 0,
      text: "La toux est-elle productive (avec expectorations) ?",
      type: "boolean",
      aiReason: "Différencier pneumonie atypique (sèche) vs bactérienne (productive)"
    },
    {
      id: 1,
      text: "Avez-vous remarqué des douleurs thoraciques lors de la respiration ?",
      type: "boolean",
      aiReason: "Évaluer l'atteinte pleurale associée"
    },
    {
      id: 2,
      text: "Sur une échelle de 0 à 10, évaluez l'intensité de la fatigue",
      type: "scale",
      aiReason: "Quantifier l'impact systémique de l'infection"
    },
    {
      id: 3,
      text: "Avez-vous été en contact avec une personne malade récemment ?",
      type: "boolean",
      aiReason: "Évaluer le risque de contagion et orienter le diagnostic"
    },
    {
      id: 4,
      text: "Présentez-vous des sueurs nocturnes ?",
      type: "boolean",
      aiReason: "Signe d'infection systémique ou tuberculose"
    }
  ];

  const discardedHypotheses = [
    {
      hypothesis: "Tuberculose pulmonaire",
      confidence: 8,
      reason: "Absence de sueurs nocturnes intenses, pas de perte de poids significative, durée des symptômes trop courte (5 jours)"
    },
    {
      hypothesis: "Embolie pulmonaire",
      confidence: 5,
      reason: "Pas de facteurs de risque thromboembolique identifiés, absence de douleur pleurétique aiguë, pas d'hémoptysie"
    },
    {
      hypothesis: "Insuffisance cardiaque",
      confidence: 3,
      reason: "Âge jeune, pas d'antécédents cardiaques, absence d'œdème des membres inférieurs, orthopnée non mentionnée"
    }
  ];

  const handleAnswer = (value: any) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900">Anamnèse assistée par IA</h1>
                  <p className="text-xs text-gray-500">Nadia Ben Salem • 34 ans</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1}/{questions.length}
              </span>
              <Button 
                onClick={() => onNavigate('doctor-anamnesis-consolidation')}
                disabled={Object.keys(answers).length < questions.length}
              >
                Consolider l'anamnèse
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progression du questionnaire</span>
            <span className="text-sm text-gray-900">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Question */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 mb-2">
                    {questions[currentQuestion].text}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Sparkles className="w-4 h-4" />
                    <span>Pourquoi cette question : {questions[currentQuestion].aiReason}</span>
                  </div>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-4">
                {questions[currentQuestion].type === 'boolean' && (
                  <RadioGroup 
                    value={answers[currentQuestion]?.toString()} 
                    onValueChange={(value) => handleAnswer(value === 'true')}
                  >
                    <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 cursor-pointer">
                      <RadioGroupItem value="true" id="yes" />
                      <Label htmlFor="yes" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">Oui</span>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 cursor-pointer">
                      <RadioGroupItem value="false" id="no" />
                      <Label htmlFor="no" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">Non</span>
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {questions[currentQuestion].type === 'scale' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Aucune fatigue</span>
                      <span>Fatigue extrême</span>
                    </div>
                    <Slider
                      value={[answers[currentQuestion] || 5]}
                      onValueChange={(value) => handleAnswer(value[0])}
                      max={10}
                      step={1}
                      className="py-4"
                    />
                    <div className="text-center">
                      <span className="text-4xl text-blue-600">{answers[currentQuestion] || 5}</span>
                      <span className="text-gray-600"> / 10</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  Question précédente
                </Button>
                <Button
                  onClick={() => {
                    if (currentQuestion < questions.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                    }
                  }}
                  disabled={answers[currentQuestion] === undefined}
                >
                  {currentQuestion === questions.length - 1 ? 'Terminer' : 'Question suivante'}
                </Button>
              </div>
            </Card>

            {/* Progress Questions */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Questions complétées</h3>
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      idx === currentQuestion
                        ? 'bg-blue-50 border border-blue-200'
                        : answers[idx] !== undefined
                        ? 'bg-green-50'
                        : 'bg-gray-50'
                    }`}
                    onClick={() => setCurrentQuestion(idx)}
                  >
                    <span className="text-sm text-gray-700">Question {idx + 1}</span>
                    {answers[idx] !== undefined && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Discarded Hypotheses */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-gray-900">Hypothèses écartées</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                L'IA écarte progressivement certains diagnostics selon vos réponses
              </p>
              <div className="space-y-4">
                {discardedHypotheses.map((hypo, idx) => (
                  <Card key={idx} className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-gray-900">{hypo.hypothesis}</h4>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        {hypo.confidence}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{hypo.reason}</p>
                  </Card>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-gray-900 mb-2">Conseil IA</h4>
                  <p className="text-sm text-gray-700">
                    Les réponses convergent vers une pneumonie atypique. 
                    Pensez à prescrire une radiographie thoracique pour confirmation.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
