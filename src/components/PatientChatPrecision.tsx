import { ArrowLeft, Brain, Send, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { ChatPrecisionMessage } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  id?: string;
}

export function PatientChatPrecision({ onNavigate }: Props) {
  const { currentProfile, isPatient } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [preAnalysisId, setPreAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: Get pre_analysis_id from sessionStorage
    // This MUST exist - if not, redirect to dashboard (error in workflow)
    const storedId = sessionStorage.getItem('currentPreAnalysisId');
    console.log(`[PatientChatPrecision] 🔍 Loading component with pre_analysis_id from sessionStorage: ${storedId}`);
    
    if (!storedId || typeof storedId !== 'string' || storedId.trim() === '') {
      // CRITICAL: No pre_analysis_id - this is an error in the workflow
      // Don't try to guess or fetch "most recent" - redirect to dashboard
      console.error(`[PatientChatPrecision] ❌ CRITICAL: No pre_analysis_id in sessionStorage! Redirecting to dashboard.`);
      alert('Erreur: Aucune pré-analyse active. Veuillez recommencer.');
      onNavigate('patient-history');
      setLoading(false);
      return;
    }

    if (!isPatient) {
      console.warn(`[PatientChatPrecision] ⚠️ User is not a patient`);
      setLoading(false);
      return;
    }

    // CRITICAL: Validate that storedId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(storedId)) {
      console.error(`[PatientChatPrecision] ❌ Invalid UUID format in sessionStorage: ${storedId}`);
      alert('Erreur: ID de pré-analyse invalide. Veuillez recommencer.');
      onNavigate('patient-history');
      setLoading(false);
      return;
    }

    console.log(`[PatientChatPrecision] ✅ Valid pre_analysis_id found: ${storedId}`);
    setPreAnalysisId(storedId);
    loadMessages(storedId);
  }, [isPatient, onNavigate]);

  // Generate first AI question when component loads and no messages exist
  useEffect(() => {
    if (!loading && preAnalysisId && messages.length === 0) {
      generateFirstQuestion();
    }
  }, [loading, preAnalysisId, messages.length]);

  const generateFirstQuestion = async () => {
    try {
      setSending(true);
      
      // CRITICAL: Use the service which handles multimodal support
      const firstQuestion = await requestAiResponse([]);

      // CRITICAL: Use the service to save the message
      const { saveMessage } = await import('../services/chatService');
      const aiMessage = await saveMessage({
        preAnalysisId: preAnalysisId!,
        senderType: 'ai',
        messageText: firstQuestion,
      });

      // Add to messages
      const aiMessageFormatted: Message = {
        sender: 'ai',
        text: firstQuestion,
        timestamp: aiMessage.timestamp,
        id: aiMessage.id,
      };
      setMessages([aiMessageFormatted]);
    } catch (error: any) {
      console.error('Error generating first question:', error);
      // Add fallback message
      const fallbackMessage: Message = {
        sender: 'ai',
        text: 'Bonjour ! Je vais vous poser quelques questions pour mieux comprendre vos symptômes. Pouvez-vous me décrire plus en détail ce que vous ressentez ?',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([fallbackMessage]);
    } finally {
      setSending(false);
    }
  };

  const loadMessages = async (preAnalysisId: string) => {
    try {
      console.log(`[PatientChatPrecision] 📥 Loading messages for pre_analysis_id: ${preAnalysisId}`);
      
      // CRITICAL: Validate preAnalysisId before calling service
      if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
        console.error(`[PatientChatPrecision] ❌ Invalid pre_analysis_id: ${preAnalysisId}`);
        setLoading(false);
        return;
      }

      // CRITICAL: Use the service instead of direct Supabase call
      const { loadMessages } = await import('../services/chatService');
      const loadedMessages = await loadMessages({ preAnalysisId });

      console.log(`[PatientChatPrecision] ✅ Loaded ${loadedMessages.length} messages for pre_analysis_id: ${preAnalysisId}`);

      // Convert service format to component format
      const formattedMessages: Message[] = loadedMessages.map(msg => ({
        sender: msg.sender === 'patient' ? 'user' : 'ai',
        text: msg.text,
        timestamp: msg.timestamp,
        id: msg.id,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error(`[PatientChatPrecision] ❌ Error loading messages for pre_analysis_id ${preAnalysisId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const requestAiResponse = async (conversationHistory: Message[]): Promise<string> => {
    try {
      // CRITICAL: Use the refactored chatService instead of old logic
      // This ensures multimodal support (images + documents) and strict isolation
      if (!preAnalysisId) {
        console.error(`[PatientChatPrecision] ❌ Pre-analysis ID is missing!`);
        throw new Error('Pre-analysis ID is required');
      }

      console.log(`[PatientChatPrecision] 🤖 Requesting AI response for pre_analysis_id: ${preAnalysisId}`);
      console.log(`[PatientChatPrecision] 📝 Frontend provided ${conversationHistory.length} messages (will be ignored - service loads from DB)`);

      // Import the service
      const { generateAIResponse } = await import('../services/chatService');

      // Convert conversationHistory to the format expected by the service
      const formattedHistory = conversationHistory.map(msg => ({
        sender: msg.sender === 'user' ? 'patient' : 'ai',
        text: msg.text,
        timestamp: msg.timestamp,
        id: msg.id,
      }));

      // CRITICAL: Use the service which handles:
      // - Document extraction
      // - Vision API for images
      // - Complete history from DB
      // - Strict isolation
      return await generateAIResponse({
        preAnalysisId,
        conversationHistory: formattedHistory,
      });
    } catch (error: any) {
      console.error('Error generating AI response:', error);

      // Fallback message if OpenAI fails
      if (conversationHistory.length === 0) {
        return "Bonjour ! Je vais vous poser quelques questions pour mieux comprendre vos symptômes. Pouvez-vous me décrire plus en détail ce que vous ressentez ?";
      } else {
        return "Merci pour ces précisions. Puis-je avoir quelques détails supplémentaires pour affiner mon analyse ?";
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !preAnalysisId || sending) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      // CRITICAL: Use the service instead of direct Supabase call
      const { saveMessage } = await import('../services/chatService');

      // Save patient message using service
      const savedMessage = await saveMessage({
        preAnalysisId,
        senderType: 'patient',
        messageText,
      });

      // Add patient message to UI
      const patientMessage: Message = {
        sender: 'user',
        text: messageText,
        timestamp: savedMessage.timestamp,
        id: savedMessage.id,
      };
      setMessages(prev => [...prev, patientMessage]);

      // CRITICAL: The service generateAIResponse will load complete history from DB
      // So we just pass the current messages (it will be ignored, but kept for UI consistency)
      const currentHistory: Message[] = [...messages, patientMessage];

      // Request AI response - service will load complete history from DB
      const aiResponseText = await requestAiResponse(currentHistory);

      // Save AI response using service
      const aiMessage = await saveMessage({
        preAnalysisId,
        senderType: 'ai',
        messageText: aiResponseText,
      });

      // Add AI message to UI
      const aiMessageFormatted: Message = {
        sender: 'ai',
        text: aiResponseText,
        timestamp: aiMessage.timestamp,
        id: aiMessage.id,
      };
      setMessages(prev => [...prev, aiMessageFormatted]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`Erreur lors de l'envoi du message: ${error.message || 'Veuillez réessayer.'}`);
      setInputValue(messageText); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const handleFinish = async () => {
    if (!preAnalysisId) {
      alert('Erreur: ID de pré-analyse manquant');
      return;
    }

    setSending(true);

    try {
      // First, verify pre-analysis exists and we can update it
      const { data: existingPreAnalysis, error: checkError } = await supabase
        .from('pre_analyses')
        .select('id, status')
        .eq('id', preAnalysisId)
        .single();

      if (checkError) {
        console.error('[PatientChatPrecision] Error checking pre-analysis:', checkError);
        throw new Error(`Pré-analyse non trouvée: ${checkError.message}`);
      }

      if (!existingPreAnalysis) {
        throw new Error('Pré-analyse non trouvée');
      }

      // CRITICAL: Use the service instead of direct Supabase calls
      // This ensures strict isolation and prevents data leakage
      const { submitPreAnalysis, getPreAnalysis } = await import('../services/preAnalysisService');
      
      // CRITICAL: Verify pre-analysis exists and belongs to current patient
      const preAnalysis = await getPreAnalysis(preAnalysisId);
      
      if (!preAnalysis) {
        throw new Error('Pré-analyse non trouvée');
      }

      if (!currentProfile?.patientProfileId || preAnalysis.patient_profile_id !== currentProfile.patientProfileId) {
        throw new Error('Vous n\'avez pas l\'autorisation de modifier cette pré-analyse');
      }

      // CRITICAL: DO NOT pollute text_input with chat content
      // The chat remains in its dedicated table (chat_precision_messages)
      // The report generation will load chat separately via pre_analysis_id
      // This prevents data leakage between analyses
      await submitPreAnalysis(
        preAnalysisId,
        currentProfile.patientProfileId
        // CRITICAL: Do NOT pass enrichedText - keep text_input clean
        // The chat is loaded separately in aiReportService via pre_analysis_id
      );

      // Navigate to results (which will trigger AI report generation)
      onNavigate('patient-results');
    } catch (error: any) {
      console.error('[PatientChatPrecision] Error finishing chat:', error);

      // Show detailed error message
      let errorMessage = 'Erreur lors de la finalisation. ';

      if (error.message) {
        errorMessage += error.message;
      } else if (error.code) {
        errorMessage += `Code d'erreur: ${error.code}`;
      } else {
        errorMessage += 'Veuillez réessayer.';
      }

      alert(errorMessage);
    } finally {
      setSending(false);
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
                      key={idx}
                      className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback
                          className={message.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-700'}
                        >
                          {message.sender === 'ai' ? <Brain className="w-4 h-4" /> : currentProfile?.profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.sender === 'user' ? 'flex justify-end' : ''}`}>
                        <div
                          className={`inline-block max-w-[80%] p-4 rounded-2xl ${message.sender === 'ai'
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