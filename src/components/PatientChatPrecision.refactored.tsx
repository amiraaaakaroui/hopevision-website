/**
 * PatientChatPrecision Component - REFACTORED VERSION
 * Clean Architecture: UI only, all business logic in services
 */

import { ArrowLeft, Brain, Send, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loadMessages, saveMessage, generateAIResponse, loadCompleteHistory, getPatientAnswers } from '../services/chatService';
import { submitPreAnalysis, getPreAnalysis } from '../services/preAnalysisService';
import type { ChatMessage } from '../services/chatService';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientChatPrecision({ onNavigate }: Props) {
  const { currentProfile, isPatient } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [preAnalysisId, setPreAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = sessionStorage.getItem('currentPreAnalysisId');
    if (storedId && isPatient) {
      setPreAnalysisId(storedId);
      loadMessagesFromService(storedId);
    } else {
      setLoading(false);
    }
  }, [isPatient]);

  // Generate first AI question when component loads and no messages exist
  useEffect(() => {
    if (!loading && preAnalysisId && messages.length === 0) {
      generateFirstQuestion();
    }
  }, [loading, preAnalysisId, messages.length]);

  const loadMessagesFromService = async (preAnalysisId: string) => {
    try {
      const loadedMessages = await loadMessages({ preAnalysisId });
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFirstQuestion = async () => {
    try {
      setSending(true);
      
      // Use service for AI response generation
      const firstQuestion = await generateAIResponse({
        preAnalysisId: preAnalysisId!,
        conversationHistory: [],
      });

      // Save AI's first question using service
      const aiMessage = await saveMessage({
        preAnalysisId: preAnalysisId!,
        senderType: 'ai',
        messageText: firstQuestion,
      });

      setMessages([aiMessage]);
    } catch (error) {
      console.error('Error generating first question:', error);
      // Add fallback message
      const fallbackMessage: ChatMessage = {
        sender: 'ai',
        text: 'Bonjour ! Je vais vous poser quelques questions pour mieux comprendre vos symptômes. Pouvez-vous me décrire plus en détail ce que vous ressentez ?',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([fallbackMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !preAnalysisId || sending) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      // Save patient message using service
      const patientMessage = await saveMessage({
        preAnalysisId,
        senderType: 'patient',
        messageText,
      });

      setMessages(prev => [...prev, patientMessage]);

      // Load complete history before generating AI response
      const completeHistory = await loadCompleteHistory(preAnalysisId);

      // Generate AI response using service
      const aiResponseText = await generateAIResponse({
        preAnalysisId,
        conversationHistory: completeHistory,
      });

      // Save AI response using service
      const aiMessage = await saveMessage({
        preAnalysisId,
        senderType: 'ai',
        messageText: aiResponseText,
      });

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`Erreur lors de l'envoi du message: ${error.message || 'Veuillez réessayer.'}`);
      setInputValue(messageText); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const handleFinish = async () => {
    if (!preAnalysisId || !currentProfile?.patientProfileId) {
      alert('Erreur: ID de pré-analyse manquant');
      return;
    }

    setSending(true);

    try {
      // Verify pre-analysis exists
      const preAnalysis = await getPreAnalysis(preAnalysisId);
      if (!preAnalysis) {
        throw new Error('Pré-analyse non trouvée');
      }

      // Get patient answers from chat
      const patientAnswers = await getPatientAnswers(preAnalysisId);

      // Build enriched text combining all modalities + chat answers
      const enrichedText = [
        preAnalysis.text_input,
        preAnalysis.voice_transcript,
        patientAnswers,
      ].filter(Boolean).join('\n\n---\n\n');

      // Submit pre-analysis using service
      await submitPreAnalysis(preAnalysisId, currentProfile.patientProfileId, enrichedText);

      // Navigate to results
      onNavigate('patient-results');
    } catch (error: any) {
      console.error('[PatientChatPrecision] Error finishing chat:', error);
      alert(`Erreur lors de la finalisation: ${error.message || 'Veuillez réessayer.'}`);
    } finally {
      setSending(false);
    }
  };

  // UI rendering (no business logic)
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
            {loading ? (
              <div className="text-center py-8 text-gray-500">Chargement des messages...</div>
            ) : (
              <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>L'IA va vous poser des questions pour affiner l'analyse.</p>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div
                      key={message.id || idx}
                      className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback
                          className={message.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-700'}
                        >
                          {message.sender === 'ai' ? (
                            <Brain className="w-4 h-4" />
                          ) : (
                            currentProfile?.profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT'
                          )}
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
                  ))
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Input
                placeholder="Tapez votre réponse..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && handleSend()}
                className="flex-1"
                disabled={sending || !preAnalysisId}
              />
              <Button onClick={handleSend} disabled={sending || !preAnalysisId || !inputValue.trim()}>
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Envoi...' : 'Envoyer'}
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
            onClick={handleFinish}
            disabled={!preAnalysisId || sending}
          >
            {sending ? 'Finalisation...' : 'Terminer les questions et lancer l\'analyse IA'}
          </Button>
        </div>
      </div>
    </div>
  );
}

