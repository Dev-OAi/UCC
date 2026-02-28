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

export type OutreachMode = 'intro' | 'discovery' | 'followup';

export const getProductBenefitSnippet = (productName: string): string => {
  const name = productName.toLowerCase();
  if (name.includes('sba')) return "Our SBA programs offer extended terms and lower down payments to preserve your working capital for materials and acquisition.";
  if (name.includes('line of credit')) return "A Secured Line of Credit provides the flexibility to bridge the gap between project milestones and vendor payments.";
  if (name.includes('bundle 3') || name.includes('premier')) return "The Premier Business bundle automates your cash management, helping you maintain higher reserves and reduce manual reconciliation overhead.";
  if (name.includes('positive pay')) return "ACH and Check Positive Pay provide a critical layer of defense, ensuring that only authorized payments leave your expansion accounts.";
  if (name.includes('adp')) return "Integrated payroll through ADP streamlines workforce scaling, ensuring your team is paid on time regardless of project location.";
  if (name.includes('merchant')) return "Accelerated payment collection through Fiserv can improve your cash-to-cash cycle by up to 3 days.";
  return "Our specialized banking tools are designed to support the operational scaling of high-growth firms in your sector.";
};

export const generateLeadIntelligence = (
  data: DataRow | BusinessLead,
  focus: 'growth' | 'efficiency' | 'security' = 'growth',
  mode: OutreachMode = 'intro'
) => {
  const isLead = 'status' in data;
  const industry = isLead ? (data as BusinessLead).industry : (data['Category'] || data['Category '] || '');
  const insight = getInsightForCategory(industry || '');
  const businessName = isLead ? (data as BusinessLead).businessName : (data['businessName'] || data['Entity Name'] || 'Unknown Business');
  const lastActivity = isLead ? (data as BusinessLead).activities?.[0] : null;

  let intro = 'It was a pleasure reconnecting with you.';
  if (lastActivity) {
    if (lastActivity.type === 'Call') intro = 'Thank you for taking the time to speak with me earlier today.';
    if (lastActivity.type === 'Appointment') intro = 'It was great meeting with you and learning more about your operations.';
    if (lastActivity.type === 'Email') intro = 'Following up on my previous message regarding your growth plans.';
  }

  let strategy = '';
  let email = '';

  const industryContext = insight?.overview || `The ${industry || 'local business'} sector requires specialized financial tools to manage operations and support growth.`;

  const benchmarkSnippet = insight?.authorityBenchmarks?.[0]
    ? `Actually, ${insight.authorityBenchmarks[0].insight}`
    : `Given the current market trends for ${industry || 'local businesses'}, optimizing daily operations is critical for scaling.`;

  if (focus === 'efficiency') {
    strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${industryContext}

**1. Strategic Focus:**
Focus on ${insight?.quickFacts?.[0] || 'operational scaling'} and cash flow optimization. The goal is to help ${businessName} reduce manual financial tasks and protect their overhead while educating them on efficiency benchmarks.

**2. Product Bundle:**
- **Primary:** SMB Bundle 3 (AT 552) - Premier Business (to automate cash management)
- **Secondary:** Fiserv Merchant Services (to accelerate payment collection)
- **Value-Add:** Business Credit Card with 1% Cash Back.

**3. Discussion Starters:**
- "How are you currently managing the rise in ${industry || 'operational'} costs? ${benchmarkSnippet}"
- "We've noticed many ${industry || 'local'} firms are prioritizing operational efficiency—would a brief discovery call to benchmark your current treasury setup be of value?"

`;

    if (mode === 'discovery') {
      email = `Subject: Discovery: Operational Benchmarks for ${businessName}

Dear [Contact Name],

${intro}

I've been reviewing efficiency benchmarks for the ${industry || 'local'} sector, and I'd like to share some insights on how ${businessName} can likely streamline daily operations and reduce overhead.

Specifically, I'd like to ask:
1. How has your cash-to-cash cycle changed with your recent expansion?
2. Are your current payment collection tools keeping pace with your project volume?
3. What is your primary objective for optimizing your financial workflows this quarter?

Would you be open to a brief discovery call to walk through these benchmarks?

Best,
[Your Name]`;
    } else if (mode === 'followup') {
      email = `Subject: Following Up: Streamlining ${businessName}

Dear [Contact Name],

${intro}

I wanted to follow up on my previous message regarding the operational efficiency of ${businessName}. As you scale in the ${industry || 'local'} market, the ability to automate cash management becomes a significant competitive advantage.

${benchmarkSnippet}

Can we schedule 5 minutes next week to see if our Premier Business tools are the right fit for your current phase?

Best,
[Your Name]`;
    } else {
      email = `Subject: Strategic Financial Efficiency for ${businessName}

Dear [Contact Name],

${intro}

As ${businessName} continues to grow, I wanted to reach out regarding a few specific strategies we're using to help firms in the ${industry || 'local'} market protect their cash flow and improve operational efficiency.

${benchmarkSnippet}

Would you be open to a brief conversation next week to explore how our Premier Business structures can support your goals?

Best,
[Your Name]`;
    }
  } else if (focus === 'security') {
    strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${industryContext}

**1. Strategic Focus:**
Focus on fraud prevention and asset protection. The goal is to help ${businessName} implement a 'security-first' banking structure to safeguard their expansion capital from rising electronic and check fraud.

**2. Product Bundle:**
- **Primary:** ACH Positive Pay (for electronic payment protection)
- **Secondary:** Check Positive Pay (to prevent physical check fraud)
- **Value-Add:** SMB Bundle 3 (AT 552) - Premier Business with enhanced security features.

**3. Discussion Starters:**
- "Have you updated your ACH blocks or filters recently to account for new vendors? ${benchmarkSnippet}"
- "With your recent growth, are you prioritizing fraud prevention? We've seen many ${industry || 'local'} firms implement Positive Pay to secure their outgoing project payments."

`;

    if (mode === 'discovery') {
      email = `Subject: Security Discovery for ${businessName}

Dear [Contact Name],

${intro}

I've been reviewing asset protection benchmarks for the ${industry || 'local'} sector. As ${businessName} continues to scale, ensuring that your outgoing payments are secured against fraud is a top priority.

I'd like to ask a few discovery questions:
1. What protocols do you currently have in place to verify ACH and wire requests?
2. Have you experienced any recent attempts at check or electronic fraud as you've expanded?
3. How are you managing vendor payment authorizations across your different project sites?

Would you be open to a brief discovery call to benchmark your current security protocols?

Best regards,
[Your Name]`;
    } else if (mode === 'followup') {
      email = `Subject: Following Up: Securing ${businessName}'s Capital

Dear [Contact Name],

${intro}

I wanted to follow up on our previous discussion regarding fraud prevention for ${businessName}. In the current ${industry || 'business'} environment, the cost of a single fraudulent event can significantly impact project timelines.

${benchmarkSnippet}

Can we schedule a 5-minute call next week to walk through how our ACH Positive Pay tools can provide an immediate layer of defense?

Best regards,
[Your Name]`;
    } else {
      email = `Subject: Protecting the Assets of ${businessName}

Dear [Contact Name],

${intro}

As ${businessName} continues to expand, security and fraud prevention become increasingly critical. I’m reaching out to share some proactive measures we’re seeing ${industry || 'industry'} leaders implement to protect their outgoing payments.

${benchmarkSnippet}

Would you be open to a brief conversation next Tuesday regarding your current security protocols and how we can safeguard your capital?

Best regards,
[Your Name]`;
    }
  } else {
    // Default to 'growth' focus
    strategy = `### 🎯 AI-Generated Strategy for ${businessName}

**Industry Context:** ${industryContext}

**1. Strategic Focus:**
Focus on ${insight ? 'leveraging sector-specific growth' : 'expansion opportunities'} and long-term capital strategy. The goal is to support ${businessName}'s expansion while securing the relationship with a full-service banking suite. We want to educate the client on our growth-focused products and schedule a branch appointment.

**2. Product Bundle:**
- **Primary:** SBA 7(a) Financing / Secured Lines of Credit (for materials & acquisition)
- **Secondary:** SMB Bundle 3 (AT 552) - Premier Business (to grow deposits & streamline ops)
- **Value-Add:** Treasury Solutions (ACH Positive Pay) and ADP Payroll to support workforce scaling.

**3. Discussion Starters:**
- "I've been reviewing how other firms in the ${industry || 'local'} sector are leveraging SBA programs for their expansion projects. ${benchmarkSnippet}"
- "What are your primary financial goals for ${businessName}? I'd love to walk through financing options that can support this next phase."

`;

    if (mode === 'discovery') {
      email = `Subject: Discovery: Expansion Financing for ${businessName}

Dear [Contact Name],

${intro}

As ${businessName} moves into this next phase of expansion, I’d like to ensure we’ve benchmarked your current financing structure against high-growth firms in the ${industry || 'local'} sector.

I have a few discovery questions:
1. What are your projected capital requirements for new projects over the next 12 months?
2. Are you currently utilizing SBA programs to preserve your working capital?
3. How are you structuring your deposits to support project-based scaling?

Can we coordinate a meeting at the branch next week to walk through a customized growth strategy?

Best regards,
[Your Name]`;
    } else if (mode === 'followup') {
      email = `Subject: Following Up: Supporting ${businessName}'s Growth

Dear [Contact Name],

${intro}

I wanted to follow up on our previous conversation regarding growth strategies for ${businessName}. As you expand into new projects, having the right capital structure and treasury tools in place is critical.

${benchmarkSnippet}

Can you give me a few days and times you are available? I’ll coordinate a meeting with my business banker at your convenience.

Looking forward to connecting,
[Your Name]`;
    } else {
      email = `Subject: Supporting the Growth of ${businessName}

Dear [Contact Name],

${intro} [Bank Name] offers a wide range of business accounts and banking services designed to support the expansion of small and medium-sized businesses like ${businessName}.

From what you shared, it sounds like your primary need is financing to support operations and upcoming projects. I want to ensure we recommend the best solutions for your goals.

After speaking with my business banking partners, they suggested that the next best step is to schedule a call or branch appointment so we can better understand your financial needs.

Thank you again for the connecting—exciting to hear about your expansion into new developments. I’d be happy to walk through growth strategies and financing options that can support this next phase.

Topics We Can Review on Our Call:
• SBA Financing: Overview of SBA programs, qualification criteria, and timelines.
• Business Lines of Credit: Flexible options to support cash flow, materials, and project timelines.
• Term Loans & Business Funding: Solutions for equipment, property acquisition, or working capital.
• Growth Planning: Banking tools and structures designed for expanding businesses.

Can you give me a few days and times you are available? I’ll coordinate a meeting with my business banker at your convenience.

Best regards,
[Your Name]`;
    }
  }

  return { strategy, email };
};
