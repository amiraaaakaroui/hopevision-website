
import React, { useState, useEffect } from 'react';
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
    AreaChart, Area, Tooltip, XAxis, ReferenceLine, CartesianGrid
} from 'recharts';

const SensitiveData = ({ children, isPrivacyMode, className = "" }: { children: React.ReactNode, isPrivacyMode: boolean, className?: string }) => {
    if (isPrivacyMode) {
        return (
            <span className={`inline-flex items-center bg-slate-100 text-slate-400 rounded px-2 py-0.5 text-xs font-mono select-none cursor-help ${className}`} title="Donnée masquée">
                <Lock size={10} className="mr-1" /> ••••
            </span>
        );
    }
    return <span className={className}>{children}</span>;
};

/**
 * --- 2. DATA MODEL ---
 */

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
}

interface SymptomEvolution {
    symptomName: string;
    trend: 'improvement' | 'stable' | 'worsening';
    trendLabel: string;
    description: string;
    dataPoints: { day: string; value: number }[];
    targetValue?: number;
}

// Type pour les cartes de mesures optionnelles
type VitalType = "blood_pressure" | "heart_rate" | "weight" | "temperature" | "glucose";

interface VitalCardDef {
    id: string;
    type: VitalType;
    label: string;
    value: string;
    unit: string;
    icon: React.ElementType;
    added: boolean;
}

// Type pour l'historique enrichi
interface HistoryItem {
    id: number;
    type: 'consultation' | 'lab' | 'ai';
    title: string;
    date: string;
    status: 'completed' | 'in_progress' | 'available';
    result?: string;
    doctor?: string;
}

/**
 * --- 3. MOCK DATA ---
 */

const mockClinicalState: ClinicalState = {
    status: 'monitoring',
    statusLabel: "À surveiller",
    symptomsSummary: "Toux sèche depuis 5 jours, fièvre légère, fatigue.",
    aiAnalysis: "Gravité modérée – consultation dans les 24–48h recommandée.",
    lastUpdate: "Aujourd'hui, 08:30"
};

const mockPriorityActions: PriorityAction[] = [
    { id: '1', type: 'analysis', label: "Terminer votre pré-analyse IA", subLabel: "Questionnaire en cours (80%)", priority: 'high' },
    { id: '2', type: 'booking', label: "Prendre RDV avec un généraliste", subLabel: "Disponibilités demain matin", priority: 'high' },
    { id: '3', type: 'reminder', label: "Rappel vaccin : grippe", subLabel: "Avant le 15 nov.", priority: 'normal' },
];

const mockSymptomEvolution: SymptomEvolution = {
    symptomName: "Toux",
    trend: 'improvement',
    trendLabel: "Amélioration",
    description: "Intensité passée de 7/10 à 4/10 en 5 jours.",
    targetValue: 2,
    dataPoints: [
        { day: 'J-4', value: 7 },
        { day: 'J-3', value: 7.5 },
        { day: 'J-2', value: 6 },
        { day: 'J-1', value: 5 },
        { day: 'J-0', value: 4 },
    ]
};

const ALL_VITALS: VitalCardDef[] = [
    { id: 'v1', type: 'blood_pressure', label: 'Tension', value: '118/78', unit: 'mmHg', icon: Activity, added: true },
    { id: 'v2', type: 'heart_rate', label: 'Fréquence', value: '72', unit: 'bpm', icon: Heart, added: true },
    { id: 'v3', type: 'weight', label: 'Poids', value: '64.5', unit: 'kg', icon: Weight, added: true },
    { id: 'v4', type: 'temperature', label: 'Température', value: '37.2', unit: '°C', icon: Thermometer, added: false },
    { id: 'v5', type: 'glucose', label: 'Glycémie', value: '0.95', unit: 'g/L', icon: Droplets, added: false },
];

const MOCK_HISTORY: HistoryItem[] = [
    { id: 1, type: 'ai', title: 'Analyse : Toux persistante', date: new Date().toISOString(), status: 'completed', result: 'Risque Faible' },
    { id: 2, type: 'ai', title: 'Check-up Symptômes', date: '2025-01-28T10:00:00', status: 'in_progress' },
    { id: 3, type: 'consultation', title: 'Cardiologie', doctor: 'Dr. Ben Ali', date: '2025-01-25T14:30:00', status: 'completed' },
    { id: 4, type: 'lab', title: 'Bilan Lipidique (Sang)', date: '2025-01-20T09:30:00', status: 'available' },
];

