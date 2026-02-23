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

export const generateLeadIntelligence = (data: DataRow | BusinessLead) => {
  const isLead = 'status' in data;
  const industry = isLead ? (data as BusinessLead).industry : (data['Category'] || data['Category '] || '');
  const insight = getInsightForCategory(industry || '');
  const businessName = isLead ? (data as BusinessLead).businessName : (data['businessName'] || data['Entity Name'] || 'Unknown Business');

  const strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${insight?.overview || 'Standard small business operations.'}

**1. Strategic Focus:**
Focus on ${insight?.quickFacts?.[0] || 'operational efficiency'} and ${insight?.quickFacts?.[1] || 'financial security'}. Given the current market trends, they are likely looking for ways to optimize cash flow.

**2. Product Bundle:**
- **Primary:** Business Platinum Checking (for transaction volume)
- **Secondary:** ACH Positive Pay (for fraud protection)
- **Value-Add:** Business Credit Card with 1.5% Cash Back.

**3. Discussion Starters:**
- "How are you currently managing the rise in ${industry || 'operational'} costs?"
- "We've noticed many ${industry || 'local'} firms are prioritizing fraud prevention this quarter..."`;

  const email = `Subject: Strategic Financial Efficiency for ${businessName}

Dear [Contact Name],

As ${businessName} continues to grow in the ${industry || 'local'} market, I wanted to reach out regarding a few specific strategies we're using to help ${industry || 'similar'} firms protect their cash flow.

Based on recent industry benchmarks, we've identified three key areas where we can likely improve your operational efficiency.

Would you be open to a brief 5-minute conversation next Tuesday?

Best,
[Your Name]`;

  return { strategy, email };
};
