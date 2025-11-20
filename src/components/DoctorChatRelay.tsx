import { ArrowLeft, Send, Clock, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useState } from 'react';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface ChatMessage {
  sender: 'doctor' | 'patient';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export function DoctorChatRelay({ onNavigate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'doctor',
      text: "Bonjour Mme Ben Salem, j'aurais besoin de quelques précisions pour compléter votre dossier. Êtes-vous à jour dans vos vaccinations COVID-19 et grippe ?",
      timestamp: '14:45',
      status: 'read'
    },
    {
      sender: 'patient',
      text: "Bonjour Docteur, oui j'ai eu ma dernière dose de rappel COVID en septembre dernier. Pour la grippe, je l'ai faite en octobre.",
      timestamp: '14:47',
      status: 'delivered'
    },
    {
      sender: 'doctor',
      text: "Parfait, merci. Avez-vous voyagé récemment, dans les 3 dernières semaines ?",
      timestamp: '14:48',
      status: 'read'
    },
    {
      sender: 'patient',
      text: "Non, je n'ai pas voyagé. Je suis restée à Tunis.",
      timestamp: '14:49',
      status: 'delivered'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage: ChatMessage = {
        sender: 'doctor',
        text: inputValue,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
    }
  };

  const quickQuestions = [
    "Avez-vous des allergies médicamenteuses ?",
    "Prenez-vous actuellement des médicaments ?",
    "Avez-vous déjà eu ce type de symptômes ?",
    "Quelqu'un dans votre entourage a-t-il les mêmes symptômes ?"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('doctor-anamnesis-consolidation')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    NB
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-gray-900">Nadia Ben Salem</h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">En ligne</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline">Communication sécurisée RGPD</Badge>
            </div>
            <Button onClick={() => onNavigate('doctor-patient-file')}>
              Retour au dossier
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-4 mb-6 max-h-[550px] overflow-y-auto">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${message.sender === 'doctor' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback 
                        className={message.sender === 'doctor' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}
                      >
                        {message.sender === 'doctor' ? 'KA' : 'NB'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${message.sender === 'doctor' ? 'flex justify-end' : ''}`}>
                      <div
                        className={`inline-block max-w-[85%] p-4 rounded-2xl ${
                          message.sender === 'doctor'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className={`text-sm ${message.sender === 'doctor' ? 'text-white' : 'text-gray-700'}`}>
                          {message.text}
                        </p>
                        <div className={`flex items-center gap-2 mt-2 ${message.sender === 'doctor' ? 'justify-end' : ''}`}>
                          <p className={`text-xs ${message.sender === 'doctor' ? 'text-indigo-100' : 'text-gray-500'}`}>
                            {message.timestamp}
                          </p>
                          {message.sender === 'doctor' && message.status && (
                            <div className="flex gap-0.5">
                              {message.status === 'read' && <CheckCircle className="w-3 h-3 text-indigo-200" />}
                              {message.status === 'delivered' && <CheckCircle className="w-3 h-3 text-indigo-300" />}
                              {message.status === 'sent' && <Clock className="w-3 h-3 text-indigo-300" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="pt-4 border-t border-gray-200">
                <Textarea
                  placeholder="Tapez votre question au patient..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="min-h-[100px] mb-3"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Le patient sera notifié immédiatement
                  </p>
                  <Button onClick={handleSend}>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </Card>

            {/* Responses Archive */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Réponses archivées dans le dossier</h3>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-900">Statut vaccinal confirmé</p>
                    <Badge variant="outline" className="text-green-700 border-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Intégré
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    COVID-19 (sept 2025), Grippe (oct 2025)
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-900">Voyages récents</p>
                    <Badge variant="outline" className="text-green-700 border-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Intégré
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Aucun déplacement dans les 3 dernières semaines
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Questions */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Questions rapides</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cliquez pour utiliser une question prédéfinie
              </p>
              <div className="space-y-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(question)}
                    className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </Card>

            {/* Context Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-3">Contexte du cas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Diagnostic IA</span>
                  <span className="text-gray-900">Pneumonie atypique</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confiance</span>
                  <span className="text-blue-600">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priorité</span>
                  <Badge className="bg-yellow-500">Modérée</Badge>
                </div>
              </div>
            </Card>

            {/* Communication Stats */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages envoyés</span>
                  <span className="text-gray-900">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Réponses reçues</span>
                  <span className="text-gray-900">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temps de réponse moy.</span>
                  <span className="text-green-600">2 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Infos complétées</span>
                  <span className="text-gray-900">2/3</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
