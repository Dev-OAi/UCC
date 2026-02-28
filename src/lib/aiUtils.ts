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
Focus on ${insight?.quickFacts?.[2] || 'expansion opportunities'} and long-term capital strategy. The goal is to support ${businessName}'s expansion (specifically into developments or new projects) while securing the relationship with a full-service banking suite. We want to educate the client on our growth-focused products and schedule a branch appointment to finalize a customized banking strategy that supports their next phase of growth.

**2. Product Bundle:**
- **Primary:** SBA 7(a) Financing / Secured Lines of Credit (for materials & acquisition)
- **Secondary:** SMB Bundle 3 (AT 552) - Premier Business (to grow deposits & streamline ops)
- **Value-Add:** Treasury Solutions (ACH Positive Pay) and ADP Payroll to support workforce scaling.

**3. Discussion Starters:**
- "I've been reviewing how other firms in the ${industry || 'local'} sector are leveraging SBA programs for their expansion into developments and property flips..."
- "What are your primary financial goals for ${businessName}? I'd love to walk through growth strategies and financing options that can support this next phase."

`;

    email = `Subject: Supporting the Growth of ${businessName}

Dear [Contact Name],

It was a pleasure reconnecting with you. [Bank Name] offers a wide range of business accounts and banking services designed to support small and medium-sized businesses. From what you shared, it sounds like your primary need is financing to support operations and upcoming projects. I want to ensure we recommend the best solutions for your goals.

After speaking with my business banking partners, they suggested that the next best step is to schedule a call so we can better understand your financial needs. In general, they may ask a few key questions around revenue, project plans, and long‑term business objectives to determine the right product fit.

Thank you again for the connecting—exciting to hear about your expansion into new construction, developments, and property flips. I’d be happy to walk through growth strategies and financing options that can support this next phase.

Would you be open to a brief call next week?

Best regards,
[Your Name]`;
  }

  return { strategy, email };
};
