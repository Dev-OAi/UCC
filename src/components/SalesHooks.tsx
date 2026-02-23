import React, { useMemo } from 'react';
import { Sparkles, Copy, Check, MessageSquare, Briefcase, Zap } from 'lucide-react';

interface SalesHooksProps {
  leadData: any;
}

export const SalesHooks: React.FC<SalesHooksProps> = ({ leadData }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const hooks = useMemo(() => {
    const list: string[] = [];
    const name = leadData.businessName || leadData['Entity Name'] || 'their business';

    // 1. UCC Expiration Hook
    const expires = leadData.Expires || leadData['Expires'];
    if (expires) {
      const expiryDate = new Date(expires);
      const today = new Date();
      const diffMonths = (expiryDate.getFullYear() - today.getFullYear()) * 12 + (expiryDate.getMonth() - today.getMonth());

      if (diffMonths <= 6 && diffMonths > 0) {
        list.push(`"I noticed your current UCC filing for ${name} is set to expire in about ${diffMonths} months. Have you already started looking into renewal or refinancing options to ensure no disruption in your credit lines?"`);
      } else if (diffMonths <= 0) {
         list.push(`"It looks like the UCC filing for ${name} recently lapsed. This is a critical time to re-establish your filing status to protect your business assets and maintain your lending relationships."`);
      }
    }

    // 2. Recent Filing Hook
    const recordDate = leadData['Record Date'] || leadData['Date Filed'];
    if (recordDate) {
      const date = new Date(recordDate);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 60) {
        list.push(`"Congratulations on the recent filing for ${name}! New filings often signal growth or a shift in strategy—I'd love to discuss how our specialized SMB tools can help you manage this new phase more efficiently."`);
      }
    }

    // 3. Entity Type Hook
    const entityType = leadData['Entity Type'] || leadData.entityType;
    if (entityType?.toLowerCase().includes('llc')) {
      list.push(`"As an LLC in the ${leadData.Category || 'growth'} sector, you might be eligible for specific tax-advantaged credit structures that most standard banks don't proactively offer. Are you currently maximizing your entity's leverage?"`);
    }

    // 4. General Growth Hook
    if (list.length < 3) {
      list.push(`"I've been tracking market activity in ${leadData._location || leadData.Location || 'your area'}, and ${name} stands out as a key player. We've helped similar businesses optimize their treasury management—would you be open to a 5-minute sync next Tuesday?"`);
    }

    return list.slice(0, 3);
  }, [leadData]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
          AI Sales Intelligence
        </h3>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded">High Probability</span>
      </div>

      <div className="space-y-3">
        {hooks.map((hook, index) => (
          <div
            key={index}
            className="group relative bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all hover:shadow-md"
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                {index === 0 ? <Zap className="w-3 h-3" /> : index === 1 ? <MessageSquare className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed italic pr-8">
                {hook}
              </p>
            </div>

            <button
              onClick={() => handleCopy(hook, index)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-slate-700 rounded-md"
              title="Copy Hook"
            >
              {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>

            <div className="mt-2 flex items-center space-x-2">
               <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded uppercase">
                 {index === 0 ? 'Urgent' : 'Contextual'}
               </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-gray-400 italic text-center">
        Hooks are dynamically generated based on current filing status and market data.
      </p>
    </div>
  );
};
