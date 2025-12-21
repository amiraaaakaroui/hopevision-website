import React, { useState, useEffect, useMemo } from 'react';
import {
    Activity,
    Heart,
    Weight,
    Stethoscope,
    FileText,
    Sparkles,
    Calendar,
    Clock,
    Download,
    Plus,
    ShieldCheck,
    X,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    Eye,
    EyeOff,
    Brain,
    Thermometer,
    AlertTriangle,
    ArrowRight,
    Syringe,
    ChevronRight,
    ClipboardList,
    Lock,
    Droplets,
    Lightbulb,
    Play,
    FileBarChart
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Tooltip,
    XAxis,
    ReferenceLine,
    CartesianGrid
} from 'recharts';
import type { Screen } from '../../App';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import type {
    PatientProfile,
    Profile,
    PreAnalysis,
    AIReport,
    Appointment,
    DoctorNote
} from '../../types/database';
import { clearAnalysisSession } from '../../services/analysisWorkflowService';
import { isPatientProfileIncomplete } from '../../utils/profileHelpers';

const SensitiveData = ({
    children,
    isPrivacyMode,
    className = ""
}: {
    children: React.ReactNode;
    isPrivacyMode: boolean;
    className?: string;
}) => {
    if (isPrivacyMode) {
        return (
            <span
                className={`inline-flex items-center bg-slate-100 text-slate-400 rounded px-2 py-0.5 text-xs font-mono select-none cursor-help ${className}`}
                title="Donnée masquée"
            >
                <Lock size={10} className="mr-1" /> ••••
            </span>
        );
    }
    return <span className={className}>{children}</span>;
};

type HealthStatus = "stable" | "monitoring" | "consultation" | "emergency";

interface ClinicalState {
    status: HealthStatus;
    statusLabel: string;
    symptomsSummary: string;
    aiAnalysis: string;
    lastUpdate: string;
}

interface PriorityAction {
    id: string;
    type: 'analysis' | 'booking' | 'upload' | 'reminder';
    label: string;
    subLabel?: string;
    priority?: 'high' | 'normal';
    preAnalysisId?: string;
}

interface SymptomEvolution {
    symptomName: string;
    trend: 'improvement' | 'stable' | 'worsening';
    trendLabel: string;
    description: string;
    dataPoints: { day: string; value: number }[];
    targetValue?: number;
}

type VitalType =
    | "blood_pressure"
    | "heart_rate"
    | "weight"
    | "temperature"
    | "glucose"
    | "height"
    | "blood_group";

interface VitalCardDef {
    id: string;
    type: VitalType;
    label: string;
    value: string;
    unit: string;
    icon: React.ElementType;
    added: boolean;
}

type HistoryItemType =
    | 'pre_analysis'
    | 'ai_report'
    | 'consultation'
    | 'reservation'
    | 'lab'
    | 'doctor_note'
    | 'reminder';

interface HistoryItem {
    id: string | number;
    type: HistoryItemType;
    title: string;
    date: string;
    status: 'completed' | 'in_progress' | 'available';
    result?: string;
    doctor?: string;
    preAnalysisId?: string;
    appointmentId?: string;
    aiReportId?: string;
}

interface PatientDashboardProps {
    onNavigate: (screen: Screen) => void;
}

type PreAnalysisWithReport = PreAnalysis & {
    ai_reports?: Array<
        Pick<
            AIReport,
            | 'id'
            | 'overall_severity'
            | 'overall_confidence'
            | 'primary_diagnosis'
            | 'summary'
            | 'recommendation_action'
            | 'recommendation_text'
            | 'created_at'
        >
    >;
};

type TimelineRecord = {
    id: string | number;
    event_type: string;
    event_title: string;
    event_description?: string;
    status?: string;
    event_date: string;
    related_appointment?: {
        id: string;
        scheduled_date?: string;
        scheduled_time?: string;
        doctor_profiles?: {
            specialty?: string | null;
            profiles?: {
                full_name?: string | null;
            } | null;
        } | null;
    } | null;
    related_ai_report?: {
        id: string;
        pre_analysis_id?: string | null;
        primary_diagnosis?: string | null;
        overall_severity?: 'low' | 'medium' | 'high' | null;
        overall_confidence?: number | null;
    } | null;
};

type AppointmentWithDoctor = Appointment & {
    doctor_profiles?: {
        specialty?: string | null;
        profiles?: {
            full_name?: string | null;
            avatar_url?: string | null;
        } | null;
    } | null;
};

type DoctorNoteWithDoctor = DoctorNote & {
    doctor_profiles?: {
        profiles?: {
            full_name?: string | null;
        } | null;
    } | null;
};

interface TreatmentItem {
    id: string;
    name: string;
    instructions: string;
    status: 'taken' | 'active';
    lastTaken?: string;
    doctor?: string;
}

const ALL_VITALS: VitalCardDef[] = [
    { id: 'v1', type: 'weight', label: 'Poids', value: '--', unit: 'kg', icon: Weight, added: true },
    { id: 'v2', type: 'height', label: 'Taille', value: '--', unit: 'cm', icon: TrendingUp, added: true },
    { id: 'v3', type: 'blood_group', label: 'Groupe sanguin', value: '--', unit: '', icon: Droplets, added: true },
    { id: 'v4', type: 'blood_pressure', label: 'Tension', value: '--', unit: 'mmHg', icon: Activity, added: false },
    { id: 'v5', type: 'heart_rate', label: 'Fréquence', value: '--', unit: 'bpm', icon: Heart, added: false },
    { id: 'v6', type: 'temperature', label: 'Température', value: '--', unit: '°C', icon: Thermometer, added: false },
    { id: 'v7', type: 'glucose', label: 'Glycémie', value: '--', unit: 'g/L', icon: Droplets, added: false },
];

const severityStatusMap: Record<'low' | 'medium' | 'high', { status: HealthStatus; label: string }> = {
    low: { status: 'stable', label: 'Stable' },
    medium: { status: 'monitoring', label: 'À surveiller' },
    high: { status: 'consultation', label: 'Consulter un médecin' }
};

const severityScoreMap: Record<'low' | 'medium' | 'high', number> = {
    low: 2,
    medium: 5,
    high: 8
};

const preAnalysisStatusScore: Record<PreAnalysis['status'], number> = {
    draft: 4,
    submitted: 5,
    processing: 7,
    completed: 3,
    cancelled: 5,
    booked: 4
};

