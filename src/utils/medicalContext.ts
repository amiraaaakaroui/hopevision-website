import { ChatMessage } from '../types/database';

export interface UnifiedMedicalContext {
    text_symptoms: string;
    voice_transcriptions: string[];
    selected_chips: string[];
    image_urls: string[];
    document_urls: string[];
    document_contents: string[]; // NEW: Extracted text from documents
    chat_history: ChatMessage[];
    patient_profile: {
        age?: number;
        gender?: string;
        bloodGroup?: string;
        allergies?: string[];
        medicalHistory?: string;
    };
    combined_text_block: string;
}

export interface RawMedicalData {
    textInput?: string;
    voiceTranscripts?: string[] | string; // Can be array or single string
    selectedChips?: string[];
    imageUrls?: string[];
    documentUrls?: string[];
    documentContents?: string[]; // NEW: Extracted text from documents
    chatMessages?: any[]; // Raw chat messages from DB
    patientProfile?: any;
}

/**
 * Builds a unified medical context from various raw data sources.
 * This ensures all modalities are treated equally and formatted consistently for AI.
 */
export function buildUnifiedMedicalContext(data: RawMedicalData): UnifiedMedicalContext {
    // 1. Normalize data
    const text_symptoms = data.textInput?.trim() || '';

    let voice_transcriptions: string[] = [];
    if (Array.isArray(data.voiceTranscripts)) {
        voice_transcriptions = data.voiceTranscripts.filter(t => t && t.trim().length > 0);
    } else if (typeof data.voiceTranscripts === 'string' && data.voiceTranscripts.trim()) {
        voice_transcriptions = [data.voiceTranscripts];
    }

    const selected_chips = data.selectedChips || [];
    const image_urls = data.imageUrls || [];
    const document_urls = data.documentUrls || [];
    const document_contents = data.documentContents || [];

    // Normalize chat history
    const chat_history: ChatMessage[] = (data.chatMessages || []).map(msg => ({
        role: msg.role || (msg.sender_type === 'patient' ? 'user' : 'assistant'),
        content: msg.content || msg.message_text || ''
    }));

    // Normalize patient profile
    const patient_profile = {
        age: data.patientProfile?.age,
        gender: data.patientProfile?.gender,
        bloodGroup: data.patientProfile?.bloodGroup || data.patientProfile?.blood_group,
        allergies: data.patientProfile?.allergies || [],
        medicalHistory: data.patientProfile?.medicalHistory || data.patientProfile?.medical_history
    };

    // 2. Build Combined Text Block
    let combined_text = '### CONTEXTE MÉDICAL UNIFIÉ ###\n\n';

    // Section: Symptômes écrits
    if (text_symptoms) {
        combined_text += `#### 1. Symptômes écrits (Texte libre) :\n"${text_symptoms}"\n\n`;
    } else {
        combined_text += `#### 1. Symptômes écrits : Aucun\n\n`;
    }

    // Section: Transcriptions vocales
    if (voice_transcriptions.length > 0) {
        combined_text += `#### 2. Transcriptions vocales (${voice_transcriptions.length} enregistrements) :\n`;
        voice_transcriptions.forEach((t, i) => {
            combined_text += `- Enregistrement ${i + 1} : "${t}"\n`;
        });
        combined_text += '\n';
    } else {
        combined_text += `#### 2. Transcriptions vocales : Aucune\n\n`;
    }

    // Section: Puces rapides
    if (selected_chips.length > 0) {
        combined_text += `#### 3. Précisions rapides (Tags) :\n- ${selected_chips.join('\n- ')}\n\n`;
    }

    // Section: Images
    if (image_urls.length > 0) {
        combined_text += `#### 4. Imagerie médicale :\n- ${image_urls.length} image(s) fournie(s)\n`;
        // Note: Image analyses are added separately during report generation for better performance
        // URLs are stored for potential Vision API analysis
        combined_text += `- Analyse des images disponible (à inclure dans le contexte technique)\n\n`;
    }

    // Section: Documents
    if (document_urls.length > 0) {
        combined_text += `#### 5. Documents médicaux :\n- ${document_urls.length} document(s) fourni(s)\n`;

        if (document_contents.length > 0) {
            combined_text += `\n--- CONTENU EXTRAIT DES DOCUMENTS ---\n`;
            document_contents.forEach((content) => {
                combined_text += `${content}\n\n`;
            });
            combined_text += `-------------------------------------\n\n`;
        } else {
            combined_text += `(Aucun contenu textuel extrait)\n\n`;
        }
    }

    // Section: Historique Chat (Questions de précision)
    if (chat_history.length > 0) {
        combined_text += `#### 6. Échange de précision (Chat IA) :\n`;
        chat_history.forEach((msg, i) => {
            const role = msg.role === 'user' ? 'PATIENT' : 'IA';
            combined_text += `[${role}] : ${msg.content}\n`;
        });
        combined_text += '\n';
    }

    // Section: Profil Patient
    combined_text += `#### 7. Profil Patient :\n`;
    if (patient_profile.age) combined_text += `- Âge : ${patient_profile.age} ans\n`;
    if (patient_profile.gender) combined_text += `- Sexe : ${patient_profile.gender}\n`;
    if (patient_profile.bloodGroup) combined_text += `- Groupe sanguin : ${patient_profile.bloodGroup}\n`;
    if (patient_profile.allergies && patient_profile.allergies.length > 0) {
        combined_text += `- Allergies : ${patient_profile.allergies.join(', ')}\n`;
    }
    if (patient_profile.medicalHistory) {
        combined_text += `- Antécédents : ${patient_profile.medicalHistory}\n`;
    }

    // Log for debugging
    console.log("[Unified Medical Context] Generated:", {
        modalities: {
            text: !!text_symptoms,
            voice: voice_transcriptions.length,
            chips: selected_chips.length,
            images: image_urls.length,
            documents: document_urls.length,
            document_contents: document_contents.length,
            chat: chat_history.length
        },
        combined_length: combined_text.length
    });

    return {
        text_symptoms,
        voice_transcriptions,
        selected_chips,
        image_urls,
        document_urls,
        document_contents,
        chat_history,
        patient_profile,
        combined_text_block: combined_text
    };
}
