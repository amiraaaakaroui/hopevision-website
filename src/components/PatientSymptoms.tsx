import { Brain, Type, Mic, Image as ImageIcon, Plus, X, Upload, FileText, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Screen } from '../App';
import { useState } from 'react';
import { motion } from 'motion/react';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientSymptoms({ onNavigate }: Props) {
  const [textInput, setTextInput] = useState('Toux sèche depuis 5 jours');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedChips, setSelectedChips] = useState(['5 jours', 'Toux sèche', 'Fièvre']);

  const chips = [
    '< 24h', '1-3 jours', '5 jours', '> 1 semaine',
    'Légère', 'Modérée', 'Intense',
    'Toux sèche', 'Toux grasse', 'Fièvre', 'Douleur',
    'Essoufflement', 'Fatigue', 'Antécédents'
  ];

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter(c => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-gray-900">HopeVisionAI</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Étape 2 sur 6</span>
            <span className="text-sm text-gray-600">Saisie des symptômes</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Input */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Décrivez vos symptômes</h2>
              
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Texte
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voix
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    placeholder="Exemple : Toux sèche depuis 5 jours, fièvre à 38.4°C, légère fatigue..."
                    className="min-h-[200px]"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  <p className="text-sm text-gray-600">
                    Décrivez vos symptômes aussi précisément que possible : durée, intensité, localisation...
                  </p>
                </TabsContent>

                <TabsContent value="voice">
                  <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all ${
                        isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Mic className="w-10 h-10 text-white" />
                    </button>
                    {isRecording && (
                      <motion.div 
                        className="flex gap-1 mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-red-600 rounded-full"
                            animate={{
                              height: [20, 40, 20],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                    <p className="text-gray-900 mb-1">
                      {isRecording ? 'Enregistrement en cours...' : 'Appuyez pour enregistrer'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Décrivez vos symptômes à voix haute
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="image">
                  <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-gray-900 mb-1">
                      Glissez une image ou cliquez pour parcourir
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Photos de symptômes visibles, documents médicaux, analyses...
                    </p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une image
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="documents">
                  <div className="space-y-4">
                    <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-900 mb-1">
                        Importez vos documents médicaux
                      </p>
                      <p className="text-sm text-gray-600 mb-4 text-center">
                        Bilans biologiques, comptes-rendus, ordonnances...<br />
                        PDF, JPG, PNG jusqu'à 10MB
                      </p>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Parcourir les fichiers
                      </Button>
                    </div>
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                          L'IA extraira automatiquement les données clés de vos documents 
                          (valeurs d'analyses, diagnostics, traitements) pour enrichir votre dossier.
                        </p>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Contextual Chips */}
          <div>
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Précisions rapides</h3>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Badge
                    key={chip}
                    variant={selectedChips.includes(chip) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedChips.includes(chip) 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => toggleChip(chip)}
                  >
                    {chip}
                    {selectedChips.includes(chip) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-2">💡 Conseil</h3>
              <p className="text-sm text-gray-700">
                Plus vous êtes précis dans la description de vos symptômes, 
                plus l'analyse IA sera pertinente.
              </p>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => onNavigate('patient-consent')}>
            Retour
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigate('patient-chat-precision')}
          >
            Analyser mes symptômes
          </Button>
        </div>
      </div>
    </div>
  );
}