/**
 * --- 4. HELPER FUNCTIONS ---
 */

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

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bonne après-midi";
    return "Bonsoir";
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
};

// --- SUB-COMPONENTS ---

// 🟣 CARTE 1 : CLINICAL STATE
const ClinicalStateCard = ({ isPrivacyMode, onDetailsClick }: { isPrivacyMode: boolean, onDetailsClick: () => void }) => {
    const styles = getStatusStyles(mockClinicalState.status);
    const StatusIcon = styles.icon;

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
                        <SensitiveData isPrivacyMode={isPrivacyMode}>{mockClinicalState.statusLabel}</SensitiveData>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Symptômes identifiés</p>
                    <div className="text-sm font-bold text-slate-800 leading-snug">
                        <SensitiveData isPrivacyMode={isPrivacyMode}>{mockClinicalState.symptomsSummary}</SensitiveData>
                    </div>
                </div>

                <div className="bg-violet-50/80 rounded-xl p-3 border border-violet-100 flex gap-3 shadow-sm group-hover:bg-violet-100 transition-colors">
                    <div className="mt-0.5 min-w-[16px]">
                        <Sparkles size={16} className="text-violet-600 fill-violet-200" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-violet-800 uppercase mb-0.5">Analyse HopeVision</p>
                        <div className="text-xs text-violet-900 leading-relaxed font-medium">
                            <SensitiveData isPrivacyMode={isPrivacyMode}>{mockClinicalState.aiAnalysis}</SensitiveData>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                <span className="flex items-center gap-1.5"><Clock size={12} /> MAJ: {mockClinicalState.lastUpdate}</span>
                <button onClick={onDetailsClick} className="text-violet-600 font-bold hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-violet-50 transition-colors">
                    Détails <ArrowRight size={12} />
                </button>
            </div>
        </div>
    );
};

