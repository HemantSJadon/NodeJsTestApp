export const SYSTEM_PROMPT = `You are an expert veteran in the areas of governance, polity, economics, policy making, history, geography, environment, science and technology, social sciences, ethics, anthropology, art and culture, organisations, international trade, international politics, justice, constitutions, rules and regulations, famous figures in all areas, disaster control, law making, bureaucracy, literature of all kinds, all kinds of famous awards at all scales (domestic and international), medical sciences, healthcare, industry, defence, wars, conflicts, geopolitics, and international affairs.

You use the most accurate, trustworthy, factual knowledge with deep domain expertise, data-driven analysis, and expert insights to discuss any topic — old or new — that is relevant and important for aspirants of officer-level positions in UPSC, SSB, and defence careers.

You have vast experience in academic, official, and promotional discussions — delivering lectures, giving commands, planning, consulting, and addressing all kinds of stakeholders across all domains.

Your specific task is to prepare a candidate for the Lecturette and Group Discussion rounds as part of the SSB (Services Selection Board) and CDS (Combined Defence Services) recruitment process. The candidate is a complete beginner with less than 1 month to the exam. Your preparation must be self-contained, factually accurate, and match or exceed the quality of preparation from expert coaching with deep research.

Every response must be:
- Factually accurate with precise references (statistics, years, institutions, laws)
- Structured clearly with headings, tables, bullet points as appropriate
- Written in a tone appropriate for an SSB/Defence officer
- Comprehensive enough to give the student everything they need
- Engaging, not dry or boring`;

export function getPhase1Prompt(topicName: string): string {
  return `Generate a complete INTEL BRIEF for SSB Lecturette preparation on the topic: "${topicName}"

The Intel Brief must cover ALL of the following sections in detail. Use markdown formatting with tables, bold headings, and bullet points exactly as shown in this structure:

## 🔷 WHAT IS ${topicName.toUpperCase()}?
[Clear definition, scope, and why it matters — 2-3 paragraphs]

## 🔷 TYPES / CLASSIFICATION
[If applicable — use a markdown table with Type | Key Facts columns]

## 🔷 CAUSES
[Primary causes with brief explanations — use bullet points or table]

## 🔷 CONSEQUENCES / IMPACT
[Structured under 4 sub-headings:]
### Environmental / Technical Impact
### Social & Human Impact
### Economic Impact
### Defence & National Security Angle ← This is CRITICAL for SSB

## 🔷 KEY DATA & STATISTICS
[Precise, recent figures — years, percentages, rankings, numbers. Use a clear list or table]

## 🔷 GOVERNMENT INITIATIVES (India)
[Use a markdown table: Initiative | Year | What It Does]
[Include all major schemes, acts, missions, policies]

## 🔷 GLOBAL FRAMEWORKS & BODIES
[Use a markdown table: Framework/Body | Year | Key Point]

## 🔷 SOLUTIONS & WAY FORWARD
[Structured, actionable solutions under clear subheadings]

## 🔷 POWERFUL QUOTES & FACTS FOR YOUR DELIVERY
[3-5 quotes + 3-5 striking facts/statistics the student should memorise and use in their lecturette]

Make this thorough and exam-ready. Every statistic should be accurate and sourced from credible reports (NITI Aayog, government documents, international bodies, peer-reviewed studies). Include India-specific angles throughout. The Defence/Security angle must be strong and original — connect the topic to national security, military operations, strategic interests, or soldier welfare.`;
}

export function getPhase2Prompt(topicName: string): string {
  return `Generate a MODEL LECTURETTE SCRIPT for SSB on the topic: "${topicName}"

Requirements:
- Length: 3 minutes when delivered at a measured pace (~350-380 words)
- Style: Confident, structured, factual — as an SSB/CDS aspirant would deliver to a panel
- Format: Plain paragraphs (no bullet points in the script itself)
- Structure: Clear opening → logical body paragraphs → strong conclusion with a call to action
- Must include: At least 3-4 specific facts/statistics, at least 1 government initiative, at least 1 defence/security angle, 1 memorable closing line
- Opening line: Must be an attention-grabbing hook (not just "The topic I have chosen today is...")

Format your output as:

## 📜 MODEL LECTURETTE SCRIPT — ${topicName.toUpperCase()}

---

[The full 3-minute script in flowing paragraphs]

---

## 💡 DELIVERY NOTES
[3-5 specific tips for delivering this particular script well — tone, emphasis, pause points, gestures]

The script should be polished, original, and memorable. A student reading and practising this script 3 times should be able to deliver a "Ready" (green grade) performance.`;
}

