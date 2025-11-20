import { ArrowLeft, Brain, Send, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useState } from 'react';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export function PatientChatPrecision({ onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Bonjour ! J'ai remarqué que vous avez mentionné une toux sèche. Pour mieux comprendre votre situation, j'ai quelques questions complémentaires.",
      timestamp: '14:32'
    },
    {
      sender: 'ai',
      text: "Depuis combien de jours exactement avez-vous cette toux ?",
      timestamp: '14:32'
    },
    {
      sender: 'user',
      text: "Cela fait 5 jours maintenant",
      timestamp: '14:33'
    },
    {
      sender: 'ai',
      text: "Merci. Avez-vous remarqué si la toux s'aggrave la nuit ou à un moment particulier de la journée ?",
      timestamp: '14:33'
    },
    {
      sender: 'user',
      text: "Oui, elle est plus forte le soir et la nuit",
      timestamp: '14:34'
    },
    {
      sender: 'ai',
      text: "Cette information est importante. Dernière question : avez-vous des difficultés à respirer, même légères, pendant vos activités quotidiennes ?",
      timestamp: '14:34'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        sender: 'user',
        text: inputValue,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setInputValue('');

      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: "Merci pour ces précisions. Ces informations vont m'aider à affiner mon analyse. Je compile maintenant tous ces éléments pour vous proposer une évaluation complète.",
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-gray-900">HopeVisionAI</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Étape 3 sur 6</span>
            <span className="text-sm text-gray-600">Questions de précision</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Info Banner */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-gray-900 mb-1">Questions de précision</h3>
                <p className="text-sm text-gray-700">
                  L'IA vous pose quelques questions complémentaires pour affiner son analyse 
                  et vous proposer l'évaluation la plus précise possible.
                </p>
              </div>
            </div>
          </Card>

          {/* Chat Container */}
          <Card className="p-6">
            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback 
                      className={message.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-700'}
                    >
                      {message.sender === 'ai' ? <Brain className="w-4 h-4" /> : 'NB'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.sender === 'user' ? 'flex justify-end' : ''}`}>
                    <div
                      className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                        message.sender === 'ai'
                          ? 'bg-white border border-gray-200'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className={`text-sm ${message.sender === 'ai' ? 'text-gray-700' : 'text-white'}`}>
                        {message.text}
                      </p>
                      <p className={`text-xs mt-2 ${message.sender === 'ai' ? 'text-gray-500' : 'text-blue-100'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Input
                placeholder="Tapez votre réponse..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend}>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </Card>

          {/* Quick Responses */}
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Réponses rapides</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Oui, j'ai remarqué cela")}
              >
                Oui, j'ai remarqué cela
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Non, pas du tout")}
              >
                Non, pas du tout
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Je ne suis pas sûr(e)")}
              >
                Je ne suis pas sûr(e)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Seulement parfois")}
              >
                Seulement parfois
              </Button>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => onNavigate('patient-symptoms')}>
            Retour
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigate('patient-results')}
          >
            Terminer les questions et lancer l'analyse IA
          </Button>
        </div>
      </div>
    </div>
  );
}