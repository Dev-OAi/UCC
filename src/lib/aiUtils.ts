import { BusinessLead } from '../types';
import { DataRow } from './dataService';
import { getInsightForCategory } from './industryKnowledge';
import { PRODUCT_DISCOVERY_MAPPING } from './discoveryData';

export const generateAiManifest = (data: DataRow | BusinessLead) => {
  const isLead = 'status' in data;
  const businessName = isLead ? (data as BusinessLead).businessName : (data['businessName'] || data['Entity Name'] || 'Unknown Business');
  const industry = isLead ? (data as BusinessLead).industry : (data['Category'] || data['Category '] || '');
  const insight = getInsightForCategory(industry || '');

  let manifest = `### 🤖 AI AGENT CONTEXT MANIFEST\n`;
  manifest += `**Role Request:** Act as my Strategic Advisor, Business Banker, and Copywriter.\n\n`;

  manifest += `#### 🏢 BUSINESS PROFILE\n`;
  manifest += `- **Name:** ${businessName}\n`;
  manifest += `- **Industry:** ${industry || 'Not Specified'}\n`;

  if (isLead) {
    const lead = data as BusinessLead;
    manifest += `- **Pipeline Status:** ${lead.status}\n`;
    manifest += `- **Entity Type:** ${lead.entityType || 'N/A'}\n`;
    manifest += `- **Established:** ${lead.establishedDate || 'N/A'}\n`;
  } else {
    manifest += `- **Sunbiz Status:** ${data['Sunbiz Status'] || 'N/A'}\n`;
    manifest += `- **UCC Status:** ${data['UCC Status'] || 'N/A'}\n`;
    manifest += `- **FEI/EIN:** ${data['FEI/EIN Number'] || 'N/A'}\n`;
  }

  manifest += `\n#### 📞 CONTACT INFO\n`;
  manifest += `- **Phone:** ${isLead ? (data as BusinessLead).phone : (data['Phone'] || 'N/A')}\n`;
  manifest += `- **Email:** ${isLead ? (data as BusinessLead).email : (data['Email'] || 'N/A')}\n`;
  manifest += `- **Website:** ${isLead ? (data as BusinessLead).website : (data['Website'] || 'N/A')}\n`;

  if (insight) {
    manifest += `\n#### 💡 INDUSTRY INTELLIGENCE\n`;
    manifest += `- **Overview:** ${insight.overview}\n`;
    manifest += `- **Key Facts:**\n`;
    insight.quickFacts.forEach(fact => {
      manifest += `  - ${fact}\n`;
    });
  }

  if (isLead) {
    const lead = data as BusinessLead;
    if (lead.notes) manifest += `\n#### 📝 BANKER NOTES\n${lead.notes}\n`;
    if (lead.activities && lead.activities.length > 0) {
      manifest += `\n#### 🕒 RECENT ACTIVITY\n`;
      lead.activities.slice(0, 3).forEach(act => {
        manifest += `- ${new Date(act.date).toLocaleDateString()} [${act.type}]: ${act.notes}\n`;
      });
    }
  }

  manifest += `\n#### 🎯 OBJECTIVE\n`;
  manifest += `Using the context above, please:\n`;
  manifest += `1. **Strategic Advisor:** Analyze the business and identify 3 potential financial risks or growth opportunities.\n`;
  manifest += `2. **Business Banker:** Recommend the most suitable banking products (e.g., Treasury Management, SBA Loans, Merchant Services) based on their industry.\n`;
  manifest += `3. **Copywriter:** Draft a highly personalized, 3-sentence introductory email that mentions a specific industry challenge and offers a 'Financial Health Checkup'.\n`;

  return manifest;
};

export type OutreachTone = 'professional' | 'friendly' | 'urgent';

