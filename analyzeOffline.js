/**
 * Comprehensive Offline Text Analysis Function
 * Detects: Math, Science, History, Logic, Grammar, Health, Technology
 */

export const analyzeOffline = (text) => {
  const mistakes = {
    logical: [],
    factual: [],
    grammar: [],
    math: [],
    science: [],
    history: [],
    health: [],
    technology: []
  };

  if (!text || text.trim().length === 0) {
    return { ...mistakes, risk_score: 0 };
  }

  // ==================== MATHEMATICS ====================
  detectMathErrors(text, mistakes);
  
  // ==================== SCIENCE ====================
  detectScienceErrors(text, mistakes);
  
  // ==================== HISTORY ====================
  detectHistoryErrors(text, mistakes);
  
  // ==================== LOGIC ====================
  detectLogicalErrors(text, mistakes);
  
  // ==================== GRAMMAR ====================
  detectGrammarErrors(text, mistakes);
  
  // ==================== HEALTH ====================
  detectHealthMyths(text, mistakes);
  
  // ==================== TECHNOLOGY ====================
  detectTechErrors(text, mistakes);

  // Calculate risk score
  const risk_score = calculateRiskScore(mistakes);

  return { ...mistakes, risk_score };
};

// ==================== MATHEMATICS DETECTION ====================
const detectMathErrors = (text, mistakes) => {
  // Arithmetic verification (e.g., "2 + 2 = 5")
  const mathExpression = /(\d+)\s*([+\-×*])\s*(\d+)\s*=\s*(\d+)/gi;
  for (const m of text.matchAll(mathExpression)) {
    const num1 = parseInt(m[1]);
    const num2 = parseInt(m[3]);
    const operator = m[2];
    const answer = parseInt(m[4]);
    let correct;

    if (operator === '+') correct = num1 + num2;
    else if (operator === '-') correct = num1 - num2;
    else if (operator === '×' || operator === '*') correct = num1 * num2;

    if (correct !== answer) {
      mistakes.math.push({
        type: 'math',
        match: m[0],
        message: `❌ ${num1} ${operator} ${num2} = ${answer} is WRONG. Correct answer: ${correct}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  }

  // Square root errors
  const sqrtPatterns = [
    { pattern: /\bsquare\s+root\s+of\s+4\s+is\s+3\b/gi, correct: '2' },
    { pattern: /\bsquare\s+root\s+of\s+9\s+is\s+4\b/gi, correct: '3' },
    { pattern: /\bsquare\s+root\s+of\s+16\s+is\s+5\b/gi, correct: '4' },
    { pattern: /\bsquare\s+root\s+of\s+25\s+is\s+6\b/gi, correct: '5' },
    { pattern: /\bsquare\s+root\s+of\s+36\s+is\s+7\b/gi, correct: '6' },
    { pattern: /\bsquare\s+root\s+of\s+49\s+is\s+8\b/gi, correct: '7' },
    { pattern: /\bsquare\s+root\s+of\s+64\s+is\s+9\b/gi, correct: '8' },
    { pattern: /\bsquare\s+root\s+of\s+100\s+is\s+11\b/gi, correct: '10' },
  ];

  sqrtPatterns.forEach(({ pattern, correct }) => {
    const m = pattern.exec(text);
    if (m) {
      mistakes.math.push({
        type: 'math',
        match: m[0],
        message: `❌ Square root error. Correct answer: ${correct}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });

  // Percentage errors
  if (/\b(100%\s+(of|increase|decrease)\s+\d+|(\d+)%\s+of\s+0)/gi.test(text)) {
    const match = text.match(/\b100%\s+increase\s+of\s+(\d+)\s+is\s+(\d+)\b/gi);
    if (match) {
      const m = text.match(/100%\s+increase\s+of\s+(\d+)\s+is\s+(\d+)/i);
      mistakes.math.push({
        type: 'math',
        match: m[0],
        message: '❌ 100% increase means doubling. Check your calculation.',
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  }

  // BODMAS/PEMDAS violations
  if (/\b2\s*\+\s*3\s*\*\s*4\s*=\s*20\b/gi.test(text)) {
    mistakes.math.push({
      type: 'math',
      match: '2 + 3 * 4 = 20',
      message: '❌ BODMAS/PEMDAS: Multiply first (3*4=12), then add (2+12=14), not 20',
      startIndex: text.indexOf('2 + 3 * 4 = 20'),
      endIndex: text.indexOf('2 + 3 * 4 = 20') + 14
    });
  }

  // Pi value error
  if (/\bpi\s*=\s*3\.1[0-4]|22\/7|3\.14159[0-8]\b/gi.test(text)) {
    const match = text.match(/\bpi\s*=\s*(\d+\.?\d*)/i);
    if (match) {
      const value = parseFloat(match[1]);
      if (Math.abs(value - 3.14159) > 0.01) {
        mistakes.math.push({
          type: 'math',
          match: match[0],
          message: '❌ Pi (π) ≈ 3.14159 or 22/7 is acceptable approximation',
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }
  }

  // Negative number rules
  const negPatterns = [
    { pattern: /\b-\s*2\s*\*\s*-\s*3\s*=\s*-6\b/gi, correct: '6' },
    { pattern: /\b-\s*2\s*\+\s*-\s*2\s*=\s*0\b/gi, correct: '-4' },
  ];

  negPatterns.forEach(({ pattern, correct }) => {
    const m = pattern.exec(text);
    if (m) {
      mistakes.math.push({
        type: 'math',
        match: m[0],
        message: `❌ Negative number error. Correct answer: ${correct}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });

  // Prime number errors
  if (/\b1\s+is\s+a\s+prime\s+number\b/gi.test(text)) {
    const match = text.match(/\b1\s+is\s+a\s+prime\s+number\b/i);
    mistakes.math.push({
      type: 'math',
      match: match[0],
      message: '❌ 1 is NOT a prime number. Prime numbers are only divisible by 1 and themselves (2 is the smallest)',
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  // Even/odd errors
  if (/\b(1|3|5|7|9)\s+is\s+even\b/gi.test(text)) {
    const match = text.match(/\b(1|3|5|7|9)\s+is\s+even\b/i);
    mistakes.math.push({
      type: 'math',
      match: match[0],
      message: '❌ Odd numbers: 1, 3, 5, 7, 9. These are NOT even.',
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
};

// ==================== SCIENCE DETECTION ====================
const detectScienceErrors = (text, mistakes) => {
  const sciencePatterns = [
    { pattern: /\bsun\s+revolves\s+around\s+the\s+earth\b/gi, message: 'Science fact: Earth orbits the Sun (heliocentric system)' },
    { pattern: /\bgravity\s+pulls\s+upward\b/gi, message: 'Science fact: Gravity pulls downward toward Earth\'s center' },
    { pattern: /\bspeed\s+of\s+light\s+is\s+(\d+)\s+m\/s\b/gi, message: 'Science fact: Speed of light = 299,792,458 m/s ≈ 300,000 km/s' },
    { pattern: /\bspeed\s+of\s+sound\s+is\s+(\d+)\s+m\/s\b/gi, message: 'Science fact: Speed of sound ≈ 343 m/s in air at 20°C' },
    { pattern: /\batmosphere\s+is\s+(\d+)%\s+oxygen\b/gi, message: 'Science fact: Atmosphere is ~21% oxygen, ~78% nitrogen, ~1% other gases' },
    { pattern: /\bblood\s+is\s+blue\b/gi, message: 'Science fact: Blood is RED (hemoglobin), not blue. Blue appearance is a myth.' },
    { pattern: /\bhumans\s+use\s+only\s+10%\s+of\s+their\s+brain\b/gi, message: 'Science fact: Humans use virtually ALL parts of their brain' },
    { pattern: /\bwater\s+boils\s+at\s+(\d+)\s+degrees\b/gi, message: 'Science fact: Water boils at 100°C (212°F) at sea level' },
    { pattern: /\bwater\s+freezes\s+at\s+(\d+)\s+degrees\b/gi, message: 'Science fact: Water freezes at 0°C (32°F)' },
    { pattern: /\boxygen\s+is\s+combustible\b/gi, message: 'Science fact: Oxygen is NOT combustible; it SUPPORTS combustion' },
    { pattern: /\bgold\s+is\s+lighter\s+than\s+water\b/gi, message: 'Science fact: Gold is much denser/heavier than water' },
    { pattern: /\bnewton.*gravity.*inverse\s+distance\b/gi, message: 'Science fact: Newton\'s law: gravity is inversely proportional to distance SQUARED' },
    { pattern: /\bvenus\s+is\s+the\s+hottest\s+planet\s+because\s+it.*closest\s+to\s+sun\b/gi, message: 'Science fact: Venus is hottest due to greenhouse effect, not proximity' },
    { pattern: /\bmoon\s+is\s+made\s+of\s+cheese\b/gi, message: 'Science fact: Moon is made of rock and dust, not cheese' },
    { pattern: /\bscience\s+fact:\s+dinosaurs\s+and\s+humans\s+lived\s+together\b/gi, message: 'Science fact: Dinosaurs went extinct 66 million years ago; humans evolved recently' },
  ];

  sciencePatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    const m = regex.exec(text);
    if (m) {
      mistakes.science.push({
        type: 'science',
        match: m[0],
        message: `❌ ${message}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });
};

// ==================== HISTORY DETECTION ====================
const detectHistoryErrors = (text, mistakes) => {
  const historyPatterns = [
    { pattern: /\bworld\s+war\s+1\s+ended\s+in\s+(\d{4})\b/gi, correct: '1918', message: 'WWI ended in 1918' },
    { pattern: /\bworld\s+war\s+2\s+ended\s+in\s+(\d{4})\b/gi, correct: '1945', message: 'WWII ended in 1945' },
    { pattern: /\bChristopher\s+Columbus\s+discovered\s+America\s+in\s+(\d{4})\b/gi, correct: '1492', message: 'Columbus reached Americas in 1492' },
    { pattern: /\bAmerica\s+declared\s+independence\s+in\s+(\d{4})\b/gi, correct: '1776', message: 'American Independence: July 4, 1776' },
    { pattern: /\bFrance\s+revolution\s+in\s+(\d{4})\b/gi, correct: '1789', message: 'French Revolution began in 1789' },
    { pattern: /\bBerlin\s+Wall\s+fell\s+in\s+(\d{4})\b/gi, correct: '1989', message: 'Berlin Wall fell in 1989' },
    { pattern: /\bTitanic\s+sank\s+in\s+(\d{4})\b/gi, correct: '1912', message: 'Titanic sank on April 15, 1912' },
    { pattern: /\bApollo\s+11\s+moon\s+landing\s+in\s+(\d{4})\b/gi, correct: '1969', message: 'Apollo 11 moon landing: July 20, 1969' },
    { pattern: /\bIndia\s+independence\s+day\s+is\s+(\d+)\s+(\w+)/gi, correct: '15 August', message: 'India Independence Day: August 15, 1947' },
    { pattern: /\bGreat\s+Wall\s+of\s+China\s+built\s+in\s+(\d+)\s+(century|AD)/gi, message: 'Great Wall of China was built over many centuries (7th-17th century)' },
  ];

  historyPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    const m = regex.exec(text);
    if (m) {
      mistakes.history.push({
        type: 'history',
        match: m[0],
        message: `❌ Historical fact: ${message}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });

  // Capital cities
  const capitals = [
    { country: 'France', capital: 'Paris', wrong: 'Lyon|Marseille' },
    { country: 'Germany', capital: 'Berlin', wrong: 'Munich|Hamburg' },
    { country: 'USA', capital: 'Washington DC', wrong: 'New York|Los Angeles' },
    { country: 'India', capital: 'New Delhi', wrong: 'Mumbai|Bangalore' },
    { country: 'Japan', capital: 'Tokyo', wrong: 'Osaka|Kyoto' },
    { country: 'Australia', capital: 'Canberra', wrong: 'Sydney|Melbourne' },
    { country: 'Brazil', capital: 'Brasília', wrong: 'São Paulo|Rio de Janeiro' },
  ];

  capitals.forEach(({ country, capital }) => {
    const pattern = new RegExp(`\\bcapital\\s+of\\s+${country}\\s+is\\s+(?!${capital})\\w+`, 'gi');
    const m = pattern.exec(text);
    if (m) {
      mistakes.history.push({
        type: 'history',
        match: m[0],
        message: `❌ Capital of ${country} is ${capital}, not the place mentioned`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });
};

// ==================== LOGICAL ERRORS DETECTION ====================
const detectLogicalErrors = (text, mistakes) => {
  const logicalPatterns = [
    { pattern: /\bif\s+.{1,100}?\bless.{1,80}?\bwill\s+(be|feel|get)\s+more\b/gi, message: 'Logic: Doing less usually produces fewer results, not more' },
    { pattern: /\b(all|every|always).{1,60}?and.{1,60}?(none|nothing|never)\b/gi, message: 'Logic contradiction: "all" and "none" cannot both be true' },
    { pattern: /\b(nobody|no one).{1,60}?(everybody|everyone)\b/gi, message: 'Logic contradiction: "nobody" and "everybody" are opposites' },
    { pattern: /\bcan\'t\s+.{1,50}?not\b/gi, message: 'Double negative: "can\'t" and "not" are redundant' },
    { pattern: /\bthis\s+statement\s+is\s+false\b/gi, message: 'Logic paradox: Self-referential contradiction' },
    { pattern: /\bsave\s+time\s+by\s+.{1,50}?sleeping\s+less\b/gi, message: 'Logic error: Sleeping less reduces rest time, not saves it' },
    { pattern: /\bbecause\s+.{1,100}?therefore\s+.{1,100}?because/gi, message: 'Circular reasoning: Using conclusion to justify premise' },
  ];

  logicalPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    const m = regex.exec(text);
    if (m) {
      mistakes.logical.push({
        type: 'logical',
        match: m[0],
        message: `❌ ${message}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });
};

// ==================== GRAMMAR DETECTION ====================
const detectGrammarErrors = (text, mistakes) => {
  const grammarPatterns = [
    { pattern: /\byour\s+(going|coming|doing|being|running|walking)/gi, message: 'Use "you\'re" (you are) instead of "your"' },
    { pattern: /\byou\'re\s+(book|bag|car|house|job|turn|time|idea)/gi, message: 'Use "your" (possessive) instead of "you\'re"' },
    { pattern: /\btheir\s+(going|coming|doing|being|running|walking)/gi, message: 'Use "they\'re" (they are) instead of "their"' },
    { pattern: /\bthey\'re\s+(book|bag|house|car|turn|idea|dog)\b/gi, message: 'Use "their" (possessive) instead of "they\'re"' },
    { pattern: /\btheir\s+(there|they)/gi, message: 'Use "there" (location) or "they" (pronoun), not "their"' },
    { pattern: /\bits\s+(going|coming|time|not|ok|ready|good|bad|clear)/gi, message: 'Use "it\'s" (it is) instead of "its"' },
    { pattern: /\bit\'s\s+(color|name|size|shape|texture|taste|smell)\b/gi, message: 'Use "its" (possessive) instead of "it\'s"' },
    { pattern: /(would|could|should)\s+of\b/gi, message: 'Use "would/could/should have", not "of"' },
    { pattern: /\baffect\s+(the|our|my)\s+(mood|feeling|emotion|outcome|result)/gi, message: 'Use "effect" (noun) not "affect" (verb) in this context' },
    { pattern: /\beffect\s+(the|our|they|us)/gi, message: 'Use "affect" (verb) not "effect" to show influence' },
    { pattern: /\bthen\s+(the\s+other|one|two|question)\b/gi, message: 'Use "than" (comparison) not "then" (time)' },
    { pattern: /\bthan\s+(after|before|when|while|later)\b/gi, message: 'Use "then" (sequence) not "than" (comparison)' },
    { pattern: /\bto\s+go\b/gi, message: 'Check: "to" (direction/infinitive) or "too" (also/excessive)?' },
    { pattern: /\bi\s+(am|was|were|be|being|is|are)\b/gi, message: 'Capitalize "I" - always use capital I' },
    { pattern: /\.{2}[a-z]/g, message: 'Use three dots (...) for ellipsis, not two' },
    { pattern: /\s{2,}/g, message: 'Remove extra spaces between words' },
  ];

  grammarPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    const m = regex.exec(text);
    if (m) {
      mistakes.grammar.push({
        type: 'grammar',
        match: m[0],
        message: `❌ Grammar: ${message}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });
};

// ==================== HEALTH MYTHS DETECTION ====================
const detectHealthMyths = (text, mistakes) => {
  const healthPatterns = [
    { pattern: /\bhumans\s+use\s+only\s+10%\s+(of\s+)?their\s+brain\b/gi, message: 'Brain myth: Humans use virtually ALL brain parts, not just 10%' },
    { pattern: /\bblood\s+is\s+blue\b/gi, message: 'Health fact: Blood is RED (hemoglobin), not blue' },
    { pattern: /\bswallow.*gum.*7\s+years\b/gi, message: 'Health myth: Swallowed gum passes through you, doesn\'t stay for 7 years' },
    { pattern: /\bsugar.*hyperactivity\b/gi, message: 'Health fact: Sugar doesn\'t directly cause hyperactivity (myth debunked)' },
    { pattern: /\bvitamin\s+C.*prevent\s+cold\b/gi, message: 'Health fact: Vitamin C may reduce cold duration but doesn\'t prevent it' },
    { pattern: /\bcracking\s+knuckles.*arthritis\b/gi, message: 'Health fact: Cracking knuckles does NOT cause arthritis' },
    { pattern: /\bread\s+in\s+dark.*ruin\s+vision\b/gi, message: 'Health fact: Reading in dim light causes eye strain, not permanent damage' },
    { pattern: /\bfat.*turns.*muscle\b/gi, message: 'Health fact: Fat and muscle are different tissues; one doesn\'t turn into the other' },
  ];

  healthPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    const m = regex.exec(text);
    if (m) {
      mistakes.health.push({
        type: 'health',
        match: m[0],
        message: `❌ ${message}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });
};

// ==================== TECHNOLOGY DETECTION ====================
const detectTechErrors = (text, mistakes) => {
  const techPatterns = [
    { pattern: /\bAlexander\s+Graham\s+Bell.*internet\b/gi, message: 'Tech fact: Bell invented telephone, not internet' },
    { pattern: /\binternet\s+invented\s+by\s+(?!Tim|Vint|Bob|Lawrence)/gi, message: 'Tech fact: Internet created by ARPANET team (Vint Cerf, Bob Kahn, Tim Berners-Lee for WWW)' },
    { pattern: /\bcomputer\s+invented\s+by\s+(?!Charles|Nikolaus|Ada)/gi, message: 'Tech fact: Computing evolved over time; Charles Babbage designed first analytical engine' },
    { pattern: /\bpython\s+is\s+a\s+snake\s+programming\s+language\b/gi, message: 'Tech fact: Python is named after Monty Python, just a snake-themed logo' },
    { pattern: /\b0\s+(and|or)\s+1\s+(and|or)\s+2.*binary\b/gi, message: 'Tech fact: Binary only uses 0 and 1, not 0, 1, 2' },
    { pattern: /\bJava\s+and\s+JavaScript\s+are\s+same\b/gi, message: 'Tech fact: Java and JavaScript are completely different languages' },
    { pattern: /\bHTML\s+is\s+a\s+programming\s+language\b/gi, message: 'Tech fact: HTML is a markup language, not a programming language' },
  ];

  techPatterns.forEach(({ pattern, message }) => {
    const regex = new RegExp(pattern.source, 'gi');
    const m = regex.exec(text);
    if (m) {
      mistakes.technology.push({
        type: 'technology',
        match: m[0],
        message: `❌ ${message}`,
        startIndex: m.index,
        endIndex: m.index + m[0].length
      });
    }
  });
};

// ==================== RISK SCORE CALCULATION ====================
const calculateRiskScore = (mistakes) => {
  let score = 0;
  score += mistakes.math.length * 35;      // Math = 35 pts
  score += mistakes.factual.length * 30;   // Factual = 30 pts
  score += mistakes.logical.length * 25;   // Logical = 25 pts
  score += mistakes.science.length * 25;   // Science = 25 pts
  score += mistakes.history.length * 20;   // History = 20 pts
  score += mistakes.grammar.length * 10;   // Grammar = 10 pts
  score += mistakes.health.length * 15;    // Health = 15 pts
  score += mistakes.technology.length * 20; // Tech = 20 pts
  
  return Math.min(100, score); // Cap at 100
};