const hydrateVitalValue = (vital: VitalCardDef, profile?: PatientProfile | null) => {
    if (!profile) return vital;
    if (vital.type === 'weight' && typeof profile.weight_kg === 'number') {
        return { ...vital, value: profile.weight_kg.toFixed(1) };
    }
    if (vital.type === 'height' && typeof profile.height_cm === 'number') {
        return { ...vital, value: profile.height_cm.toFixed(0) };
    }
    if (vital.type === 'blood_group' && profile.blood_group) {
        return { ...vital, value: profile.blood_group };
    }
    return vital;
};

const getSeverityScore = (severity?: 'low' | 'medium' | 'high' | null) => severityScoreMap[severity ?? 'medium'];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bonne après-midi";
    return "Bonsoir";
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
};

const formatAppointmentDate = (appointment: AppointmentWithDoctor) => {
    const date = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time || '09:00'}`);
    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(date);
};

const formatAppointmentTime = (appointment: AppointmentWithDoctor) => {
    if (!appointment.scheduled_time) return '';
    return appointment.scheduled_time.slice(0, 5);
};

const summarizeSymptoms = (analysis: PreAnalysis): string => {
    if (analysis.text_input) {
        return analysis.text_input.length > 120 ? `${analysis.text_input.substring(0, 117)}...` : analysis.text_input;
    }
    if (analysis.selected_chips?.length) {
        return analysis.selected_chips.join(', ');
    }
    if (analysis.voice_transcript) {
        return analysis.voice_transcript.length > 120 ? `${analysis.voice_transcript.substring(0, 117)}...` : analysis.voice_transcript;
    }
    return "Décrivez vos symptômes pour obtenir une analyse personnalisée.";
};

const buildClinicalState = (preAnalyses: PreAnalysisWithReport[]): ClinicalState | null => {
    if (!preAnalyses.length) return null;

    const withReport = preAnalyses.find(pa => pa.ai_reports && pa.ai_reports.length > 0);
    const latest = withReport ?? preAnalyses[0];
    const report = withReport?.ai_reports?.[0];

    if (report) {
        const severity = report.overall_severity ?? 'medium';
        const severityConfig = severityStatusMap[severity];
        const isEmergency = severity === 'high' && (report.overall_confidence ?? 0) >= 85;

        return {
            status: isEmergency ? 'emergency' : severityConfig.status,
            statusLabel: isEmergency ? 'Urgence' : severityConfig.label,
            symptomsSummary: summarizeSymptoms(latest),
            aiAnalysis:
                report.recommendation_text ||
                report.summary ||
                report.recommendation_action ||
                `Diagnostic principal : ${report.primary_diagnosis ?? 'à confirmer'}`,
            lastUpdate: new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(report.created_at ?? latest.updated_at ?? latest.created_at))
        };
    }

    return {
        status: mapPreAnalysisStatusToHealthStatus(latest.status),
        statusLabel: mapPreAnalysisStatusLabel(latest.status),
        symptomsSummary: summarizeSymptoms(latest),
        aiAnalysis:
            latest.status === 'draft'
                ? "Complétez votre pré-analyse pour recevoir une synthèse personnalisée."
                : latest.status === 'submitted'
                    ? "Pré-analyse envoyée à l'IA – nous vous avertirons dès que le rapport est prêt."
                    : "Analyse IA en cours – surveillez votre historique pour les résultats.",
        lastUpdate: new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(latest.updated_at ?? latest.created_at))
    };
};

const buildSymptomEvolution = (preAnalyses: PreAnalysisWithReport[]): SymptomEvolution | null => {
    if (!preAnalyses.length) return null;

    const analysesWithReports = preAnalyses.filter(pa => pa.ai_reports && pa.ai_reports.length > 0);
    const dataSource = analysesWithReports.length > 0 ? analysesWithReports : preAnalyses;
    const lastFive = dataSource.slice(0, 5);
    const points = lastFive
        .map((analysis) => {
            const date = new Date(analysis.created_at);
            const report = analysis.ai_reports?.[0];
            return {
                day: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date),
                value: report ? getSeverityScore(report.overall_severity) : preAnalysisStatusScore[analysis.status] ?? 5
            };
        })
        .reverse();

    const firstValue = points[0]?.value ?? 5;
    const lastValue = points[points.length - 1]?.value ?? 5;
    const delta = lastValue - firstValue;
    const trend: SymptomEvolution['trend'] = delta < -1 ? 'improvement' : delta > 1 ? 'worsening' : 'stable';
    const trendLabel = trend === 'improvement' ? 'Amélioration' : trend === 'worsening' ? 'Dégradation' : 'Stable';

    return {
        symptomName:
            analysesWithReports.length > 0
                ? (lastFive[0].ai_reports?.[0]?.primary_diagnosis || 'Symptômes suivis')
                : 'Pré-analyses récentes',
        trend,
        trendLabel,
        description: `Niveau de sévérité passé de ${firstValue}/10 à ${lastValue}/10.`,
        targetValue: 2,
        dataPoints: points
    };
};

const buildHistoryFromData = (
    timelineEvents: TimelineRecord[] = [],
    preAnalyses: PreAnalysisWithReport[] = []
): HistoryItem[] => {
    const items: HistoryItem[] = [];

    timelineEvents.forEach(event => {
        const type = mapEventTypeToHistoryType(event.event_type);
        items.push({
            id: event.id,
            type,
            title: event.event_title || 'Événement médical',
            date: event.event_date,
            status: event.status === 'completed'
                ? 'completed'
                : event.status === 'available'
                    ? 'available'
                    : 'in_progress',
            result:
                type === 'ai_report'
                    ? event.related_ai_report?.primary_diagnosis ?? 'Rapport IA'
                    : event.event_description,
            doctor: event.related_appointment?.doctor_profiles?.profiles?.full_name ?? undefined,
            appointmentId: event.related_appointment?.id ?? undefined,
            aiReportId: event.related_ai_report?.id ?? undefined,
            preAnalysisId: event.related_ai_report?.pre_analysis_id ?? undefined
        });
    });

    preAnalyses.forEach(analysis => {
        items.push({
            id: `analysis-${analysis.id}`,
            type: 'pre_analysis',
            title: analysis.status === 'completed' ? 'Pré-analyse terminée' : 'Pré-analyse en cours',
            date: analysis.updated_at || analysis.created_at,
            status: mapPreAnalysisStatusToHistoryStatus(analysis.status),
            result: summarizeSymptoms(analysis),
            doctor: analysis.ai_reports?.[0]?.primary_diagnosis ?? undefined,
            preAnalysisId: analysis.id,
            aiReportId: analysis.ai_reports?.[0]?.id
        });
    });

    return items
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);
};

const computePriorityActions = ({
    clinicalState,
    hasOngoingAnalysis,
    hasUpcomingAppointment,
    profileIncomplete,
    hasRecentReport,
    ongoingPreAnalysisId
}: {
    clinicalState: ClinicalState | null;
    hasOngoingAnalysis: boolean;
    hasUpcomingAppointment: boolean;
    profileIncomplete: boolean;
    hasRecentReport: boolean;
    ongoingPreAnalysisId?: string | null;
}): PriorityAction[] => {
    const actions: PriorityAction[] = [];

    if (hasOngoingAnalysis && ongoingPreAnalysisId) {
        actions.push({
            id: 'resume-analysis',
            type: 'analysis',
            label: 'Reprendre votre pré-analyse',
            subLabel: 'Continuez là où vous vous êtes arrêté',
            priority: 'high',
            preAnalysisId: ongoingPreAnalysisId
        });
        actions.push({
            id: 'start-analysis',
            type: 'analysis',
            label: 'Lancer une nouvelle pré-analyse IA',
            subLabel: 'Temps estimé : 3 min',
            priority: 'normal'
        });
    } else {
        actions.push({
            id: 'start-analysis',
            type: 'analysis',
            label: 'Lancer une nouvelle pré-analyse IA',
            subLabel: 'Temps estimé : 3 min',
            priority: 'high'
        });
    }

    if (!hasUpcomingAppointment && clinicalState && (clinicalState.status === 'consultation' || clinicalState.status === 'emergency')) {
        actions.push({
            id: 'book-visit',
            type: 'booking',
            label: 'Planifier une consultation',
            subLabel: clinicalState.status === 'emergency'
                ? 'Priorité immédiate'
                : 'Recommandé sous 48h',
            priority: 'high'
        });
    }

    if (profileIncomplete) {
        actions.push({
            id: 'complete-profile',
            type: 'upload',
            label: 'Compléter votre dossier patient',
            subLabel: 'Ajoutez allergies et antécédents',
            priority: 'normal'
        });
    } else if (!hasRecentReport) {
        actions.push({
            id: 'documents',
            type: 'reminder',
            label: 'Importer vos documents médicaux',
            subLabel: 'Résultats labo, ordonnances',
            priority: 'normal'
        });
    }

    return actions;
};

const pickNextAppointment = (appointments: AppointmentWithDoctor[] = []): AppointmentWithDoctor | null => {
    if (!appointments.length) return null;
    const now = Date.now();
    return (
        [...appointments]
            .sort((a, b) =>
                new Date(`${a.scheduled_date}T${a.scheduled_time || '00:00'}`).getTime() -
                new Date(`${b.scheduled_date}T${b.scheduled_time || '00:00'}`).getTime()
            )
            .find(appt => new Date(`${appt.scheduled_date}T${appt.scheduled_time || '00:00'}`).getTime() >= now) || null
    );
};

const mapTreatments = (notes: DoctorNoteWithDoctor[] = []): TreatmentItem[] => {
    return notes.map(note => ({
        id: note.id,
        name: note.prescription_text?.split('\n')[0]?.trim() || note.doctor_diagnosis || 'Traitement personnalisé',
        instructions: note.treatment_plan || note.prescription_text || note.doctor_notes || 'Suivez les recommandations de votre médecin.',
        status: 'active',
        lastTaken: note.updated_at || note.created_at,
        doctor: note.doctor_profiles?.profiles?.full_name || undefined
    }));
};

const mapEventTypeToHistoryType = (eventType: string): HistoryItemType => {
    switch (eventType) {
        case 'appointment':
        case 'consultation':
            return 'consultation';
        case 'pre_analysis':
            return 'pre_analysis';
        case 'booking':
        case 'reservation':
            return 'reservation';
        case 'exam':
        case 'lab':
        case 'analysis_result':
            return 'lab';
        case 'ai_report':
            return 'ai_report';
        case 'doctor_note':
        case 'prescription':
            return 'doctor_note';
        case 'reminder':
        case 'follow_up':
            return 'reminder';
        default:
            return 'consultation';
    }
};

const mapPreAnalysisStatusToHistoryStatus = (status: PreAnalysis['status']): 'completed' | 'in_progress' | 'available' => {
    if (status === 'completed' || status === 'booked') {
        return 'completed';
    }
    if (status === 'processing' || status === 'submitted' || status === 'draft') {
        return 'in_progress';
    }
    return 'available';
};

const mapPreAnalysisStatusToHealthStatus = (status: PreAnalysis['status']): HealthStatus => {
    switch (status) {
        case 'draft':
        case 'submitted':
            return 'monitoring';
        case 'processing':
            return 'consultation';
        case 'completed':
        case 'booked':
            return 'consultation';
        default:
            return 'stable';
    }
};

const mapPreAnalysisStatusLabel = (status: PreAnalysis['status']): string => {
    switch (status) {
        case 'draft':
            return 'À compléter';
        case 'submitted':
            return 'Soumise';
        case 'processing':
            return 'Analyse en cours';
        case 'completed':
            return 'Terminée';
        case 'booked':
            return 'Planifiée';
        default:
            return 'Enregistrée';
    }
};

const ClinicalStateCard = ({
    state,
    isPrivacyMode,
    onDetailsClick,
    onStartAnalysis
}: {
    state: ClinicalState | null;
    isPrivacyMode: boolean;
    onDetailsClick: () => void;
    onStartAnalysis: () => void;
}) => {
    const styles = getStatusStyles(state?.status ?? 'monitoring');
    const StatusIcon = styles.icon;

    if (!state) {
        return (
            <div className="bg-white rounded-[20px] p-5 border border-violet-100 shadow-sm h-full flex flex-col justify-between">
                <div>
                    <h3 className="text-xs font-bold text-violet-900 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <Brain size={16} className="text-violet-600" /> Votre état aujourd’hui
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Aucune analyse récente. Lancez une pré-analyse pour obtenir un suivi personnalisé.
                    </p>
                </div>
                <button
                    onClick={onStartAnalysis}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles size={16} className="stroke-[2.5px]" /> Démarrer
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[20px] p-5 border border-violet-100 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-full -mr-8 -mt-8 opacity-60"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-violet-900 uppercase tracking-widest flex items-center gap-2">
                        <Brain size={16} className="text-violet-600" /> Votre état aujourd’hui
                    </h3>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles.bg} ${styles.text} ${styles.border} shadow-sm`}>
                        <StatusIcon size={14} className="animate-pulse" />
                        <SensitiveData isPrivacyMode={isPrivacyMode}>{state.statusLabel}</SensitiveData>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Symptômes identifiés</p>
                    <div className="text-sm font-bold text-slate-800 leading-snug">
                        <SensitiveData isPrivacyMode={isPrivacyMode}>{state.symptomsSummary}</SensitiveData>
                    </div>
                </div>

                <div className="bg-violet-50/80 rounded-xl p-3 border border-violet-100 flex gap-3 shadow-sm group-hover:bg-violet-100 transition-colors">
                    <div className="mt-0.5 min-w-[16px]">
                        <Sparkles size={16} className="text-violet-600 fill-violet-200" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-violet-800 uppercase mb-0.5">Analyse HopeVision</p>
                        <div className="text-xs text-violet-900 leading-relaxed font-medium">
                            <SensitiveData isPrivacyMode={isPrivacyMode}>{state.aiAnalysis}</SensitiveData>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                <span className="flex items-center gap-1.5"><Clock size={12} /> MAJ: {state.lastUpdate}</span>
                <button
                    onClick={onDetailsClick}
                    disabled={!state}
                    className="text-violet-600 font-bold hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-violet-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Détails <ArrowRight size={12} />
                </button>
            </div>
        </div>
    );
};

