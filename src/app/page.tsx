'use client';

import { useState, useRef } from 'react';
import {
  ArrowRightLeft,
  Camera,
  Clipboard,
  Languages,
  LoaderCircle,
  Upload,
  Volume2,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { lookupWordDefinition, LookupWordDefinitionOutput } from '@/ai/flows/lookup-word-definition';
import { translateText } from '@/ai/flows/translate-text';
import { textToSpeech } from '@/ai/flows/text-to-speech';

const languages = [
  { value: 'English', label: 'English', code: 'en-US' },
  { value: 'Spanish', label: 'Spanish', code: 'es-ES' },
  { value: 'French', label: 'French', code: 'fr-FR' },
  { value: 'German', label: 'German', code: 'de-DE' },
  { value: 'Japanese', label: 'Japanese', code: 'ja-JP' },
  { value: 'Chinese', label: 'Chinese', code: 'zh-CN' },
  { value: 'Russian', label: 'Russian', code: 'ru-RU' },
  { value: 'Arabic', label: 'Arabic', code: 'ar-SA' },
  { value: 'Portuguese', label: 'Portuguese', code: 'pt-PT' },
  { value: 'Italian', label: 'Italian', code: 'it-IT' },
  { value: 'Hindi', label: 'Hindi', code: 'hi-IN' },
  { value: 'Bengali', label: 'Bengali', code: 'bn-IN' },
  { value: 'Tamil', label: 'Tamil', code: 'ta-IN' },
  { value: 'Telugu', label: 'Telugu', code: 'te-IN' },
];

export default function LingoLensPage() {
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDefining, setIsDefining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [definition, setDefinition] = useState<LookupWordDefinitionOutput | null>(null);
  const [currentWord, setCurrentWord] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!originalText.trim()) return;
    setIsTranslating(true);
    setTranslatedText('');
    try {
      const result = await translateText({
        text: originalText,
        targetLanguage: targetLanguage,
      });
      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to translate text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleWordClick = async (word: string) => {
    const cleanedWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
    if (!cleanedWord || cleanedWord === currentWord) return;

    setCurrentWord(cleanedWord);
    setIsDefining(true);
    setDefinition(null);
    try {
      const result = await lookupWordDefinition({
        word: cleanedWord,
        language: targetLanguage,
      });
      setDefinition(result);
    } catch (error) {
      console.error('Definition error:', error);
      setDefinition({ definition: 'Could not find definition.', synonyms: [], examples: [] });
    } finally {
      setIsDefining(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    try {
      const { audioDataUri } = await textToSpeech({ text });
      if (audioRef.current) {
        audioRef.current.src = audioDataUri;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate audio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalText(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: 'Unsupported File Type',
        description: `Only .txt files are supported for now. You uploaded a ${file.type} file.`,
        variant: 'destructive'
      });
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    if (translatedText) {
        setOriginalText(translatedText);
        setTranslatedText(originalText);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground font-body">
      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      <header className="py-6">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-primary">
            LingoLens
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered text translation and language learning.
          </p>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <Card className="mb-8 shadow-lg border-none bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger className="w-full sm:w-[180px] text-base">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={handleSwapLanguages} className="text-muted-foreground hover:text-primary transition-colors">
                    <ArrowRightLeft className="h-5 w-5" />
                  </Button>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-full sm:w-[180px] text-base">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="text-primary" /> Original Text
                </CardTitle>
                <CardDescription>
                  Enter text, upload a file, or use your camera.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Type or paste your text here..."
                  className="min-h-[200px] text-base resize-none"
                />
              </CardContent>
              <CardFooter className="flex-wrap gap-2 justify-between">
                <div className="flex gap-2">
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Upload
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden accept=".txt" />
                    <Button variant="outline" onClick={() => toast({title: "Coming Soon!", description: "Camera scanning will be available in a future update."})}>
                        <Camera className="mr-2 h-4 w-4" /> Scan
                    </Button>
                </div>
                <Button onClick={handleTranslate} disabled={isTranslating || !originalText.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isTranslating ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Languages className="mr-2 h-4 w-4" />
                  )}
                  Translate
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Languages className="text-accent" /> Translated Text
                </CardTitle>
                <CardDescription>
                  Click on a word to see its definition.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[200px] text-base">
                {isTranslating ? (
                  <div className="flex items-center justify-center h-full">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="leading-relaxed">
                    {translatedText.split(/(\s+)/).map((segment, index) => (
                        segment.trim() ? (
                        <Popover key={index} onOpenChange={(open) => { if (open) handleWordClick(segment); }}>
                            <PopoverTrigger asChild>
                            <span className="cursor-pointer hover:bg-accent/20 rounded-md p-0.5 -m-0.5 transition-colors">
                                {segment}
                            </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 shadow-2xl">
                                {isDefining && currentWord === segment.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim() ? (
                                    <div className="flex items-center justify-center p-4">
                                        <LoaderCircle className="h-6 w-6 animate-spin text-primary"/>
                                    </div>
                                ) : definition && currentWord === segment.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim() ? (
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none text-primary">{currentWord}</h4>
                                            <p className="text-sm text-muted-foreground">{definition.definition}</p>
                                        </div>
                                        {definition.synonyms?.length > 0 && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <h5 className="font-medium text-sm mb-1">Synonyms</h5>
                                                    <p className="text-sm text-muted-foreground">{definition.synonyms.join(', ')}</p>
                                                </div>
                                            </>
                                        )}
                                        {definition.examples?.length > 0 && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <h5 className="font-medium text-sm mb-1">Examples</h5>
                                                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                                                        {definition.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground p-4 text-center">Click a word to see its definition.</p>
                                )}
                            </PopoverContent>
                        </Popover>
                        ) : (
                        <span key={index}>{segment}</span>
                        )
                    ))}
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button onClick={() => handleSpeak(translatedText)} disabled={!translatedText || isTranslating || isSpeaking} variant="outline" className="text-accent-foreground hover:bg-accent/20 hover:text-accent-foreground border-accent/50">
                  {isSpeaking ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                   Listen
                </Button>
                <Button onClick={() => handleCopy(translatedText)} disabled={!translatedText || isTranslating} variant="outline">
                    <Clipboard className="mr-2 h-4 w-4" /> Copy
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <footer className="container mx-auto text-center py-4">
        <p className="text-xs text-muted-foreground">
          Powered by Genkit & Next.js.
        </p>
      </footer>
    </div>
  );
}
