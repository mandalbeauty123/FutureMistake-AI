import { useState, useRef } from "react";
import MistakeHighlighter from "./components/MistakeHighlighter";
import Sidebar from "./components/Sidebar";
import MistakeHistory from "./components/MistakeHistory";
import ErrorCards from "./components/ErrorCards";
import useMistakeStorage from "./hooks/useMistakeStorage";
import { analyzeOffline } from "./utils/analyzeOffline";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
// Force DEMO_MODE to use comprehensive offline analysis
const DEMO_MODE = true;

// Legacy function - keeping for compatibility
const analyzeTextLocally = (text) => {
  const mistakes = [];
  
  // Check for common factual errors
  const factualPatterns = [
    { pattern: /\bearth\s+is\s+(\d+)\s+years\s+old\b/i, message: 'Factual error: The Earth is approximately 4.5 billion years old' },
    { pattern: /\bsun\s+revolves\s+around\s+the\s+earth/i, message: 'Factual error: The Earth revolves around the Sun, not the other way around' },
    { pattern: /\bthe\s+sun\s+goes?\s+around\s+the\s+earth/i, message: 'Factual error: The Earth orbits the Sun, not vice versa' },
    { pattern: /\bthe\s+sun\s+moves\s+around\s+the?earth/i, message: 'Factual error: The Earth orbits the Sun (heliocentric system)' },
    { pattern: /\bworld\s+war\s+(\d)\s+happened\s+in\s+(\d{4})/i, message: 'Factual error: Please verify the date - WWI (1914-1918), WWII (1939-1945)' },
    { pattern: /\bmoon\s+(is\s+)?made\s+of\s+cheese/i, message: 'Factual error: The moon is made of rock and dust, not cheese' },
    { pattern: /\bwater\s+boils\s+at\s+(\d+)\s+degrees?/i, message: 'Factual error: Water boils at 100°C (212°F) at sea level' },
    { pattern: /\bgold\s+is\s+(\w+\s+)?lighter\s+than\s+(plastic|water)/i, message: 'Factual error: Gold is much heavier than plastic (density: 19.3 g/cm³)' },
    { pattern: /\boxygen\s+is\s+combustible/i, message: 'Factual error: Oxygen is not combustible; it supports combustion' },
    { pattern: /\bhumans?\s+(only\s+)?use\s+(\d+)%\s+(of\s+)?their\s+brain/i, message: 'Factual error: Humans use virtually all of their brain; the "10% myth" is false' },
    { pattern: /\bgravity\s+pulls\s+(?!down)\b/i, message: 'Factual error: Gravity pulls objects downward (toward the center of Earth)' },
    { pattern: /\bblood\s+is\s+blue/i, message: 'Factual error: Blood is red; it appears blue through skin because of how light is absorbed and reflected' },
  ];
  
  // Check for grammar issues
  const grammarPatterns = [
    { pattern: /\byour\s+(going|coming|doing|being|making|taking|running|working)/gi, message: 'Did you mean "you\'re" (you are)?' },
    { pattern: /\byour\s+(a|an|the|job|way|turn)/gi, message: 'Did you mean "you\'re" (you are) instead of "your"?' },
    { pattern: /\bits\s+(going|coming|time|not|ok|good|bad|amazing|clear|obvious|true|false|right|wrong)\b/gi, message: 'Did you mean "it\'s" (it is)?' },
    { pattern: /\ba\s+([aeiou])/gi, message: 'Should use "an" before vowels' },
    { pattern: /(would|could|should)\s+of\b/gi, message: 'Use "would have", "could have", or "should have"' },
    { pattern: /\b(could|might|may)\s+(of|have)\s+been\b/gi, message: 'Use "could have been", "might have been", or "may have been"' },
    { pattern: /[.!?]\s+[a-z]/g, message: 'Sentence should start with a capital letter' },
    { pattern: /\.{3,}/g, message: 'Avoid using multiple ellipsis dots; use "..." (three dots)' },
    { pattern: /\s{2,}/g, message: 'Remove extra spaces between words' },
    { pattern: /\bthere\s+are\s+\d+\s+\w+\s+that\s+is\b/gi, message: 'Plural subject with singular verb: "are" but "is" agree?' },
    { pattern: /\bthats\b/gi, message: 'Did you mean "that\'s" (that is)?' },
    { pattern: /\bwhos\b/gi, message: 'Did you mean "who\'s" (who is)?' },
    { pattern: /\bwheres\b/gi, message: 'Did you mean "where\'s" (where is)?' },
    { pattern: /\btheir\s+(going|coming|doing|being)/gi, message: 'Did you mean "they\'re" (they are)?' },
    { pattern: /\bto\s+(their|there)\s+(house|place|home)/gi, message: 'Did you mean "to their house" or "over there"?' },
  ];
  
  // Check for logical errors
  const logicalPatterns = [
    // Contradictory terms (with flexible spacing)
    { pattern: /\bbut\s+however\b/gi, message: 'Redundant connectors: choose "but" OR "however", not both' },
    { pattern: /\byet\s+still\b/gi, message: 'Redundant: "yet" and "still" express the same contrast - use one' },
    { pattern: /\balthough\s+however\b/gi, message: 'Redundant: "although" and "however" both indicate contrast' },
    { pattern: /\bdespite\s+(that\s+)?but\b/gi, message: 'Redundant: "despite" and "but" both signal contrast' },
    { pattern: /\band\s+also\b/gi, message: 'Redundant: "and" already includes "also" - use just one' },
    
    // Modifying absolutes
    { pattern: /\bvery\s+unique\b/gi, message: '"Unique" is absolute - something cannot be "very" unique' },
    { pattern: /\bfairly\s+unique\b/gi, message: '"Unique" is absolute - something cannot be "fairly" unique' },
    { pattern: /\bsomewhat\s+unique\b/gi, message: '"Unique" is absolute - something cannot be "somewhat" unique' },
    { pattern: /\bslightly\s+unique\b/gi, message: '"Unique" is absolute - something cannot be "slightly" unique' },
    { pattern: /\bextremely\s+unique\b/gi, message: '"Unique" is absolute - "extremely" is redundant' },
    
    // More absolute term contradictions
    { pattern: /\bdefinitely\s+maybe\b/gi, message: 'Contradiction: "definitely" and "maybe" are opposites' },
    { pattern: /\babsolutely\s+maybe\b/gi, message: 'Contradiction: "absolutely" and "maybe" cannot both apply' },
    { pattern: /\bexactly\s+approximate\b/gi, message: 'Contradiction: "exactly" and "approximate" are opposites' },
    { pattern: /\bperfectly\s+imperfect\b/gi, message: 'Contradiction: cannot be both "perfectly" and "imperfect"' },
    { pattern: /\bcompletely\s+partial\b/gi, message: 'Contradiction: "completely" and "partial" are opposites' },
    { pattern: /\btotally\s+partially\b/gi, message: 'Contradiction: "totally" and "partially" conflict' },
    
    // Conflicting intensity
    { pattern: /\balmost\s+(certainly|definitely|always|never|perfect|impossible)\b/gi, message: 'Logic issue: "almost" weakens absolute terms' },
    { pattern: /\bslightly\s+(im)?possible\b/gi, message: 'Logic error: cannot be "slightly" when absolute' },
    { pattern: /\bpartially\s+(true|false|complete|finished)\b/gi, message: 'Logic error: absolute values cannot be partially applied' },
    
    // Impossible combinations
    { pattern: /\bfree\s+.*\s+fee\b/gi, message: 'Logic error: something cannot be "free" and have a "fee"' },
    { pattern: /\bliving\s+dead\b/gi, message: 'Logical contradiction: cannot be both "living" and "dead"' },
    { pattern: /\bdead\s+alive\b/gi, message: 'Logical contradiction: cannot be both "dead" and "alive"' },
    { pattern: /\bsilent\s+scream\b/gi, message: 'Contradiction: screams are loud, not "silent"' },
    { pattern: /\bdeafening\s+silence\b/gi, message: 'Contradiction: "silence" is quiet, not "deafening"' },
    
    // Contradictory instructions
    { pattern: /\bnever\s+.{1,80}?\s+always\b/gi, message: 'Contradiction: "never" and "always" are opposites' },
    { pattern: /\balways\s+.{1,80}?\s+never\b/gi, message: 'Contradiction: "always" and "never" are opposites' },
    { pattern: /\bopen\s+.{1,80}?\s+closed\b/gi, message: 'Contradiction: cannot be both "open" and "closed"' },
    { pattern: /\bnobody\s+.{1,80}?\s+everybody\b/gi, message: 'Contradiction: "nobody" and "everybody" conflict' },
    
    // Time contradictions
    { pattern: /\bfuture\s+past\b/gi, message: 'Contradiction: cannot have a "future past"' },
    { pattern: /\bpast\s+future\b/gi, message: 'Contradiction: cannot have a "past future"' },
    { pattern: /\bmomentary\s+eternity\b/gi, message: 'Contradiction: eternity is infinite, not momentary' },
    { pattern: /\bbrief\s+eternity\b/gi, message: 'Contradiction: eternity is infinite, not brief' },
    
    // Illogical standards
    { pattern: /\bas\s+unique\s+as\s+everyone\s+else\b/gi, message: 'Logic error: cannot be unique like everyone else' },
    { pattern: /\bas\s+different\s+as\s+the\s+same\b/gi, message: 'Logic error: cannot be different if you\'re the same' },
    
    // Double negatives (logic)
    { pattern: /\bdon't\s+.{1,50}?\s+not\b/gi, message: 'Double negative: "don\'t" and "not" together are confusing' },
    { pattern: /\bcannot\s+.{1,50}?\s+not\b/gi, message: 'Double negative: "cannot" already negates' },
    
    // Contradictory causation - less/fewer causing more
    { pattern: /\b(sleep|eat|drink|work|study|exercise|practice)\s+(less|fewer)\b.{1,80}?\b(more|better|greater|increase|improve)\b/gi, message: 'Logic error: doing less typically results in less, not more' },
    { pattern: /\bfewer\s+\w+.{1,60}?\bmore\s+(energetic|productive|successful|happy|healthy)\b/gi, message: 'Logic error: fewer inputs typically produce fewer outputs, not more' },
    
    // Contradictory effects
    { pattern: /\bif\s+.{1,100}?\b(less|fewer|decrease|reduce|cut|drop|lower).{1,80}?\b(will|would)\s+(be|feel|get|become)\s+(more|better|greater|stronger|higher)\b/gi, message: 'Logic error: decreasing makes outcomes worse, not better' },
    { pattern: /\bby\s+.{1,80}?(less|reduce|decrease|cut).{1,60}?(more|better|increase|improve)\b/gi, message: 'Logic error: reducing usually doesn\'t create more' },
    
    // Time-related logical flaws
    { pattern: /\b(save|saving)\s+time.{1,100}?\b(sleep|rest|relax)\s+(less|fewer|reduce|decrease)/gi, message: 'Logic error: sleeping less doesn\'t save time for rest - it reduces rest' },
    { pattern: /\b(less|no)\s+(sleep|rest|break).{1,80}?(more|better)\s+(focus|energy|productivity|alertness)/gi, message: 'Logic error: less sleep/rest reduces energy, not increases it' },
  ];
  
  // Scan for factual errors
  factualPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      mistakes.push({
        type: 'factual',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message
      });
    }
  });
  
  // Scan for grammar errors
  grammarPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      mistakes.push({
        type: 'grammar',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message
      });
    }
  });
  
  // Scan for logical errors
  logicalPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      mistakes.push({
        type: 'logical',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message
      });
    }
  });
  
  // Calculate risk score
  const riskScore = Math.min(100, mistakes.length * 15);
  
  return {
    mistakes,
    risk_score: riskScore,
    summary: mistakes.length === 0 
      ? "No issues detected! Your text looks good." 
      : `Found ${mistakes.length} issue${mistakes.length > 1 ? 's' : ''}: ${mistakes.filter(m => m.type === 'logical').length} logical, ${mistakes.filter(m => m.type === 'factual').length} factual, ${mistakes.filter(m => m.type === 'grammar').length} grammar`
  };
};