const getStatusStyles = (status: HealthStatus) => {
    switch (status) {
        case 'stable': return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 };
        case 'monitoring': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Eye };
        case 'consultation': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: Stethoscope };
        case 'emergency': return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: AlertTriangle };
        default: return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: Minus };
    }
};

const getActionIcon = (type: string) => {
    switch (type) {
        case 'analysis': return Sparkles;
        case 'booking': return Calendar;
        case 'upload': return Download;
        case 'reminder': return Syringe;
        default: return CheckCircle2;
    }
};

const PriorityActionsCard = ({
    actions,
    onActionClick,
    isPrivacyMode
}: {
    actions: PriorityAction[];
    onActionClick: (action: PriorityAction) => void;
    isPrivacyMode: boolean;
}) => {
    return (
        <div className="bg-white rounded-[20px] p-5 border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-40"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={16} className="text-emerald-600" /> À faire aujourd'hui
                    </h3>
                    <span className="bg-white text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">
                        {actions.length}
                    </span>
                </div>

                {actions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-400">
                        Aucune action urgente pour le moment.
                    </div>
                ) : (
                    <div className="flex-1 space-y-2.5">
                        {actions.map((action) => {
                            const Icon = getActionIcon(action.type);
                            const isHighPriority = action.priority === 'high';

                            return (
                                <button
                                    key={action.id}
                                    onClick={() => onActionClick(action)}
                                    className={`w-full text-left group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 relative overflow-hidden
                                        ${isHighPriority
                                            ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-100/50 hover:border-emerald-300'
                                            : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-emerald-200 hover:shadow-sm'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                                        ${isHighPriority ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 border border-slate-100 group-hover:text-emerald-500 group-hover:border-emerald-200'}`}>
                                        <Icon size={14} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[13px] font-bold truncate ${isHighPriority ? 'text-emerald-900' : 'text-slate-700'}`}>
                                            {action.label}
                                        </div>
                                        {action.subLabel && (
                                            <div className={`text-[10px] truncate ${isHighPriority ? 'text-emerald-700/80' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                                <SensitiveData isPrivacyMode={isPrivacyMode}>{action.subLabel}</SensitiveData>
                                            </div>
                                        )}
                                    </div>

                                    <div className="self-center pl-1">
                                        {isHighPriority ? (
                                            <div className="bg-emerald-600 text-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                <ArrowRight size={10} />
                                            </div>
                                        ) : (
                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const EvolutionCard = ({
    data,
    isPrivacyMode,
    onStartAnalysis
}: {
    data: SymptomEvolution | null;
    isPrivacyMode: boolean;
    onStartAnalysis: () => void;
}) => {
    if (!data) {
        return (
            <div className="bg-white rounded-[20px] p-5 border border-blue-100 shadow-sm h-full flex flex-col justify-between">
                <div>
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-blue-600" /> Évolution récente
                    </h3>
                    <p className="text-sm text-slate-500">
                        Commencez une pré-analyse pour suivre automatiquement la progression de vos symptômes.
                    </p>
                </div>
                <button
                    onClick={onStartAnalysis}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                >
                    Lancer une pré-analyse <ArrowRight size={12} />
                </button>
            </div>
        );
    }

    const color = data.trend === 'improvement' ? '#10b981' : data.trend === 'worsening' ? '#ef4444' : '#6366f1';

    return (
        <div className="bg-white rounded-[20px] p-5 border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-40"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" /> Évolution récente
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-100 shadow-sm">
                        {data.symptomName}
                    </div>
                </div>

                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold flex items-center gap-1 ${data.trend === 'improvement' ? 'text-emerald-600' : data.trend === 'worsening' ? 'text-rose-600' : 'text-blue-600'}`}>
                            <SensitiveData isPrivacyMode={isPrivacyMode}>
                                {data.trendLabel}
                            </SensitiveData>
                        </span>
                        {data.trend === 'improvement' && !isPrivacyMode && <TrendingDown size={16} className="text-emerald-500 animate-bounce" />}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                        <SensitiveData isPrivacyMode={isPrivacyMode}>{data.description}</SensitiveData>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[90px] -ml-2 relative">
                    <ResponsiveContainer width="105%" height="100%">
                        <AreaChart data={isPrivacyMode ? data.dataPoints.map(p => ({ ...p, value: 5 })) : data.dataPoints}>
                            <defs>
                                <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            {!isPrivacyMode && (
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                                    itemStyle={{ color: '#fff', padding: 0 }}
                                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    formatter={(value: number) => [`${value}/10`, 'Sévérité']}
                                />
                            )}
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#94a3b8' }}
                                dy={5}
                            />
                            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />

                            {!isPrivacyMode && data.targetValue && (
                                <ReferenceLine y={data.targetValue} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
                            )}

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPrivacyMode ? '#cbd5e1' : color}
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill={isPrivacyMode ? '#f1f5f9' : "url(#colorEvolution)"}
                                activeDot={!isPrivacyMode ? { r: 4, strokeWidth: 2, stroke: '#fff' } : false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const AdviceCard = ({ message, source }: { message?: string; source?: string }) => {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[20px] p-5 border border-amber-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-8 -mt-8 opacity-40 group-hover:opacity-60 transition-opacity"></div>

            <div className="relative z-10 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-600" /> Conseil du jour
                    </h3>
                    {source && (
                        <span className="text-[10px] text-amber-700 bg-white/70 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                            {source}
                        </span>
                    )}
                </div>

                <div className="flex-1">
                    <p className="text-sm text-slate-800 font-medium leading-relaxed mb-3">
                        {message || "Hydratez-vous régulièrement et prenez quelques minutes pour respirer profondément. Votre corps vous remerciera."}
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                        <span className="text-[10px] text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded-full font-bold">Mieux-être</span>
                        <span className="text-[10px] text-slate-400 italic">Basé sur vos données</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActionButton = ({
    icon: Icon,
    label,
    desc,
    gradient,
    onClick,
    disabled = false,
    loading = false
}: {
    icon: React.ElementType;
    label: string;
    desc: string;
    gradient: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-slate-100 to-slate-200 hover:from-violet-200 hover:to-indigo-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group w-full text-left ${disabled ? 'opacity-60 cursor-not-allowed hover:-translate-y-0 hover:shadow-sm' : ''}`}
    >
        <div className="bg-white rounded-[15px] p-4 h-full relative z-10 flex flex-col items-center text-center justify-center group-hover:bg-opacity-95 transition-all">
            <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Icon size={20} />}
            </div>
            <span className="font-bold text-slate-800 text-xs group-hover:text-violet-700 transition-colors">{label}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 leading-tight group-hover:text-slate-500 transition-colors">{desc}</span>
        </div>
    </button>
);

export default function PatientDashboard({ onNavigate }: PatientDashboardProps) {
    const { currentProfile, isPatient } = useAuth();

    const [activeTab, setActiveTab] = useState('overview');
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [clinicalState, setClinicalState] = useState<ClinicalState | null>(null);
    const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([]);
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [symptomEvolution, setSymptomEvolution] = useState<SymptomEvolution | null>(null);
    const [nextAppointment, setNextAppointment] = useState<AppointmentWithDoctor | null>(null);
    const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
    const [latestCompletedAnalysisId, setLatestCompletedAnalysisId] = useState<string | null>(null);
    const [userVitals, setUserVitals] = useState<VitalCardDef[]>(() => ALL_VITALS.filter(v => v.added));
    const [isAddVitalOpen, setIsAddVitalOpen] = useState(false);

    const filteredHistory = useMemo(() => {
        if (activeTab === 'clinical') {
            const doctorTypes: HistoryItemType[] = ['consultation', 'reservation', 'lab', 'doctor_note', 'ai_report', 'reminder'];
            return historyItems.filter(item => doctorTypes.includes(item.type));
        }
        if (activeTab === 'ai') {
            return historyItems.filter(item => item.type === 'pre_analysis');
        }
        return historyItems;
    }, [historyItems, activeTab]);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [activeTab]);

    useEffect(() => {
        clearAnalysisSession();
    }, []);

    useEffect(() => {
        if (!isPatient || !currentProfile?.patientProfileId) {
            setIsSnapshotLoading(false);
            return;
        }

        let cancelled = false;

        const loadDashboard = async () => {
            setIsSnapshotLoading(true);
            setErrorMessage(null);

            try {
                const patientPromise = supabase
                    .from('patient_profiles')
                    .select(`
                        *,
                        profiles (
                            id,
                            full_name,
                            avatar_url,
                            date_of_birth
                        )
                    `)
                    .eq('id', currentProfile.patientProfileId)
                    .maybeSingle();

                const timelinePromise = supabase
                    .from('timeline_events')
                    .select(`
                        id,
                        event_type,
                        event_title,
                        event_description,
                        status,
                        event_date,
                        related_appointment:appointments!timeline_events_related_appointment_id_fkey (
                            id,
                            scheduled_date,
                            scheduled_time,
                            status,
                            doctor_profiles (
                                id,
                                specialty,
                                profiles (
                                    full_name
                                )
                            )
                        ),
                        related_ai_report:ai_reports!timeline_events_related_ai_report_id_fkey (
                            id,
                            pre_analysis_id,
                            primary_diagnosis,
                            overall_severity,
                            overall_confidence
                        )
                    `)
                    .eq('patient_profile_id', currentProfile.patientProfileId)
                    .order('event_date', { ascending: false })
                    .limit(8);

                const preAnalysesPromise = supabase
                    .from('pre_analyses')
                    .select(`
                        *,
                        ai_reports (
                            id,
                            overall_severity,
                            overall_confidence,
                            primary_diagnosis,
                            summary,
                            recommendation_action,
                            recommendation_text,
                            created_at
                        )
                    `)
                    .eq('patient_profile_id', currentProfile.patientProfileId)
                    .order('created_at', { ascending: false })
                    .limit(8);

                const appointmentsPromise = supabase
                    .from('appointments')
                    .select(`
                        *,
                        doctor_profiles (
                            id,
                            specialty,
                            profiles (
                                full_name,
                                avatar_url
                            )
                        )
                    `)
                    .eq('patient_profile_id', currentProfile.patientProfileId)
                    .in('status', ['scheduled', 'confirmed'])
                    .order('scheduled_date', { ascending: true })
                    .limit(5);

                const treatmentsPromise = supabase
                    .from('doctor_notes')
                    .select(`
                        *,
                        doctor_profiles (
                            profiles (
                                full_name
                            )
                        )
                    `)
                    .eq('patient_profile_id', currentProfile.patientProfileId)
                    .order('created_at', { ascending: false })
                    .limit(3);

                const [
                    patientRes,
                    timelineRes,
                    preAnalysesRes,
                    appointmentsRes,
                    treatmentsRes
                ] = await Promise.all([
                    patientPromise,
                    timelinePromise,
                    preAnalysesPromise,
                    appointmentsPromise,
                    treatmentsPromise
                ]);

                if (cancelled) {
                    return;
                }

                if (patientRes.error && patientRes.error.code !== 'PGRST116') {
                    throw patientRes.error;
                }

                if (patientRes.data) {
                    const patientData = patientRes.data as PatientProfile & { profiles?: Profile };
                    setPatientProfile(patientData);
                    setProfile(patientData.profiles || null);
                }

                const preAnalysesData = (preAnalysesRes.data as PreAnalysisWithReport[]) || [];
                const timelineData = (timelineRes.data as unknown as TimelineRecord[]) || [];
                const appointmentsData = (appointmentsRes.data as AppointmentWithDoctor[]) || [];
                const treatmentsData = (treatmentsRes.data as DoctorNoteWithDoctor[]) || [];

                const ongoing = preAnalysesData.find(pa => ['draft', 'submitted', 'processing'].includes(pa.status));
                const latestCompleted = preAnalysesData.find(pa => pa.status === 'completed');
                const computedClinicalState = buildClinicalState(preAnalysesData);
                const computedEvolution = buildSymptomEvolution(preAnalysesData);
                const computedHistory = buildHistoryFromData(timelineData, preAnalysesData);

                setLatestCompletedAnalysisId(latestCompleted?.id ?? null);
                setClinicalState(computedClinicalState);
                setSymptomEvolution(computedEvolution);
                setHistoryItems(computedHistory);

                const nextAppt = pickNextAppointment(appointmentsData);
                setNextAppointment(nextAppt);
                setTreatments(mapTreatments(treatmentsData));

                setPriorityActions(
                    computePriorityActions({
                        clinicalState: computedClinicalState,
                        hasOngoingAnalysis: Boolean(ongoing),
                        hasUpcomingAppointment: Boolean(nextAppt),
                        profileIncomplete: isPatientProfileIncomplete(currentProfile),
                        hasRecentReport: preAnalysesData.some(pa => pa.ai_reports && pa.ai_reports.length > 0),
                        ongoingPreAnalysisId: ongoing?.id
                    })
                );
            } catch (error) {
                if (!cancelled) {
                    console.error('[PatientDashboard] Failed to load data', error);
                    setErrorMessage("Impossible de charger vos données patient. Réessayez dans un instant.");
                }
            } finally {
                if (!cancelled) {
                    setIsSnapshotLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [isPatient, currentProfile]);

    useEffect(() => {
        if (!patientProfile) return;
        setUserVitals(prev => prev.map(vital => hydrateVitalValue(vital, patientProfile)));
    }, [patientProfile]);

    const handleStartNewAnalysis = () => {
        if (!currentProfile?.patientProfileId) {
            setErrorMessage('Profil patient introuvable.');
            return;
        }
        clearAnalysisSession();
        sessionStorage.removeItem('currentPreAnalysisId');
        onNavigate('patient-consent');
    };

    const handleStartAnalysis = () => {
        handleStartNewAnalysis();
    };

    const handleViewLatestReport = () => {
        if (!latestCompletedAnalysisId) return;
        sessionStorage.setItem('currentPreAnalysisId', latestCompletedAnalysisId);
        onNavigate('patient-detailed-report');
    };

    const handleHistoryResume = (preAnalysisId?: string) => {
        if (!preAnalysisId) return;
        sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
        onNavigate('patient-symptoms');
    };

    const handleHistoryDetails = (preAnalysisId?: string) => {
        if (!preAnalysisId) return;
        sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
        onNavigate('patient-detailed-report');
    };

    const handleBookFromAnalysis = (preAnalysisId?: string) => {
        if (!preAnalysisId) return;
        sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
        onNavigate('booking-service-selection');
    };

    const handleHistoryItemClick = (item: HistoryItem) => {
        if (item.type === 'pre_analysis') {
            if (item.status === 'completed') {
                handleHistoryDetails(item.preAnalysisId);
            } else {
                handleHistoryResume(item.preAnalysisId);
            }
            return;
        }

        if (item.type === 'ai_report') {
            handleHistoryDetails(item.preAnalysisId);
            return;
        }

        onNavigate('patient-history');
    };

    const handleAction = (action: PriorityAction) => {
        if (action.id === 'resume-analysis' && action.preAnalysisId) {
            handleHistoryResume(action.preAnalysisId);
            return;
        }

        if (action.id === 'start-analysis') {
            handleStartNewAnalysis();
            return;
        }

        switch (action.type) {
            case 'booking':
                // Passer le contexte médical si une analyse récente existe
                if (latestCompletedAnalysisId) {
                    sessionStorage.setItem('currentPreAnalysisId', latestCompletedAnalysisId);
                }
                onNavigate('booking-service-selection');
                break;
            case 'upload':
                onNavigate('signup-patient-step2');
                break;
            case 'reminder':
                onNavigate('patient-history');
                break;
            case 'analysis':
                handleStartAnalysis();
                break;
            default:
                break;
        }
    };

    const handleAddVital = (id: string) => {
        const vitalToAdd = ALL_VITALS.find(v => v.id === id);
        if (vitalToAdd && !userVitals.find(v => v.id === id)) {
            setUserVitals([...userVitals, hydrateVitalValue({ ...vitalToAdd, added: true }, patientProfile)]);
        }
        setIsAddVitalOpen(false);
    };

    const handleRemoveVital = (id: string) => {
        setUserVitals(userVitals.filter(v => v.id !== id));
    };

    const handleDismissError = () => setErrorMessage(null);

    const greetingName = profile?.full_name?.split(' ')[0] || 'vous';
    const avatarUrl = profile?.avatar_url || 'https://i.pravatar.cc/150?img=32';
    const adviceMessage = clinicalState?.aiAnalysis;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-28 md:pb-12 selection:bg-violet-200 selection:text-violet-900">
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 px-4 md:px-8 py-4 transition-all duration-300">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/20 ring-4 ring-slate-100">
                            <Sparkles size={20} className="text-violet-400" />
                        </div>
                        <div className="hidden md:block leading-none">
                            <h1 className="font-bold text-lg tracking-tight text-slate-900">HopeVision<span className="text-violet-600">AI</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Espace Patient</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <button
                            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                            className={`p-2.5 rounded-full transition-all duration-300 flex items-center gap-2 ${isPrivacyMode ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title={isPrivacyMode ? "Désactiver mode discret" : "Activer mode discret"}
                        >
                            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                            <span className="text-xs font-bold hidden sm:inline">{isPrivacyMode ? 'Mode Discret' : 'Visible'}</span>
                        </button>
                        <div className="hidden md:flex items-center gap-2 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-emerald-700">Connecté</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-200 to-fuchsia-200 p-0.5 cursor-pointer hover:ring-4 ring-violet-50 transition-all duration-300">
                            <img src={avatarUrl} className="w-full h-full rounded-full object-cover border-2 border-white" alt="Profile" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
                {errorMessage && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertTriangle size={16} /> {errorMessage}
                        </div>
                        <button onClick={handleDismissError} className="text-rose-400 hover:text-rose-600">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-bottom-2 duration-500">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-violet-700 bg-violet-100/50 px-2.5 py-1 rounded-md border border-violet-100">Synthèse live</span>
                            {isSnapshotLoading && (
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" /> Actualisation
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            {getGreeting()}, <span className="text-slate-500">{greetingName}.</span>
                        </h2>
                        <p className="text-slate-500 mt-2 text-lg font-medium flex items-center gap-2">
                            Voici votre synthèse médicale du jour.
                        </p>
                    </div>
                    <div className="hidden md:flex gap-3">
                        <button
                            onClick={() => {
                                // Passer le contexte médical si une analyse récente existe
                                if (latestCompletedAnalysisId) {
                                    sessionStorage.setItem('currentPreAnalysisId', latestCompletedAnalysisId);
                                }
                                onNavigate('booking-service-selection');
                            }}
                            className="px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Calendar size={18} /> Réserver
                        </button>
                        <button
                            onClick={handleStartAnalysis}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-200 hover:scale-[1.02] transition-all flex items-center gap-2 shadow-md"
                        >
                            <Plus size={18} className="stroke-[3px]" /> Nouvelle pré-analyse
                        </button>
                    </div>
                </header>

                <section className={`grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ${isSnapshotLoading ? 'opacity-80' : 'opacity-100'}`}>
                    <ClinicalStateCard
                        state={clinicalState}
                        isPrivacyMode={isPrivacyMode}
                        onDetailsClick={handleViewLatestReport}
                        onStartAnalysis={handleStartAnalysis}
                    />
                    <PriorityActionsCard actions={priorityActions} onActionClick={handleAction} isPrivacyMode={isPrivacyMode} />
                    <EvolutionCard data={symptomEvolution} isPrivacyMode={isPrivacyMode} onStartAnalysis={handleStartAnalysis} />
                </section>

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 space-y-8">
                        <div className="grid grid-cols-3 gap-4">
                            <ActionButton
                                icon={Sparkles}
                                label="Analyse IA"
                                desc="Symptômes & Triage"
                                gradient="from-violet-500 to-indigo-600"
                                onClick={handleStartAnalysis}
                            />
                            <ActionButton
                                icon={Calendar}
                                label="Prendre RDV"
                                desc="Généraliste & Spécialiste"
                                gradient="from-blue-500 to-cyan-500"
                                onClick={() => {
                                    // Passer le contexte médical si une analyse récente existe
                                    if (latestCompletedAnalysisId) {
                                        sessionStorage.setItem('currentPreAnalysisId', latestCompletedAnalysisId);
                                    }
                                    onNavigate('booking-service-selection');
                                }}
                            />
                            <ActionButton
                                icon={Download}
                                label="Documents"
                                desc="Importer Résultats"
                                gradient="from-emerald-500 to-teal-500"
                                onClick={() => onNavigate('patient-history')}
                            />
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                        <Clock size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 leading-tight">Historique de Santé</h3>
                                        <p className="text-sm text-slate-500 mt-1">Tous vos événements médicaux</p>
                                    </div>
                                </div>
                                <div className="flex p-1.5 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'overview', label: 'Tout' },
                                        { id: 'clinical', label: 'Dossier Médical' },
                                        { id: 'ai', label: 'Pré-analyses' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                                {filteredHistory.length === 0 ? (
                                    <div className="p-10 text-center text-sm text-slate-500 space-y-3">
                                        <p>Aucun événement récent. Lancez une pré-analyse pour alimenter votre historique.</p>
                                        <button
                                            onClick={handleStartAnalysis}
                                            className="text-violet-600 font-bold hover:underline"
                                        >
                                            Créer ma première pré-analyse
                                        </button>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {filteredHistory.map((item) => {
                                            const isPreAnalysisItem = item.type === 'pre_analysis';
                                            const isAiReport = item.type === 'ai_report';
                                            const isConsultationItem = item.type === 'consultation' || item.type === 'reservation';
                                            const accentClass = isConsultationItem
                                                ? 'bg-blue-50 border-blue-100 text-blue-600'
                                                : (isPreAnalysisItem || isAiReport)
                                                    ? 'bg-violet-50 border-violet-100 text-violet-600'
                                                    : 'bg-orange-50 border-orange-100 text-orange-600';
                                            const AccentIcon = isConsultationItem
                                                ? Stethoscope
                                                : (isPreAnalysisItem || isAiReport)
                                                    ? Sparkles
                                                    : FileText;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="p-6 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                    onClick={() => handleHistoryItemClick(item)}
                                                >
                                                <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-[1.5px] transition-colors ${accentClass}`}>
                                                    <AccentIcon size={20} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1.5 gap-4">
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-[15px] text-slate-900 group-hover:text-violet-900 transition-colors truncate">{item.title}</h4>
                                                            {item.doctor && <p className="text-xs text-slate-500 font-medium truncate">{item.doctor}</p>}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap">{formatDate(item.date)}</span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        {item.status === 'completed' && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Terminé
                                                            </span>
                                                        )}
                                                        {item.status === 'in_progress' && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                                                                <Loader2 size={10} className="animate-spin" /> En cours
                                                            </span>
                                                        )}
                                                        {item.status === 'available' && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                                                                <FileBarChart size={10} /> Disponible
                                                            </span>
                                                        )}
                                                        {item.result && (
                                                            <p className="text-xs text-slate-500 truncate max-w-[240px]">
                                                                <SensitiveData isPrivacyMode={isPrivacyMode}>{item.result}</SensitiveData>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                    <div className="flex gap-2">
                                                        {isPreAnalysisItem && item.status === 'in_progress' && (
                                                            <button
                                                                className="text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleHistoryResume(item.preAnalysisId);
                                                                }}
                                                            >
                                                                <Play size={10} fill="currentColor" /> Continuer
                                                            </button>
                                                        )}
                                                        {isPreAnalysisItem && item.status === 'completed' && (
                                                            <>
                                                                <button
                                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleHistoryDetails(item.preAnalysisId);
                                                                    }}
                                                                >
                                                                    <FileBarChart size={12} /> Voir rapport
                                                                </button>
                                                                <button
                                                                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleBookFromAnalysis(item.preAnalysisId);
                                                                    }}
                                                                >
                                                                    <Calendar size={12} /> Réserver
                                                                </button>
                                                            </>
                                                        )}
                                                        {isAiReport && (
                                                            <button
                                                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleHistoryDetails(item.preAnalysisId);
                                                                }}
                                                            >
                                                                <FileBarChart size={12} /> Voir rapport
                                                            </button>
                                                        )}
                                                        {!isPreAnalysisItem && !isAiReport && (
                                                            <button
                                                                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors border border-slate-100 bg-white"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onNavigate('patient-history');
                                                                }}
                                                            >
                                                                Voir détails
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                    <button
                                        className="text-sm font-bold text-violet-600 hover:text-violet-700 hover:underline"
                                        onClick={() => onNavigate('patient-history')}
                                    >
                                        Voir tout l'historique
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pt-2">
                            <div className="flex items-center justify-between mb-3 ml-1">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} /> Biométrie
                                </h4>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsAddVitalOpen(!isAddVitalOpen)}
                                        className="text-[10px] font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded transition-colors"
                                    >
                                        {isAddVitalOpen ? 'Fermer' : 'Gérer'}
                                    </button>
                                    {isAddVitalOpen && (
                                        <div className="absolute right-0 top-8 bg-white border border-slate-100 shadow-xl rounded-xl p-2 w-48 z-20 animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-[10px] font-bold text-slate-400 mb-2 px-2 uppercase">Ajouter</p>
                                            {ALL_VITALS.filter(v => !userVitals.find(uv => uv.id === v.id)).map(v => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => handleAddVital(v.id)}
                                                    className="w-full text-left flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700"
                                                >
                                                    <Plus size={14} className="text-violet-500" /> {v.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {userVitals.map(v => (
                                    <div key={v.id} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3 hover:border-violet-200 hover:shadow-sm transition-all group relative">
                                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:text-violet-600 group-hover:bg-violet-50 transition-colors"><v.icon size={16} /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{v.label}</p>
                                            <div className="text-sm font-bold text-slate-800 flex items-baseline gap-1">
                                                <SensitiveData isPrivacyMode={isPrivacyMode}>{v.value}</SensitiveData>
                                                <span className="text-[10px] font-normal text-slate-400">{v.unit}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveVital(v.id)}
                                            className="absolute top-1 right-1 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {userVitals.length === 0 && (
                                    <div onClick={() => setIsAddVitalOpen(true)} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 text-slate-400 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/50 cursor-pointer transition-all col-span-2 sm:col-span-1">
                                        <Plus size={20} />
                                        <span className="text-xs font-bold mt-1">Ajouter</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-[2rem] p-7 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group cursor-pointer hover:scale-[1.02] transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/30 rounded-full blur-[80px]"></div>
                            <div className="relative z-10">
                                {nextAppointment ? (
                                    <>
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Prochain RDV</p>
                                                <h3 className="text-2xl font-bold capitalize">{formatAppointmentDate(nextAppointment)}</h3>
                                                <p className="text-sm text-slate-400">{formatAppointmentTime(nextAppointment)}</p>
                                            </div>
                                            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm"><Calendar size={22} className="text-violet-300" /></div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="relative">
                                                <img src={nextAppointment.doctor_profiles?.profiles?.avatar_url || 'https://i.pravatar.cc/150?img=11'} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10" alt="Dr" />
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">{nextAppointment.doctor_profiles?.profiles?.full_name || 'Praticien confirmé'}</p>
                                                <p className="text-slate-400 text-xs font-medium">{nextAppointment.doctor_profiles?.specialty || 'Spécialité à confirmer'}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="w-full py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-lg"
                                            onClick={() => onNavigate('patient-history')}
                                        >
                                            Voir les détails
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Rendez-vous</p>
                                            <h3 className="text-2xl font-bold">Aucun rendez-vous à venir</h3>
                                        </div>
                                        <p className="text-sm text-slate-300">
                                            Planifiez votre prochaine consultation pour suivre vos recommandations IA.
                                        </p>
                                        <button
                                            className="w-full py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-lg"
                                            onClick={() => {
                                                // Passer le contexte médical si une analyse récente existe
                                                if (latestCompletedAnalysisId) {
                                                    sessionStorage.setItem('currentPreAnalysisId', latestCompletedAnalysisId);
                                                }
                                                onNavigate('booking-service-selection');
                                            }}
                                        >
                                            Prendre rendez-vous
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-7">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                    <ShieldCheck size={20} className="text-emerald-500" /> Traitements
                                </h3>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide border border-emerald-100">
                                    {treatments.length > 0 ? `${treatments.length} actifs` : 'À jour'}
                                </span>
                            </div>
                            {treatments.length === 0 ? (
                                <p className="text-sm text-slate-500">Aucun traitement actif pour le moment.</p>
                            ) : (
                                <div className="space-y-3">
                                    {treatments.map((treatment, index) => (
                                        <div
                                            key={treatment.id}
                                            className={`flex items-center justify-between p-4 rounded-2xl border ${index === 0 ? 'border-slate-50 bg-slate-50 opacity-60' : 'border-slate-100 bg-white hover:border-violet-200 transition-colors cursor-pointer group'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-500">
                                                    {treatment.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm ${index === 0 ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-violet-900'}`}>{treatment.name}</p>
                                                    <p className="text-xs text-slate-400">{treatment.instructions}</p>
                                                </div>
                                            </div>
                                            {index === 0 ? (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-violet-400 transition-colors"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <AdviceCard message={adviceMessage} source={clinicalState?.statusLabel} />
                    </div>
                </div>
            </main>
        </div>
    );
}
 