export const refineOutreachTone = (email: string, tone: OutreachTone): string => {
  const lines = email.split('\n');
  const subject = lines[0];
  const body = lines.slice(1).join('\n');

  if (tone === 'friendly') {
    return `${subject.replace('Supporting', 'Excited for')}

Hi there! Hope your week is going great.

${body.replace('Dear [Contact Name],', '').replace('It was a pleasure', 'I really enjoyed').trim()}

Best,
[Your Name]`;
  }

  if (tone === 'urgent') {
    return `${subject.replace('Supporting', 'URGENT: Growth Opportunity for')}

Dear [Contact Name],

I'm following up quickly as we have a limited-time window for some of our expansion financing programs that would be perfect for ${subject.split('of ')[1] || 'your business'}.

${body.replace('Dear [Contact Name],', '').trim()}

Time is of the essence, let's connect today!

Best,
[Your Name]`;
  }

  return email; // Professional is the default
};

export const generateLeadIntelligence = (data: DataRow | BusinessLead, focus: 'growth' | 'efficiency' | 'security' = 'growth', learnedTrends?: any) => {
  const isLead = 'status' in data;
  const industry = isLead ? (data as BusinessLead).industry : (data['Category'] || data['Category '] || '');
  const insight = getInsightForCategory(industry || '');
  const businessName = isLead ? (data as BusinessLead).businessName : (data['businessName'] || data['Entity Name'] || 'Unknown Business');

  // Recursive Learning Logic: Check if this lead's industry is "Hot"
  const isHotIndustry = learnedTrends?.hot_industries?.some((h: any) => h.name === industry);
  const learnedInsight = isHotIndustry ? learnedTrends.hot_industries.find((h: any) => h.name === industry).insight : null;

  let strategy = '';
  let email = '';

  const industryContext = insight?.overview || `The ${industry || 'local business'} sector requires specialized financial tools to manage operations and support growth.`;

  if (focus === 'efficiency') {
    strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${industryContext}
${learnedInsight ? `\n**📈 RECURSIVE TREND DETECTED:** ${learnedInsight}` : ''}

**1. Strategic Focus:**
Focus on ${insight?.quickFacts?.[0] || 'operational scaling'} and cash flow optimization. As a boutique partner, [Bank Name] can help ${businessName} reduce manual financial tasks and protect overhead through automated treasury tools. ${insight?.quickFacts?.[1] ? `Key Insight: ${insight.quickFacts[1]}` : ''}

**2. Product Bundle:**
- **Primary:** Advantage Business Checking (for moderate volume & fraud mitigation)
- **Secondary:** Merchant Services via Fiserv (to accelerate payment collection)
- **Value-Add:** Visa® Business Credit Card with 1% Cash Back and 0% Intro APR.

**3. Discussion Starters:**
- "How are you currently managing the rise in ${industry || 'operational'} costs and manual billing?"
- "We've noticed many ${industry || 'local'} firms are prioritizing operational efficiency this quarter..."

`;

    email = `Subject: Strategic Financial Efficiency for ${businessName}

Dear [Contact Name],

As ${businessName} continues to grow in the ${industry || 'local'} market, I wanted to reach out regarding a few specific strategies we're using to help ${industry || 'similar'} firms protect their cash flow and improve operational efficiency.

Based on recent industry benchmarks, we've identified three key areas where we can likely streamline your daily banking and implement more robust fraud protection.

Would you be open to a brief 5-minute conversation next week?

Best,
[Your Name]`;
  } else if (focus === 'security') {
    strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${industryContext}
${learnedInsight ? `\n**📈 RECURSIVE TREND DETECTED:** ${learnedInsight}` : ''}

**1. Strategic Focus:**
Focus on fraud prevention and asset protection. In the current ${industry || 'business'} environment, protecting outgoing payments and sensitive data is a top priority. [Bank Name]'s sophisticated treasury suite offers real-time monitoring and advanced mitigation. ${insight?.quickFacts?.[0] ? `Context: ${insight.quickFacts[0]}` : ''}

**2. Product Bundle:**
- **Primary:** ACH Positive Pay & Debit Block
- **Secondary:** Positive Pay & Check Block (to prevent physical check fraud)
- **Value-Add:** Premier Business Checking (includes advanced fraud mitigation tools).

**3. Discussion Starters:**
- "Have you updated your ACH blocks or filters recently to account for new vendors?"
- "We've noticed many ${industry || 'local'} firms are prioritizing fraud prevention this quarter—how are you currently securing your outgoing payments?"

`;

    email = `Subject: Protecting the Assets of ${businessName}

Dear [Contact Name],

As ${businessName} continues to expand, security and fraud prevention become increasingly critical. I’m reaching out to share some proactive measures we’re seeing ${industry || 'industry'} leaders implement to protect their outgoing payments.

I’d like to share how our security-first banking structures can safeguard ${businessName} from the rising risks of electronic and check fraud.

Would you be open to a brief conversation next Tuesday regarding your current security protocols?

Best regards,
[Your Name]`;
  } else {
    // Default to 'growth' focus
    strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${industryContext}
${learnedInsight ? `\n**📈 RECURSIVE TREND DETECTED:** ${learnedInsight}` : ''}

**1. Strategic Focus:**
Focus on ${insight ? 'leveraging sector-specific growth' : 'expansion opportunities'} and long-term capital strategy. [Bank Name] acts as a full-service boutique partner to support ${businessName}'s expansion. ${insight?.quickFacts?.[2] ? `Note: ${insight.quickFacts[2]}` : ''} We want to educate the client on our growth-focused products and schedule a branch appointment to finalize a customized banking strategy that supports their next phase of growth.

**2. Product Bundle:**
- **Primary:** Revolving Line of Credit ($100k - $750k Secured for expansion)
- **Secondary:** Premier Business Checking (to grow deposits & streamline operations for teams)
- **Value-Add:** Treasury Solutions (Remote Deposit Capture) to support distributed workforce scaling.

**3. Discussion Starters:**
- "I've been reviewing how other firms in the ${industry || 'local'} sector are leveraging expansion financing for their development projects..."
- "What are your primary financial goals for ${businessName}? I'd love to walk through growth strategies and financing options that can support this next phase."

`;

    email = `Subject: Supporting the Growth of ${businessName}

Dear [Contact Name],

It was a pleasure reconnecting with you. [Bank Name] offers a wide range of business accounts and banking services designed to support small and medium-sized businesses. From what you shared, it sounds like your primary need is financing to support operations and upcoming projects. I want to ensure we recommend the best solutions for your goals.

After speaking with my business banking partners, they suggested that the next best step is to schedule a call so we can better understand your financial needs. In general, they may ask a few key questions around revenue, project plans, and long‑term business objectives to determine the right product fit.

Thank you again for the connecting—exciting to hear about your expansion into new construction, developments, and property flips. I’d be happy to walk through growth strategies and financing options that can support this next phase.

Topics We Can Review on Our Call:
• SBA Financing: Overview of SBA programs, qualification criteria, and timelines.
• Business Lines of Credit: Flexible options to support cash flow, materials, and project timelines.
• Term Loans & Business Funding: Solutions for equipment, property acquisition, or working capital for construction or renovation.
• Growth Planning: Banking tools and structures designed for expanding development-focused businesses.

Can you give me a few days and times you are available. I’ll coordinate a meeting with my business banker at your convenience.

Looking forward to connecting and supporting your continued growth.

Best regards,
[Your Name]`;
  }

  // 3. DYNAMIC DISCOVERY QUESTIONS (New Learned Feature)
  const discoveryQuestions: string[] = [];
  const recommendedProducts = isLead ? (data as BusinessLead).aiIntelligence?.products || [] : [];

  if (recommendedProducts.length > 0) {
     recommendedProducts.forEach((prodName: string) => {
        // Find best match in mapping
        const key = Object.keys(PRODUCT_DISCOVERY_MAPPING).find(k =>
           prodName.includes(k) || k.includes(prodName)
        );
        if (key) {
           discoveryQuestions.push(...PRODUCT_DISCOVERY_MAPPING[key]);
        }
     });
  }

  // Deduplicate and limit
  const uniqueQuestions = Array.from(new Set(discoveryQuestions)).slice(0, 6);

  return { strategy, email, discoveryQuestions: uniqueQuestions };
};
