import { Brain, Send, Users, Plus, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Discussion, DiscussionMessage, DiscussionParticipant, Profile, PatientProfile, DoctorProfile } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface Conversation {
  id: string;
  patient: string;
  participants: string[];
  lastMessage: string;
  time: string;
  unread: number;
  discussionId: string;
}

interface Message {
  id: string;
  author: string;
  role: string;
  message: string;
  time: string;
  isOwn: boolean;
}

export function DoctorCollaboration({ onNavigate }: Props) {
  const { currentProfile, isDoctor } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isDoctor || !currentProfile?.doctorProfileId) {
      setLoading(false);
      return;
    }

    loadDoctorProfile();
    loadDiscussions();
  }, [currentProfile, isDoctor]);

  useEffect(() => {
    if (selectedDiscussionId) {
      loadMessages(selectedDiscussionId);
    }
  }, [selectedDiscussionId]);

  const loadDoctorProfile = async () => {
    if (!currentProfile?.doctorProfileId) return;

    const { data: doctor, error } = await supabase
      .from('doctor_profiles')
      .select(`
        *,
        profiles (
          id,
          full_name
        )
      `)
      .eq('id', currentProfile.doctorProfileId)
      .single();

    if (!error && doctor) {
      setDoctorProfile(doctor);
      setProfile(doctor.profiles as Profile);
    }
  };

  const loadDiscussions = async () => {
    if (!currentProfile?.doctorProfileId) return;

    try {
      // Load discussions where current doctor is a participant
      const { data: participants, error: participantsError } = await supabase
        .from('discussion_participants')
        .select(`
          discussion_id,
          discussions (
            id,
            patient_profile_id,
            title,
            created_at,
            patient_profiles (
              profiles (
                full_name
              )
            )
          )
        `)
        .eq('doctor_profile_id', currentProfile.doctorProfileId);

      if (participantsError) throw participantsError;

      if (participants) {
        const formattedConversations: Conversation[] = [];

        for (const participant of participants) {
          const discussion = participant.discussions as any;
          if (!discussion) continue;

          // Get all participants for this discussion
          const { data: allParticipants } = await supabase
            .from('discussion_participants')
            .select(`
              doctor_profiles (
                profiles (
                  full_name
                )
              )
            `)
            .eq('discussion_id', discussion.id);

          const participantNames = (allParticipants || [])
            .map((p: any) => p.doctor_profiles?.profiles?.full_name)
            .filter(Boolean);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('discussion_messages')
            .select('*')
            .eq('discussion_id', discussion.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const patientName = discussion.patient_profiles?.profiles?.full_name || 'Patient inconnu';
          const now = new Date();
          const messageTime = lastMessage ? new Date(lastMessage.created_at) : new Date(discussion.created_at);
          const minutesAgo = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
          const timeStr = minutesAgo < 60 ? `Il y a ${minutesAgo} min` :
                          minutesAgo < 1440 ? `Il y a ${Math.floor(minutesAgo / 60)}h` :
                          `Il y a ${Math.floor(minutesAgo / 1440)}j`;

          formattedConversations.push({
            id: discussion.id,
            patient: patientName,
            participants: participantNames,
            lastMessage: lastMessage?.message_text || 'Aucun message',
            time: timeStr,
            unread: 0, // TODO: Calculate unread count
            discussionId: discussion.id
          });
        }

        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (discussionId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('discussion_messages')
        .select(`
          *,
          sender_profile:profiles!discussion_messages_sender_profile_id_fkey (
            id,
            full_name
          ),
          doctor_profiles (
            specialty
          )
        `)
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messagesData) {
        const formattedMessages: Message[] = messagesData.map((msg: any) => {
          const senderName = msg.sender_profile?.full_name || 'Médecin';
          const senderRole = msg.doctor_profiles?.specialty || 'Médecin';
          const isOwn = msg.sender_profile_id === profile?.id;

          return {
            id: msg.id,
            author: senderName,
            role: senderRole,
            message: msg.message_text,
            time: new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isOwn
          };
        });

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedDiscussionId || !currentProfile?.doctorProfileId || !profile || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('discussion_messages')
        .insert({
          discussion_id: selectedDiscussionId,
          sender_profile_id: profile.id,
          message_text: messageText,
        });

      if (error) throw error;

      setMessageText('');
      // Reload messages
      await loadMessages(selectedDiscussionId);
      // Reload discussions to update last message
      await loadDiscussions();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleCreateDiscussion = async () => {
    // TODO: Implement discussion creation UI
    // For now, this would require selecting a patient first
    alert('Fonctionnalité de création de discussion à implémenter');
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('landing');
  };

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
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">{profile?.full_name || 'Médecin'}</p>
                  <p className="text-xs text-gray-500">{doctorProfile?.specialty || ''}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
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
              {loading ? (
                <div className="text-center py-8 text-gray-500">Chargement des discussions...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune discussion disponible</p>
                  <Button className="mt-4" onClick={handleCreateDiscussion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une discussion
                  </Button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <Card 
                    key={conv.id} 
                    className={`p-4 cursor-pointer transition-all ${
                      selectedDiscussionId === conv.discussionId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDiscussionId(conv.discussionId)}
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
              )))}
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
                {selectedDiscussionId ? (
                  messages.length > 0 ? (
                    messages.map((msg) => (
                  <div 
                    key={msg.id} 
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Aucun message dans cette discussion
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Sélectionnez une discussion pour voir les messages
                  </div>
                )}
              </div>

              {/* Input */}
              {selectedDiscussionId && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    <Textarea 
                      placeholder="Tapez votre message... Utilisez @ pour mentionner un médecin"
                      className="resize-none"
                      rows={2}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !sending && handleSendMessage()}
                      disabled={sending}
                    />
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 self-end"
                      onClick={handleSendMessage}
                      disabled={sending || !messageText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
