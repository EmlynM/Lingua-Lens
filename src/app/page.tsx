'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowRightLeft,
  Camera,
  Clipboard,
  Languages,
  LoaderCircle,
  Upload,
  Volume2,
  FileText,
  Video,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { lookupWordDefinition, LookupWordDefinitionOutput } from '@/ai/flows/lookup-word-definition';
import { translateText } from '@/ai/flows/translate-text';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';

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
  const [isExtracting, setIsExtracting] = useState(false);
  const [definition, setDefinition] = useState<LookupWordDefinitionOutput | null>(null);
  const [currentWord, setCurrentWord] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCameraOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      };
      getCameraPermission();
    } else {
        // Stop camera stream when dialog is closed
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [isCameraOpen, toast]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const imageDataUri = canvas.toDataURL('image/jpeg');

    setIsCameraOpen(false);
    setOriginalText('Extracting text from image...');
    setIsExtracting(true);

    try {
        const result = await extractTextFromImage({ imageDataUri });
        setOriginalText(result.extractedText);
    } catch (error) {
        console.error('Text extraction error:', error);
        toast({
            title: 'Text Extraction Failed',
            description: 'Could not extract text from the captured image. Please try again.',
            variant: 'destructive',
        });
        setOriginalText('');
    } finally {
        setIsExtracting(false);
        setIsCapturing(false);
    }
  };

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
      setDefinition({ definition: 'Could not find definition.', pronunciation: '', synonyms: [], examples: [] });
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

    const reader = new FileReader();

    if (file.type === 'text/plain') {
      reader.onload = (e) => {
        setOriginalText(e.target?.result as string);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
        reader.onload = async (e) => {
            const imageDataUri = e.target?.result as string;
            setIsExtracting(true);
            setOriginalText('Extracting text from image...');
            try {
                const result = await extractTextFromImage({ imageDataUri });
                setOriginalText(result.extractedText);
            } catch (error) {
                console.error('Text extraction error:', error);
                toast({
                    title: 'Text Extraction Failed',
                    description: 'Could not extract text from the image. Please try another image.',
                    variant: 'destructive',
                });
                setOriginalText('');
            } finally {
                setIsExtracting(false);
            }
        };
        reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Unsupported File Type',
        description: `Only .txt, .jpg, and .png files are supported. You uploaded a ${file.type} file.`,
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
    <div className="flex flex-col min-h-dvh bg-transparent text-foreground font-body">
      <canvas ref={canvasRef} className="hidden"></canvas>
      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      <header className="py-6 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-white">
            LinguaLens
          </h1>
          <p className="text-gray-300 mt-2">
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
            <Card className="shadow-lg border-none bg-card/80 backdrop-blur-sm">
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
                  disabled={isExtracting}
                />
              </CardContent>
              <CardFooter className="flex-wrap gap-2 justify-between">
                <div className="flex gap-2">
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isExtracting}>
                        {isExtracting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden accept=".txt,image/jpeg,image/png" />
                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                        <Button variant="outline" onClick={() => setIsCameraOpen(true)}>
                            <Camera className="mr-2 h-4 w-4" /> Scan
                        </Button>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Camera Scan</DialogTitle>
                            </DialogHeader>
                            <div className="relative">
                                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                {hasCameraPermission === false && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                    <Alert variant="destructive" className="w-4/5">
                                        <AlertTitle>Camera Access Denied</AlertTitle>
                                        <AlertDescription>
                                            Please enable camera permissions in your browser settings to use this feature.
                                        </AlertDescription>
                                    </Alert>
                                    </div>
                                )}
                                 {hasCameraPermission === null && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Cancel</Button>
                                <Button onClick={handleCapture} disabled={isCapturing || !hasCameraPermission}>
                                    {isCapturing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                                    Capture
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <Button onClick={handleTranslate} disabled={isTranslating || !originalText.trim() || isExtracting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isTranslating ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Languages className="mr-2 h-4 w-4" />
                  )}
                  Translate
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg border-none bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Languages className="text-accent" /> Translated Text
                </CardTitle>
                <CardDescription>
                  Click on a word to see its definition.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[200px] text-base">
                {isTranslating || isExtracting ? (
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
                                        {definition.pronunciation && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <h5 className="font-medium text-sm mb-1">Pronunciation</h5>
                                                    <p className="text-sm text-muted-foreground italic">
                                                        {definition.pronunciation}
                                                    </p>
                                                </div>
                                            </>
                                        )}
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
      <footer className="container mx-auto text-center py-4 bg-black/50 backdrop-blur-sm">
        <p className="text-xs text-gray-300">
          Powered by Genkit & Next.js.
        </p>
      </footer>
    </div>
  );
}
