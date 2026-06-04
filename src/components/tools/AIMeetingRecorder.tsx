import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Download, FileText, Loader2, Settings, History, BookOpen, Upload, CheckCircle, Mail, FileUp, Folder, Users, Send, Trash2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIMeetingRecorderProps {
  projectsList?: any[];
  isActiveTab?: boolean;
  onNavigateToRecorder?: () => void;
}

interface KnowledgeFile {
  id: number;
  name: string;
  type: string;
  date: string;
  base64Data?: string;
  mimeType?: string;
}

export default function AIMeetingRecorder({ projectsList = [], isActiveTab = true, onNavigateToRecorder }: AIMeetingRecorderProps) {
  const [activeTab, setActiveTab] = useState<'recorder' | 'knowledge' | 'logs'>('recorder');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const wasPausedByOffline = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [selectedProject, setSelectedProject] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kbFileInputRef = useRef<HTMLInputElement>(null);

  const [logs, setLogs] = useState<any[]>([]);

  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([
    { id: 1, name: 'Procurement Guidelines v2.pdf', type: 'Company SOP', date: 'Oct 12, 2025' },
    { id: 2, name: 'ISO 9001:2015 Standards.docx', type: 'International Standard', date: 'Nov 05, 2025' },
    { id: 3, name: 'Safety Protocol 2026.pdf', type: 'Company SOP', date: 'Jan 15, 2026' }
  ]);

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Offline/Online effect for safety
  useEffect(() => {
    const handleOffline = () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        setIsPaused(true);
        wasPausedByOffline.current = true;
      }
    };
    const handleOnline = () => {
      if (mediaRecorder && mediaRecorder.state === 'paused' && wasPausedByOffline.current) {
        mediaRecorder.resume();
        setIsPaused(false);
        wasPausedByOffline.current = false;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [mediaRecorder]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
        processAudioFile(file);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      setTranscript(null);
      setSummary(null);
      setRecordingTime(0);
      setAudioFile(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      wasPausedByOffline.current = false;
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      wasPausedByOffline.current = false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (150MB = 150 * 1024 * 1024 bytes)
      if (file.size > 150 * 1024 * 1024) {
        alert("File size exceeds 150MB limit.");
        return;
      }
      setAudioFile(file);
      setTranscript(null);
      setSummary(null);
      processAudioFile(file);
    }
  };

  const handleKbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Data = await fileToBase64(file);
        const newFile = {
          id: Date.now(),
          name: file.name,
          type: file.type || 'Document',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          base64Data: base64Data,
          mimeType: file.type || 'application/octet-stream'
        };
        setKnowledgeFiles([newFile, ...knowledgeFiles]);
      } catch (error) {
        console.error("Error reading knowledge base file:", error);
        alert("Failed to read file.");
      }
    }
  };

  const handleKbDelete = (id: number) => {
    setKnowledgeFiles(knowledgeFiles.filter(f => f.id !== id));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const processAudioFile = async (file: File) => {
    if (!navigator.onLine) {
      alert("You are currently offline. The recording has been saved locally. Please click 'Process Recording' when your connection is restored.");
      return;
    }
    setIsProcessing(true);
    try {
      const base64Data = await fileToBase64(file);
      // Wait, process.env.GEMINI_API_KEY could be undefined or error in UI
      let apiKey = "";
      try {
        apiKey = process.env.GEMINI_API_KEY || "";
      } catch (e) {
        // Fallback in case of ReferenceError during development outside of Vite's replacement
      }
      
      if (!apiKey) {
        alert("GEMINI_API_KEY is missing. Please ensure it is set in your environment.");
        setIsProcessing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      let prompt = `Please analyze this meeting audio recording.
Project: ${selectedProject || 'Not specified'}
Recipients: ${emailTo ? `To: ${emailTo}` : ''} ${emailCc ? `CC: ${emailCc}` : ''}

Please provide two things:
1. A full transcript of the meeting (translate to English if it's in another language like Filipino).
2. A structured summary formatted in clean Markdown. Use headings (##), bold text, and bullet points where necessary. Ensure paragraphs are well-spaced. Include:
   - Meeting Title
   - Date
   - Participants
   - Summary of Discussion
   - Key Decisions
   - Action Items
   - Responsible Persons
   - Deadlines
   - AI Insights and Recommendations

Return the response in JSON format with two keys: "transcript" and "summary".`;

      const parts: any[] = [
        {
          inlineData: {
            mimeType: file.type || 'audio/mp3',
            data: base64Data
          }
        }
      ];

      // Add knowledge base files if they have base64 data
      const validKbFiles = knowledgeFiles.filter(f => f.base64Data);
      if (validKbFiles.length > 0) {
        prompt += `\n\nAdditionally, please use the following reference documents to provide better context, accurate terminology, and more relevant AI Insights and Recommendations.`;
        validKbFiles.forEach(kbFile => {
          parts.push({
            inlineData: {
              mimeType: kbFile.mimeType,
              data: kbFile.base64Data
            }
          });
        });
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            parts: parts
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.STRING,
                description: "The full transcript of the meeting, translated to English."
              },
              summary: {
                type: Type.STRING,
                description: "A structured summary of the meeting, including Meeting Title, Date, Participants, Summary of Discussion, Key Decisions, Action Items, Responsible Persons, Deadlines, and AI Insights and Recommendations."
              }
            },
            required: ["transcript", "summary"]
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        try {
          const parsed = JSON.parse(resultText);
          setTranscript(parsed.transcript || "No transcript generated.");
          setSummary(parsed.summary || "No summary generated.");
          
          // Add to logs
          const newLog = {
            id: Date.now(),
            title: `Meeting: ${selectedProject || 'General'}`,
            time: new Date().toLocaleTimeString(),
            status: 'Completed',
            emailSent: emailTo ? 'Yes' : 'No'
          };
          setLogs([newLog, ...logs]);
        } catch (e) {
          console.error("Failed to parse JSON response", e);
          setTranscript("Error parsing transcript.");
          setSummary(resultText);
        }
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      alert("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!summary) return;
    const content = `--- MEETING REPORT ---\n\n${summary}\n\n--- TRANSCRIPT ---\n\n${transcript}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    if (!summary) return;
    const subject = encodeURIComponent(emailSubject || `Meeting Report: ${selectedProject || 'General'}`);
    const body = encodeURIComponent(`Here is the meeting report:\n\n${summary}\n\nTranscript:\n${transcript}`);
    const to = encodeURIComponent(emailTo);
    const cc = encodeURIComponent(emailCc);
    window.location.href = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`;
  };

  const handleSettingsClick = () => {
    alert("Settings Panel:\n\nCurrently, this is a placeholder. In a full implementation, this could contain:\n- API Key configuration\n- Default email recipients\n- Language preferences (e.g., Tagalog vs English default)\n- Google Drive integration settings");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Meeting Recorder</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Filipino to English translation, RAG insights, and automated reporting.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSettingsClick} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('recorder')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'recorder' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <div className="flex items-center gap-2"><Mic size={16} /> Live Recorder</div>
        </button>
        <button 
          onClick={() => setActiveTab('knowledge')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'knowledge' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <div className="flex items-center gap-2"><BookOpen size={16} /> Knowledge Base (RAG)</div>
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <div className="flex items-center gap-2"><History size={16} /> Processing Logs</div>
        </button>
      </div>

      {activeTab === 'recorder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recorder Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6 transition-colors duration-300">
              
              {/* Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <Folder size={16} />
                    Select Project
                  </label>
                  <select 
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a Project --</option>
                    {projectsList.map((proj, idx) => (
                      <option key={idx} value={proj.title || proj.name || proj}>{proj.title || proj.name || proj}</option>
                    ))}
                  </select>
                </div>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
                  <div className="px-4 py-3 bg-slate-900 dark:bg-slate-800 border-b border-slate-700 flex items-center justify-between text-sm font-medium text-white">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      New Message
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                  </div>
                  <div className="p-0">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium text-slate-400 w-12">To:</span>
                      <input 
                        type="text"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="Recipients"
                        className="flex-1 px-0 py-1 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium text-slate-400 w-12">Cc:</span>
                      <input 
                        type="text"
                        value={emailCc}
                        onChange={(e) => setEmailCc(e.target.value)}
                        placeholder="Cc"
                        className="flex-1 px-0 py-1 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium text-slate-400 w-12">Subject:</span>
                      <input 
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subject"
                        className="flex-1 px-0 py-1 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 min-h-[100px] text-xs text-slate-500 dark:text-slate-400 italic">
                      {summary ? "Meeting report attached below..." : "Report will be attached here after processing."}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                          <FileUp size={16} />
                        </button>
                      </div>
                      <button 
                        onClick={handleEmail}
                        disabled={!summary}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        Send
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col items-center justify-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${isRecording ? 'bg-red-50 dark:bg-red-900/20 border-4 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-700'}`}>
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <Mic size={40} className={isRecording ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                  </div>
                </div>

                <div className="text-3xl font-mono font-bold text-slate-800 dark:text-white mb-8">
                  {formatTime(recordingTime)}
                </div>

                {isRecording ? (
                  <div className="flex gap-3 w-full">
                    {isPaused ? (
                      <button 
                        onClick={handleResumeRecording}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                      >
                        <Play size={20} className="fill-current" />
                        Resume
                      </button>
                    ) : (
                      <button 
                        onClick={handlePauseRecording}
                        className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors"
                      >
                        <Pause size={20} className="fill-current" />
                        Pause
                      </button>
                    )}
                    <button 
                      onClick={handleStopRecording}
                      className="flex-1 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Square size={20} className="fill-current" />
                      Stop
                    </button>
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    {audioFile && !summary && !isProcessing && (
                      <button 
                        onClick={() => processAudioFile(audioFile)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mb-3"
                      >
                        <Play size={20} className="fill-current" />
                        Process Saved Recording
                      </button>
                    )}
                    <button 
                      onClick={handleStartRecording}
                      disabled={isProcessing}
                      className="w-full py-3 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play size={20} className="fill-current" />
                          Start Recording
                        </>
                      )}
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">OR</span>
                      </div>
                    </div>

                    <input 
                      type="file" 
                      accept="audio/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <Upload size={20} />
                      Upload Audio File
                    </button>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">Max file size: 150MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                <FileText size={18} />
                Automated Workflow
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                <li>Record Filipino audio</li>
                <li>Transcribe & Translate to English</li>
                <li>Generate structured report</li>
                <li>Retrieve RAG insights from SOPs</li>
                <li>Save to Google Docs & Email</li>
              </ul>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 min-h-[200px] flex flex-col transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  Structured Report & Insights
                </h3>
                {summary && (
                  <div className="flex gap-2">
                    <button onClick={handleEmail} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2" title="Email Report">
                      <Mail size={18} />
                    </button>
                    <button onClick={handleDownload} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2" title="Download Docs">
                      <Download size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-100 dark:border-slate-800">
                {isProcessing ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3 py-12">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p>Transcribing, translating, and generating insights...</p>
                  </div>
                ) : summary ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {summary}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm py-12">
                    Report will appear here after recording.
                  </div>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 min-h-[200px] flex flex-col transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Mic size={20} className="text-blue-600 dark:text-blue-400" />
                  Original Filipino Transcript
                </h3>
              </div>
              
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[300px]">
                {isProcessing ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3 py-8">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                  </div>
                ) : transcript ? (
                  <div className="space-y-4">
                    {transcript.split('\n').map((line, i) => {
                      const [speaker, ...textParts] = line.split(':');
                      const text = textParts.join(':');
                      return (
                        <div key={i} className="text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{speaker}:</span>
                          <span className="text-slate-600 dark:text-slate-400 ml-2">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm py-8">
                    Transcript will appear here after recording.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Reference Documents</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload SOPs, standards, and manuals for the AI to use as context (RAG).</p>
            </div>
            <button onClick={() => kbFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
              <Upload size={18} />
              Upload Document
            </button>
            <input 
              type="file" 
              ref={kbFileInputRef} 
              className="hidden" 
              onChange={handleKbUpload} 
            />
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Document Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date Indexed</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {knowledgeFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No documents uploaded yet.</td>
                  </tr>
                ) : (
                  knowledgeFiles.map(file => (
                    <tr key={file.id}>
                      <td className="px-4 py-3 flex items-center gap-2 text-slate-800 dark:text-slate-200"><FileUp size={16} className="text-blue-500"/> {file.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{file.type}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{file.date}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-medium"><CheckCircle size={12}/> Indexed</span></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleKbDelete(file.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1" title="Delete Document">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Processing Logs</h3>
            {logs.length > 0 && (
              <button 
                onClick={() => setLogs([])}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
              >
                <Trash2 size={16} />
                Clear Logs
              </button>
            )}
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Meeting Title</th>
                  <th className="px-4 py-3 font-medium">Time Processed</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Email Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      <History size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p>No processing logs yet.</p>
                      <p className="text-xs mt-1">Recordings and reports will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">{log.title}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{log.time}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-medium">
                          <CheckCircle size={12}/> {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{log.emailSent}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Floating Indicator when recording but not on the active tab */}
      {(!isActiveTab && isRecording) && (
        <div 
          className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 cursor-pointer hover:scale-105 transition-transform border border-slate-700"
          onClick={onNavigateToRecorder}
        >
          <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
          <div className="font-mono font-bold">{formatTime(recordingTime)}</div>
          <div className="text-sm font-medium">{isPaused ? 'Recording Paused' : 'Recording...'}</div>
        </div>
      )}
    </div>
  );
}