export function getPhase3Prompt(topicName: string): string {
  return `Generate exactly 10 CONCEPT FIRE questions and answers for SSB Lecturette on: "${topicName}"

These questions test the student's mastery of key facts, concepts, initiatives, frameworks, and the defence angle. Questions should range from factual recall to analytical understanding.

Return ONLY a valid JSON array in this exact format, with no additional text before or after:
[
  {
    "question": "Question text here?",
    "answer": "Complete answer here. Include the key fact, figure, or explanation needed."
  },
  ...
]

Requirements:
- Questions 1-3: Factual/definitional (What is X? Name 3 types of Y?)
- Questions 4-6: Data-driven (Which year? What percentage? How many?)
- Questions 7-8: Policy/Initiative-focused (Name the government programme for X? What does Y scheme do?)
- Questions 9-10: Analytical/Defence-linked (How does this create a security risk? What is India's position on X?)
- All answers must be specific, accurate, and concise (2-4 sentences max)
- Return exactly 10 questions — no more, no less`;
}

export function getGradingPrompt(
  topicName: string,
  delivery: string,
  intelBrief?: string
): string {
  const context = intelBrief
    ? `\n\nREFERENCE INTEL BRIEF FOR EVALUATION:\n${intelBrief.substring(0, 3000)}\n\n`
    : "";

  return `You are evaluating an SSB Lecturette delivery for the topic: "${topicName}"
${context}
STUDENT'S DELIVERY:
"""
${delivery}
"""

Grade this delivery using the SSB Lecturette evaluation framework. Return ONLY a valid JSON object in this exact format, with no additional text:
{
  "grade": "ready" | "borderline" | "retry",
  "score": <number 1-10>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "corrections": ["specific correction/addition 1", "specific correction/addition 2", "specific correction/addition 3"],
  "overallFeedback": "2-3 sentence overall assessment with specific actionable advice"
}

Grading criteria:
- "ready" (score 7-10): Strong structure, 3+ specific facts, defence angle included, confident tone, good opening and closing
- "borderline" (score 4-6): Basic structure present, 1-2 facts, missing some key angles, needs one more round
- "retry" (score 1-3): Missing structure, few/no facts, no defence angle, very short or generic delivery

Be honest but encouraging. Focus on what will specifically help the student pass an SSB board.`;
}

export function getWeakPointFixPrompt(
  topicName: string,
  delivery: string,
  gradingResult: {
    grade: string;
    score: number;
    weaknesses: string[];
    corrections: string[];
    overallFeedback: string;
  }
): string {
  return `A student just delivered a lecturette on "${topicName}" and received grade: ${gradingResult.grade.toUpperCase()} (score: ${gradingResult.score}/10).

THEIR DELIVERY:
"""
${delivery}
"""

WEAKNESSES IDENTIFIED:
${gradingResult.weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}

CORRECTIONS NEEDED:
${gradingResult.corrections.map((c, i) => `${i + 1}. ${c}`).join("\n")}

OVERALL FEEDBACK:
${gradingResult.overallFeedback}

---

Generate a TARGETED WEAK POINT FIX session. This should feel like a personal coaching session — direct, specific, practical.

Structure your response as:

## 🔧 WEAK POINT FIX — ${topicName.toUpperCase()}

### 📌 What You Got Wrong / What You Missed
[Address each weakness and correction with specific facts/content they should have included]

### ✅ Corrected / Missing Content
[Provide the exact facts, statistics, phrases, or frameworks they should learn and add to their delivery]

### 💬 Suggested Phrases to Add
[Give 3-5 specific sentences or phrases they can naturally incorporate into their next delivery]

### 🎯 Revised Opening / Closing
[If their opening or closing was weak, give them a stronger version]

### ⚡ 2-Minute Drill
[A focused mini-script or bullet-point framework they should practice before their next attempt]

Be specific, direct, and practical. Don't give generic advice — address exactly what this student's delivery was missing.`;
}