export default function App() {
  const [text, setText] = useState("");
  const [mistakes, setMistakes] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMistake, setSelectedMistake] = useState(null);
  const [view, setView] = useState("analyzer"); // "analyzer" or "history"
  const textInputRef = useRef(null);
  const { addLog } = useMistakeStorage();

  const handleMistakeClick = (mistake) => {
    setSelectedMistake(mistake);
    // Scroll textarea to show the mistake
    if (textInputRef.current) {
      const textarea = textInputRef.current;
      const scrollPercentage = (mistake.startIndex / textarea.value.length) * 100;
      const scrollPosition = (scrollPercentage / 100) * (textarea.scrollHeight - textarea.clientHeight);
      textarea.scrollTop = scrollPosition;
      
      // Focus textarea for visual feedback
      textarea.focus();
      
      // Simple selection highlight
      setTimeout(() => {
        textarea.setSelectionRange(mistake.startIndex, mistake.endIndex);
      }, 50);
    }
  };

  async function analyzeText() {
    if (!text.trim()) return;
    setLoading(true);
    
    try {
      // Use comprehensive offline analysis
      if (DEMO_MODE) {
        console.log("📋 Using COMPREHENSIVE OFFLINE analysis");
        const analysisResult = analyzeOffline(text);
        
        // Flatten all mistake categories into single array with type preserved
        const allMistakes = [
          ...analysisResult.logical,
          ...analysisResult.factual,
          ...analysisResult.grammar,
          ...analysisResult.math,
          ...analysisResult.science,
          ...analysisResult.history,
          ...analysisResult.health,
          ...analysisResult.technology
        ];
        
        const result = {
          ...analysisResult,
          mistakes: allMistakes,
          summary: `Found ${allMistakes.length} issue${allMistakes.length !== 1 ? 's' : ''}: ${
            analysisResult.math.length > 0 ? `${analysisResult.math.length} math, ` : ''
          }${
            analysisResult.logical.length > 0 ? `${analysisResult.logical.length} logical, ` : ''
          }${
            analysisResult.science.length > 0 ? `${analysisResult.science.length} science, ` : ''
          }${
            analysisResult.grammar.length > 0 ? `${analysisResult.grammar.length} grammar` : ''
          }`.replace(/,\s*$/, '')
        };
        
        setMistakes(allMistakes);
        setResult(result);
        // Save to localStorage
        addLog(text, allMistakes, analysisResult.risk_score);
        setLoading(false);
        return;
      }

      console.log("Starting Groq API analysis...");

      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_KEY}`
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [{
              role: "user",
              content: `Analyze this text for logical, factual, and grammar mistakes. Return ONLY valid JSON (no markdown, no backticks):
{
  "mistakes": [
    {"type": "logical|factual|grammar", "startIndex": number, "endIndex": number, "message": "error description"}
  ],
  "risk_score": 0-100,
  "summary": "brief summary"
}

Text to analyze: "${text}"`
            }],
            temperature: 0.7,
            max_tokens: 1024
          })
        }
      );
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(`API rejected request (${res.status}): ${errorData.error?.message || 'Invalid API Key'}`);
      }
      
      const data = await res.json();
      console.log("API Response:", data);
      
      const responseText = data.choices?.[0]?.message?.content;
      
      if (!responseText) throw new Error("No response from API - check API limits or key validity");
      
      const clean = responseText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      
      setMistakes(parsed.mistakes || []);
      setResult(parsed);
      // Save to localStorage
      addLog(text, parsed.mistakes || [], parsed.risk_score || 0);
    } catch (e) {
      console.error("Error:", e.message);
      setResult({ 
        error: `❌ ${e.message}` 
      });
      setMistakes([]);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar mistakes={mistakes} onMistakeClick={handleMistakeClick} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 mb-2">⚡ FutureMistake AI</h1>
              <p className="text-gray-400">Detect logical, factual, and grammar mistakes with AI-powered analysis.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView("analyzer")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === "analyzer"
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Analyzer
              </button>
              <button
                onClick={() => setView("history")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === "history"
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                History
              </button>
            </div>
          </div>

          {view === "analyzer" ? (
            <>
              {DEMO_MODE && (
                <div className="bg-blue-900 border border-blue-700 p-3 rounded-lg text-blue-200 mb-6 text-sm">
                  💻 <strong>LOCAL MODE:</strong> Running offline analysis. For powered-by-AI analysis, add a Groq API key from <a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="underline hover:text-blue-300">console.groq.com</a> to .env as VITE_GROQ_API_KEY
                </div>
              )}

              <div className="space-y-4">
                <textarea
                  ref={textInputRef}
                  className="w-full h-40 bg-gray-900 border border-cyan-800 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-900"
                  placeholder="Paste your text here to analyze for mistakes..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <button
                  onClick={analyzeText}
                  disabled={loading || !text.trim()}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  {loading ? "Analyzing..." : "Analyze Text"}
                </button>
              </div>

              {result && (
                <div className="mt-8 space-y-4">
                  {result.error ? (
                    <div className="bg-red-900 border border-red-700 p-4 rounded-lg text-red-200">
                      {result.error}
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">Risk Score</span>
                          <span className={`text-2xl font-bold ${result.risk_score > 70 ? 'text-red-400' : result.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {result.risk_score || 0}/100
                          </span>
                        </div>
                        {result.summary && (
                          <p className="text-gray-300 text-sm">{result.summary}</p>
                        )}
                        {/* Risk Score Bar */}
                        <div className="mt-4">
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                result.risk_score > 70 ? 'bg-red-500' : 
                                result.risk_score > 40 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${result.risk_score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Error Category Cards */}
                      <ErrorCards analysisResult={result} mistakes={mistakes} />

                      <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <h2 className="text-lg font-semibold text-cyan-400 mb-3">Highlighted Text</h2>
                        <MistakeHighlighter text={text} mistakes={mistakes} />
                      </div>

                      {mistakes.length === 0 && !result.error && (
                        <div className="bg-green-900 border border-green-700 p-4 rounded-lg text-green-200">
                          ✓ No mistakes detected!
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <MistakeHistory />
          )}
        </div>
      </div>
    </div>
  );
}