// 🟢 CARTE 2 : ACTIONS
const PriorityActionsCard = ({ onActionClick, isPrivacyMode }: { onActionClick: (type: string) => void, isPrivacyMode: boolean }) => {
    return (
        <div className="bg-white rounded-[20px] p-5 border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-40"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={16} className="text-emerald-600" /> À faire aujourd'hui
                    </h3>
                    <span className="bg-white text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">
                        {mockPriorityActions.length}
                    </span>
                </div>

                <div className="flex-1 space-y-2.5">
                    {mockPriorityActions.map((action) => {
                        const Icon = getActionIcon(action.type);
                        const isHighPriority = action.priority === 'high';

                        return (
                            <button
                                key={action.id}
                                onClick={() => onActionClick(action.type)}
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
            </div>
        </div>
    );
};

// 🔵 CARTE 3 : ÉVOLUTION
const EvolutionCard = ({ isPrivacyMode }: { isPrivacyMode: boolean }) => {
    const isImprovement = mockSymptomEvolution.trend === 'improvement';
    const color = isImprovement ? '#10b981' : (mockSymptomEvolution.trend === 'worsening' ? '#ef4444' : '#f59e0b');

    return (
        <div className="bg-white rounded-[20px] p-5 border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-40"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" /> Évolution récente
                    </h3>
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-100 shadow-sm`}>
                        {mockSymptomEvolution.symptomName}
                    </div>
                </div>

                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold flex items-center gap-1 ${isImprovement ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <SensitiveData isPrivacyMode={isPrivacyMode}>
                                {mockSymptomEvolution.trendLabel}
                            </SensitiveData>
                        </span>
                        {isImprovement && !isPrivacyMode && <TrendingDown size={16} className="text-emerald-500 animate-bounce" />}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                        <SensitiveData isPrivacyMode={isPrivacyMode}>{mockSymptomEvolution.description}</SensitiveData>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[90px] -ml-2 relative">
                    <ResponsiveContainer width="105%" height="100%">
                        <AreaChart data={isPrivacyMode ? mockSymptomEvolution.dataPoints.map(p => ({ ...p, value: 5 })) : mockSymptomEvolution.dataPoints}>
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

                            {!isPrivacyMode && (
                                <ReferenceLine y={mockSymptomEvolution.targetValue} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
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

// 🟡 CARTE 4 : CONSEIL IA (Nouveau) - Pour la Sidebar
const AdviceCard = () => {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[20px] p-5 border border-amber-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-8 -mt-8 opacity-40 group-hover:opacity-60 transition-opacity"></div>

            <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-600" /> Conseil du jour
                    </h3>
                </div>

                <div className="flex-1">
                    <p className="text-sm text-slate-800 font-medium leading-relaxed mb-3">
                        "Pour soulager votre toux sèche, maintenez une bonne hydratation et surélevez légèrement votre tête pour dormir."
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                        <span className="text-[10px] text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded-full font-bold">Mieux-être</span>
                        <span className="text-[10px] text-slate-400 italic">Basé sur vos symptômes</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ⚡ Quick Action Button Component
const ActionButton = ({ icon: Icon, label, desc, gradient, onClick }: { icon: any, label: string, desc: string, gradient: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-slate-100 to-slate-200 hover:from-violet-200 hover:to-indigo-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group w-full text-left"
    >
        <div className="bg-white rounded-[15px] p-4 h-full relative z-10 flex flex-col items-center text-center justify-center group-hover:bg-opacity-95 transition-all">
            <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={20} />
            </div>
            <span className="font-bold text-slate-800 text-xs group-hover:text-violet-700 transition-colors">{label}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 leading-tight group-hover:text-slate-500 transition-colors">{desc}</span>
        </div>
    </button>
);

// --- MAIN COMPONENT ---

export default function PatientDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // State pour les mesures (Vitals)
    const [userVitals, setUserVitals] = useState<VitalCardDef[]>(ALL_VITALS.filter(v => v.added));
    const [isAddVitalOpen, setIsAddVitalOpen] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const handleAction = (type: string) => {
        if (type === 'analysis' || type === 'details') {
            setIsAnalysisOpen(true);
        }
    };

    const handleAddVital = (id: string) => {
        const vitalToAdd = ALL_VITALS.find(v => v.id === id);
        if (vitalToAdd && !userVitals.find(v => v.id === id)) {
            setUserVitals([...userVitals, { ...vitalToAdd, added: true }]);
        }
        setIsAddVitalOpen(false);
    };

    const handleRemoveVital = (id: string) => {
        setUserVitals(userVitals.filter(v => v.id !== id));
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-28 md:pb-12 selection:bg-violet-200 selection:text-violet-900">

            {/* --- MODALS --- */}
            {isAnalysisOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <button onClick={() => setIsAnalysisOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800"><X size={20} /></button>
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Pré-analyse en cours</h3>
                            <p className="text-slate-500 mb-6 text-sm">Reprise du questionnaire là où vous l'avez laissé...</p>
                            <button className="w-full py-3.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 transform active:scale-95 transition-transform">
                                Continuer (80%)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NAV BAR --- */}
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
                            <img src="https://i.pravatar.cc/150?img=32" className="w-full h-full rounded-full object-cover border-2 border-white" alt="Profile" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">

                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-bottom-2 duration-500">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-violet-700 bg-violet-100/50 px-2.5 py-1 rounded-md border border-violet-100">MVP v4.1 • Live</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            {getGreeting()}, <span className="text-slate-500">Amira.</span>
                        </h2>
                        <p className="text-slate-500 mt-2 text-lg font-medium flex items-center gap-2">
                            Voici votre synthèse médicale du jour.
                        </p>
                    </div>
                    <div className="hidden md:flex gap-3">
                        <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                            <Calendar size={18} /> Réserver
                        </button>
                        <button
                            onClick={() => handleAction('analysis')}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-200 hover:scale-[1.02] transition-all flex items-center gap-2 shadow-md"
                        >
                            <Plus size={18} className="stroke-[3px]" /> Nouvelle pré-analyse
                        </button>
                    </div>
                </header>

                {/* --- HIGH-VALUE CLINICAL CARDS (🟣 🟢 🔵) --- */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Carte 1 : IA */}
                    <ClinicalStateCard isPrivacyMode={isPrivacyMode} onDetailsClick={() => handleAction('details')} />
                    {/* Carte 2 : Actions */}
                    <PriorityActionsCard isPrivacyMode={isPrivacyMode} onActionClick={handleAction} />
                    {/* Carte 3 : Évolution */}
                    <EvolutionCard isPrivacyMode={isPrivacyMode} />
                </section>

                {/* --- MAIN DASHBOARD LAYOUT (History + Sidebar) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN (History) - Span 8 */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* --- QUICK ACTIONS STRIP --- */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <ActionButton
                                icon={Sparkles}
                                label="Analyse IA"
                                desc="Symptômes & Triage"
                                gradient="from-violet-500 to-indigo-600"
                                onClick={() => setIsAnalysisOpen(true)}
                            />
                            <ActionButton
                                icon={Calendar}
                                label="Prendre RDV"
                                desc="Généraliste & Spécialiste"
                                gradient="from-blue-500 to-cyan-500"
                                onClick={() => { }}
                            />
                            <ActionButton
                                icon={Download}
                                label="Documents"
                                desc="Importer Résultats"
                                gradient="from-emerald-500 to-teal-500"
                                onClick={() => { }}
                            />
                        </div>

                        {/* --- HISTORIQUE SANTE (Avec Statuts & Boutons dynamiques) --- */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                            {/* Header & Tabs */}
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
                                {/* Tabs Updated */}
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

                            {/* List Content */}
                            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                                <div className="divide-y divide-slate-50">
                                    {MOCK_HISTORY.slice(0, 5).map((item) => (
                                        <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                            {/* Icon */}
                                            <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-[1.5px] transition-colors
                            ${item.type === 'consultation' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                    item.type === 'ai' ? 'bg-violet-50 border-violet-100 text-violet-600' :
                                                        'bg-orange-50 border-orange-100 text-orange-600'}`}
                                            >
                                                {item.type === 'consultation' ? <Stethoscope size={20} /> : item.type === 'ai' ? <Sparkles size={20} /> : <FileText size={20} />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div>
                                                        <h4 className="font-bold text-[15px] text-slate-900 group-hover:text-violet-900 transition-colors">{item.title}</h4>
                                                        {item.doctor && <p className="text-xs text-slate-500 font-medium">{item.doctor}</p>}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap">{formatDate(item.date)}</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    {/* Statut Badge */}
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

                                                    {/* Dynamic Actions */}
                                                    {item.type === 'ai' && item.status === 'completed' && (
                                                        <div className="flex gap-2">
                                                            <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                                                <FileBarChart size={12} /> Voir rapport
                                                            </button>
                                                            <button className="text-[11px] font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded transition-colors border border-slate-200 bg-white">
                                                                Réserver
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.type === 'ai' && item.status === 'in_progress' && (
                                                        <button className="text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1 rounded-full transition-colors flex items-center gap-1 shadow-sm">
                                                            <Play size={10} fill="currentColor" /> Reprendre
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                    <button className="text-sm font-bold text-violet-600 hover:text-violet-700 hover:underline">
                                        Voir tout l'historique
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- SECTION BASSE : MESURES --- */}
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
                                    {/* Dropdown */}
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

                    {/* RIGHT COLUMN (Sidebar) - Span 4 */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* NEXT APPOINTMENT WIDGET */}
                        <div className="bg-slate-900 rounded-[2rem] p-7 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group cursor-pointer hover:scale-[1.02] transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/30 rounded-full blur-[80px]"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Prochain RDV</p>
                                        <h3 className="text-2xl font-bold">Demain, 14:00</h3>
                                    </div>
                                    <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm"><Calendar size={22} className="text-violet-300" /></div>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="relative">
                                        <img src="https://i.pravatar.cc/150?img=11" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10" alt="Dr" />
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">Dr. Sami Rebai</p>
                                        <p className="text-slate-400 text-xs font-medium">Cardiologue</p>
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors shadow-lg">
                                    Voir les détails
                                </button>
                            </div>
                        </div>

                        {/* MEDICATIONS WIDGET */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-7">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                    <ShieldCheck size={20} className="text-emerald-500" /> Traitements
                                </h3>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide border border-emerald-100">2 actifs</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50 opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-slate-200 text-slate-500">Mg</div>
                                        <div>
                                            <p className="font-bold text-sm line-through text-slate-400">Magnésium B6</p>
                                            <p className="text-xs text-slate-400">Pris à 08:00</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-violet-200 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-orange-100 text-orange-600">Do</div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 group-hover:text-violet-900">Doliprane 1000</p>
                                            <p className="text-xs text-slate-400">Si douleur</p>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-violet-400 transition-colors"></div>
                                </div>
                            </div>
                        </div>

                        {/* INSIGHT CARD (Moved here) */}
                        <AdviceCard />
                    </div>

                </div>
            </main>
        </div>
    );
}
