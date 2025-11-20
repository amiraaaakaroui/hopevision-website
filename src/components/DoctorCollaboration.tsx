import { Brain, Send, Users, Plus, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorCollaboration({ onNavigate }: Props) {
  const conversations = [
    {
      patient: 'Nadia Ben Salem',
      participants: ['Dr Ayari', 'Dr Mansouri'],
      lastMessage: 'Je confirme l\'indication de radio thoracique',
      time: 'Il y a 5 min',
      unread: 2
    },
    {
      patient: 'Ahmed Mansour',
      participants: ['Dr Ayari', 'Dr Khalil'],
      lastMessage: '@cardio Pouvez-vous examiner l\'ECG ?',
      time: 'Il y a 1h',
      unread: 0
    }
  ];

  const messages = [
    {
      author: 'Dr Karim Ayari',
      role: 'Médecine Générale',
      message: 'Patiente de 34 ans avec toux sèche depuis 5 jours, fièvre 38.4°C, CRP élevée à 38 mg/L. L\'IA suggère une pneumonie atypique avec 71% de confiance.',
      time: '14:20',
      isOwn: true
    },
    {
      author: 'Dr Salma Mansouri',
      role: 'Pneumologie',
      message: 'Merci pour le partage @ayari. Les symptômes et marqueurs sont cohérents. Je recommande une radio thoracique en urgence.',
      time: '14:25',
      isOwn: false
    },
    {
      author: 'Dr Karim Ayari',
      role: 'Médecine Générale',
      message: 'Parfait, je prescris la radio. Dois-je commencer une antibiothérapie empirique ?',
      time: '14:27',
      isOwn: true
    },
    {
      author: 'Dr Salma Mansouri',
      role: 'Pneumologie',
      message: 'Oui, Azithromycine 500mg/j pendant 3 jours serait approprié en attendant les résultats.',
      time: '14:30',
      isOwn: false
    }
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
                <p className="text-xs text-gray-500">Espace Médecin</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    KA
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">Dr Karim Ayari</p>
                  <p className="text-xs text-gray-500">Médecine Générale</p>
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
              onClick={() => onNavigate('doctor-dashboard')}
            >
              Cas entrants
            </button>
            <button className="px-1 py-4 border-b-2 border-blue-600 text-blue-600">
              Collaboration
            </button>
            <button 
              className="px-1 py-4 text-gray-600 hover:text-gray-900"
              onClick={() => onNavigate('doctor-audit')}
            >
              Journal d'activité
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Discussions</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </div>

            <div className="space-y-3">
              {conversations.map((conv, index) => (
                <Card 
                  key={index} 
                  className={`p-4 cursor-pointer transition-all ${
                    index === 0 ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-gray-900 mb-1">{conv.patient}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {conv.participants.join(', ')}
                        </span>
                      </div>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="bg-blue-600 text-white">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">
                    {conv.lastMessage}
                  </p>
                  <span className="text-xs text-gray-500">{conv.time}</span>
                </Card>
              ))}
            </div>

            <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-2">💡 Conseil</h3>
              <p className="text-sm text-gray-700">
                Utilisez @ pour mentionner un spécialiste dans la conversation 
                (ex: @pneumo, @cardio)
              </p>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[calc(100vh-280px)]">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 mb-1">Nadia Ben Salem - Cas PAT-2025-00234</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <Avatar className="w-8 h-8 border-2 border-white">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            KA
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="w-8 h-8 border-2 border-white">
                          <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                            SM
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-sm text-gray-600">2 participants</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onNavigate('doctor-patient-file')}
                    >
                      Ouvrir dossier
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Inviter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={msg.isOwn ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                        {msg.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${msg.isOwn ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.isOwn ? (
                          <>
                            <span className="text-xs text-gray-500">{msg.time}</span>
                            <span className="text-sm text-gray-600">{msg.role}</span>
                            <span className="text-gray-900">{msg.author}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-900">{msg.author}</span>
                            <span className="text-sm text-gray-600">{msg.role}</span>
                            <span className="text-xs text-gray-500">{msg.time}</span>
                          </>
                        )}
                      </div>
                      <div 
                        className={`inline-block p-4 rounded-lg ${
                          msg.isOwn 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <Textarea 
                    placeholder="Tapez votre message... Utilisez @ pour mentionner un médecin"
                    className="resize-none"
                    rows={2}
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700 self-end">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
