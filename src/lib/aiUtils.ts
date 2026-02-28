import { BusinessLead } from '../types';
import { DataRow } from './dataService';
import { getInsightForCategory } from './industryKnowledge';

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

export const generateLeadIntelligence = (data: DataRow | BusinessLead, focus: 'growth' | 'efficiency' | 'security' = 'growth') => {
  const isLead = 'status' in data;
  const industry = isLead ? (data as BusinessLead).industry : (data['Category'] || data['Category '] || '');
  const insight = getInsightForCategory(industry || '');
  const businessName = isLead ? (data as BusinessLead).businessName : (data['businessName'] || data['Entity Name'] || 'Unknown Business');

  let strategy = '';
  let email = '';

  const industryContext = insight?.overview || `The ${industry || 'local business'} sector requires specialized financial tools to manage operations and support growth.`;

  if (focus === 'efficiency') {
    strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${industryContext}

**1. Strategic Focus:**
Focus on ${insight?.quickFacts?.[0] || 'operational scaling'} and ${insight?.quickFacts?.[1] || 'optimizing overhead'}. Given the current market trends, they are likely looking for ways to optimize cash flow and reduce manual financial tasks.

**2. Product Bundle:**
- **Primary:** SMB Bundle 3 (AT 552) - Premier Business
- **Secondary:** Fiserv Merchant Services (to accelerate payment collection)
- **Value-Add:** Business Credit Card with 1% Cash Back.

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

**1. Strategic Focus:**
Focus on fraud prevention and asset protection. In the current ${industry || 'business'} environment, protecting outgoing payments and sensitive data is a top priority for growing firms.

**2. Product Bundle:**
- **Primary:** ACH Positive Pay (for electronic payment protection)
- **Secondary:** Check Positive Pay (to prevent physical check fraud)
- **Value-Add:** SMB Bundle 3 (AT 552) - Premier Business with enhanced security features.

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

**1. Strategic Focus:**
Focus on ${insight?.quickFacts?.[2] || 'expansion opportunities'} and long-term capital strategy. As ${businessName} expands, they will need flexible financing and scalable treasury solutions to support new projects.

**2. Product Bundle:**
- **Primary:** SBA 7(a) Financing or Secured Business Lines of Credit
- **Secondary:** SMB Bundle 3 (AT 552) - Premier Business
- **Value-Add:** ADP Payroll Services (to support a growing workforce).

**3. Discussion Starters:**
- "I've been reviewing how other firms in the ${industry || 'local'} sector are leveraging SBA programs for their expansion projects..."
- "What are your primary financial goals for ${businessName} as you move into this next phase of growth?"

`;

    email = `Subject: Supporting the Growth of ${businessName}

Dear [Contact Name],

It was a pleasure reconnecting with you. [Bank Name] offers a wide range of business accounts and banking services specifically designed to support the expansion of small and medium-sized businesses like ${businessName}.

Based on my review of the ${industry || 'local'} market, I’ve identified several growth strategies—ranging from SBA financing options to optimized scaling structures—that could support your upcoming expansion phase.

Would you be open to a brief call next week to discuss which solutions best align with your growth goals?

Best regards,
[Your Name]`;
  }

  return { strategy, email };
};
