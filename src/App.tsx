/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { Search, Mail, MessageSquare, Target, Zap, CheckCircle2, Loader2, AlertCircle, Copy, Brain, ThumbsUp, ThumbsDown } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface OutreachResult {
  researchNotes: string;
  personalityProfile: {
    mindset: string;
    communicationStyle: string;
    overallTone: string;
    toneAnalysis: {
      intensity: string;
      formality: string;
      linguisticQuirks: string[];
      strategicChoice: string;
    };
    likes: string[];
    dislikes: string[];
  };
  emailSubject: string;
  emailBody: string;
  linkedinDM: string;
  followUp1: string;
  followUp2: string;
  score: number;
  reasoning: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all" title="Copy to clipboard">
      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function App() {
  const [targetName, setTargetName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [goal, setGoal] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!targetName || !targetCompany || !goal) {
      setError('Please fill in all fields to give the agent context.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const prompt = `
        You are ContextCraft, a Master Conversationalist & Psychological Strategist. 
        Your task is to not only research the following target but also deeply understand and adapt to their human psychology and communication nuances. You will analyze their personality and write a hyper-personalized outreach message designed for maximum rapport and influence, perfectly matching their mindset.
        
        Target Name: ${targetName}
        Target Company: ${targetCompany}
        Outreach Goal: ${goal}
        ${referenceUrl ? 'Reference Article/Post URL: ' + referenceUrl : ''}
        
        Step 1: Use your Google Search tool to search the ENTIRE WEB (news, personal blogs, Twitter/X, GitHub, podcasts, company pages, and LinkedIn) to find comprehensive context about ${targetName} at ${targetCompany}. Do not restrict your search to just LinkedIn; find their digital footprint everywhere. ${referenceUrl ? 'CRITICAL: You MUST also read and analyze the provided Reference Article/Post URL (e.g., LinkedIn article) to deeply understand their specific thoughts, tone, and recent focus.' : ''}
        Step 2: Synthesize your findings into brief research notes.
        Step 3: Analyze the target's personality based on ${referenceUrl ? 'the provided reference link and ' : ''}broader web search results. Perform a deep Psychological Profiling inferring their potential core values, primary motivators (e.g., impact, efficiency, innovation), and likely cognitive biases (e.g., action bias, confirmation bias towards data), in addition to their likely mindset (e.g., visionary, pragmatic, data-driven), preferred communication style (e.g., direct, formal, story-driven), overall tone (e.g., casual, academic, intense, humorous), what they likely appreciate (likes), and what they likely hate in cold emails (dislikes). Also, perform a nuanced tone analysis: identify their tone's intensity, formality level, and any specific linguistic quirks.
        Step 4: Draft a highly personalized cold email (subject and body). CRITICAL INSTRUCTION: You MUST incorporate these deep psychological insights directly into the drafting of the outreach message. Adapt your message generation to either mirror their tone for rapport or subtly contrast it based on the strategic Outreach Goal. Align your value proposition with their inferred core values and motivators, and frame your ask to bypass or leverage their cognitive biases. If they are 'data-driven', use metrics. If they 'hate fluff', be brutally concise. Explicitly cater to their 'likes' and strictly avoid their 'dislikes'.
        Step 5: Draft a shorter, punchy LinkedIn DM variant (under 300 characters). This must also strictly adhere to their preferred communication style and psychological profile.
        Step 6: Generate 2 short follow-up email variants. Follow-up 1 (3 days later) should be a gentle bump providing a tiny bit of extra value. Follow-up 2 (7 days later) should be a polite final attempt.
        Step 7: Score your own outreach out of 100 based on personalization depth, psychological alignment, tone, and likelihood of response. In your 'reasoning', you MUST provide a detailed, actionable, and psychologically informed explanation for this score. If the score is high, highlight the key strengths (e.g., 'excellent incorporation of user's interest X', 'strong tone alignment'). If the score is low, explicitly state the primary weaknesses (e.g., 'lack of personalization', 'tone mismatch'). Additionally, you MUST detail the psychological underpinnings of your chosen outreach strategy. Explain *why* a particular tone (mirroring or contrasting) was selected based on principles of persuasion or rapport-building, and *how* this choice is strategically expected to influence the recipient's perception and increase the likelihood of a positive response. Crucially, you MUST explain how your strategy specifically leverages or bypasses the target's identified cognitive biases, detailing the psychological mechanism at play.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          tools: [{ googleSearch: {} }, { urlContext: {} }], // Enables web research and URL reading
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              researchNotes: { 
                type: Type.STRING, 
                description: "Bullet points of key facts found via search about the person or company." 
              },
              personalityProfile: { 
                type: Type.OBJECT,
                description: "Deep psychological profile of the target.",
                properties: {
                  coreValues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Inferred core values (e.g., transparency, autonomy, speed)." },
                  motivators: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Primary motivators driving their work (e.g., impact, efficiency, innovation)." },
                  cognitiveBiases: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Likely cognitive biases to bypass or leverage (e.g., action bias, confirmation bias towards data)." },
                  mindset: { type: Type.STRING, description: "The target's core professional mindset or worldview." },
                  communicationStyle: { type: Type.STRING, description: "How they prefer to communicate (e.g., direct, analytical, visionary)." },
                  overallTone: { type: Type.STRING, description: "The dominant tone of their online presence and writings (e.g., intense, casual, academic)." },
                  toneAnalysis: {
                    type: Type.OBJECT,
                    description: "Nuanced analysis of the target's tone and the strategic choice for the outreach.",
                    properties: {
                      intensity: { type: Type.STRING, description: "The intensity of their tone (e.g., high-energy, calm, urgent)." },
                      formality: { type: Type.STRING, description: "The formality level (e.g., highly formal, business casual, extremely casual)." },
                      linguisticQuirks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific linguistic quirks, phrases, or structural habits they use." },
                      strategicChoice: { type: Type.STRING, description: "Explanation of whether to mirror or contrast their tone, and why." }
                    },
                    required: ["intensity", "formality", "linguisticQuirks", "strategicChoice"]
                  },
                  likes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Things they likely appreciate or value in professional contexts." },
                  dislikes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Things they likely hate, especially in cold outreach (e.g., fluff, long emails)." }
                },
                required: ["coreValues", "motivators", "cognitiveBiases", "mindset", "communicationStyle", "overallTone", "toneAnalysis", "likes", "dislikes"]
              },
              emailSubject: { type: Type.STRING },
              emailBody: { type: Type.STRING },
              linkedinDM: { type: Type.STRING },
              followUp1: { type: Type.STRING, description: "First follow-up email body (3 days later)" },
              followUp2: { type: Type.STRING, description: "Second follow-up email body (7 days later)" },
              score: { 
                type: Type.NUMBER, 
                description: "0-100 score of how effective this outreach is." 
              },
              reasoning: { 
                type: Type.STRING, 
                description: "Actionable, detailed, and psychologically informed explanation for the score. If high, highlight key strengths (e.g., 'strong tone alignment'). If low, state primary weaknesses (e.g., 'lack of personalization'). Must detail the psychological underpinnings of the strategy, *why* a particular tone (mirroring/contrasting) was selected based on principles of persuasion or rapport-building, *how* this choice strategically influences the recipient's perception to increase positive response likelihood, and how the message leverages or bypasses cognitive biases." 
              }
            },
            required: ["researchNotes", "personalityProfile", "emailSubject", "emailBody", "linkedinDM", "followUp1", "followUp2", "score", "reasoning"]
          }
        }
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text) as OutreachResult;
        setResult(parsedResult);
      } else {
        throw new Error("No response generated.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the outreach.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">ContextCraft</h1>
          <span className="ml-2 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
            AgentathonX
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Target Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sam Altman"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company / Organization</label>
                <input 
                  type="text" 
                  placeholder="e.g. OpenAI"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Outreach Goal</label>
                <textarea 
                  placeholder="e.g. I want to ask for a summer internship referral in the AI engineering team."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="e.g. Any blog, tweet, news article, or profile link"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Agents Researching...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Run ContextCraft Pipeline
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Agent Pipeline Status */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Agent Pipeline</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isGenerating || result ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {result ? <CheckCircle2 className="w-5 h-5" /> : <Search className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Research Agent</p>
                  <p className="text-xs text-slate-500">Searches entire web for digital footprint</p>
                </div>
              </div>
              <div className="w-0.5 h-4 bg-slate-200 ml-4"></div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result ? 'bg-emerald-100 text-emerald-600' : isGenerating ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                  {result ? <CheckCircle2 className="w-5 h-5" /> : <Mail className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Drafting Agent</p>
                  <p className="text-xs text-slate-500">Writes personalized copy</p>
                </div>
              </div>
              <div className="w-0.5 h-4 bg-slate-200 ml-4"></div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {result ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Scoring Agent</p>
                  <p className="text-xs text-slate-500">Evaluates response probability</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {!result && !isGenerating ? (
            <div className="h-full min-h-[400px] bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to craft</h3>
              <p className="text-slate-500 max-w-md">
                Enter a target's details on the left. The AI pipeline will research them via Google Search and generate hyper-personalized outreach.
              </p>
            </div>
          ) : isGenerating ? (
            <div className="h-full min-h-[400px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center p-8 shadow-sm">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Agents are working...</h3>
              <p className="text-slate-500 animate-pulse">Searching the web, analyzing context, and drafting messages.</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Score Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-6">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                      <circle 
                        cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={226.2} 
                        strokeDashoffset={226.2 - (226.2 * result.score) / 100}
                        className={result.score >= 80 ? 'text-emerald-500' : result.score >= 60 ? 'text-amber-500' : 'text-red-500'} 
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold text-slate-900">{result.score}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 mt-2 uppercase tracking-wider">Score</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Agent Evaluation</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{result.reasoning}</p>
                </div>
              </div>

              {/* Research Notes */}
              <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-slate-300">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Search className="w-4 h-4" />
                  Live Research Context
                </h3>
                <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
                  {result.researchNotes}
                </div>
              </div>

              {/* Psychological Profile */}
              <div className="bg-indigo-900 p-6 rounded-2xl shadow-sm text-indigo-50">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Brain className="w-4 h-4 text-indigo-300" />
                  Psychological Profile & Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Mindset</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.mindset}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Core Values</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.coreValues.join(', ')}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Motivators</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.motivators.join(', ')}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Cognitive Biases</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.cognitiveBiases.join(', ')}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Communication Style</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.communicationStyle}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Overall Tone</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.overallTone}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Tone Strategy</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.toneAnalysis.strategicChoice}</p>
                    </div>
                    <div>
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider block mb-1">Linguistic Quirks</span>
                      <p className="text-sm font-medium text-white">{result.personalityProfile.toneAnalysis.linguisticQuirks.join(', ')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-emerald-300 font-medium uppercase tracking-wider flex items-center gap-1 mb-1">
                        <ThumbsUp className="w-3 h-3" /> Likely Appreciates
                      </span>
                      <ul className="text-sm text-indigo-100 space-y-1 list-disc list-inside">
                        {result.personalityProfile.likes.map((like, i) => <li key={i}>{like}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs text-red-300 font-medium uppercase tracking-wider flex items-center gap-1 mb-1">
                        <ThumbsDown className="w-3 h-3" /> Likely Hates
                      </span>
                      <ul className="text-sm text-indigo-100 space-y-1 list-disc list-inside">
                        {result.personalityProfile.dislikes.map((dislike, i) => <li key={i}>{dislike}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Draft */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">Email Draft</span>
                  </div>
                  <CopyButton text={`Subject: ${result.emailSubject}\n\n${result.emailBody}`} />
                </div>
                <div className="p-6">
                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Subject</span>
                    <p className="text-slate-900 font-medium">{result.emailSubject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-2">Body</span>
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {result.emailBody}
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn DM */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-[#0A66C2]/10 px-6 py-3 border-b border-[#0A66C2]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#0A66C2]" />
                    <span className="text-sm font-semibold text-[#0A66C2]">LinkedIn DM Variant</span>
                  </div>
                  <CopyButton text={result.linkedinDM} />
                </div>
                <div className="p-6">
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.linkedinDM}
                  </div>
                </div>
              </div>

              {/* Follow-up Sequence */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Follow-up Sequence</span>
                </div>
                <div className="p-6 space-y-6">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Follow-up 1 (Day 3)</span>
                      <CopyButton text={result.followUp1} />
                    </div>
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {result.followUp1}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Follow-up 2 (Day 7)</span>
                      <CopyButton text={result.followUp2} />
                    </div>
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {result.followUp2}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>

      </main>
    </div>
  );
}
