/**
 * useAudioRecording Hook
 * Handles audio recording and transcription logic
 * Separated from UI components for Clean Architecture
 */

import { useState, useRef } from 'react';
import { transcribeAudio } from '../lib/openaiService';
import { uploadAudio } from '../services/storageService';

export interface UseAudioRecordingReturn {
  recording: boolean;
  transcribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  transcript: string | null;
  error: string | null;
  clearTranscript: () => void;
}

export function useAudioRecording(patientProfileId: string | undefined): UseAudioRecordingReturn {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Auto-transcribe immediately after stop (async, don't await)
        transcribeAudioFile(blob).catch(err => {
          console.error('Error in auto-transcription:', err);
        });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Erreur lors du démarrage de l\'enregistrement. Vérifiez les permissions du microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current = null;
    }
  };

  const transcribeAudioFile = async (audioBlob: Blob) => {
    if (!patientProfileId) {
      setError('Veuillez vous connecter en tant que patient');
      return;
    }

    setTranscribing(true);
    setError(null);

    try {
      // Upload audio to storage (optional, for persistence)
      try {
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        await uploadAudio(audioFile, patientProfileId);
      } catch (uploadError) {
        console.warn('Audio upload failed, continuing with transcription:', uploadError);
        // Continue with transcription even if upload fails
      }

      // Convert blob to File for Whisper API
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

      // Transcribe using OpenAI Whisper
      const transcriptText = await transcribeAudio(audioFile);

      if (transcriptText) {
        setTranscript(transcriptText);
      } else {
        throw new Error('Transcription vide');
      }
    } catch (err: any) {
      console.error('Error transcribing audio:', err);
      setError(`Erreur lors de la transcription: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setTranscribing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript(null);
  };

  return {
    recording,
    transcribing,
    startRecording,
    stopRecording,
    transcript,
    error,
    clearTranscript,
  };
}

