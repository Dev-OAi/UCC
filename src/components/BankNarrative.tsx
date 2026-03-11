import React, { useState } from 'react';
import { Target, ChevronDown, ChevronRight, PlusCircle, BookOpen, ShieldCheck, CreditCard, Building2, Zap } from 'lucide-react';

interface NarrativeSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  products?: { name: string; id?: string }[];
}

interface BankNarrativeProps {
  onAddProduct?: (productName: string) => void;
}

export const BankNarrative: React.FC<BankNarrativeProps> = ({ onAddProduct }) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>('about');

  const sections: NarrativeSection[] = [
    {
      id: 'about',
      title: 'Who We Are',
      icon: <Building2 className="w-4 h-4" />,
      content: `We are a full-service boutique bank, delivering customized financial services to middle market firms. We are driven by your success. We bring deep market and industry expertise and roll up our sleeves to provide you with the solutions and connections you need to achieve your vision and goals. Whether you are looking for working capital facilities, refinancing existing debt, or seeking treasury or deposit services, we tailor the right financing solutions to meet your unique situation. Your [Bank Name] team is also committed to helping you navigate the challenges that come with wealth. We offer a broad range of private banking solutions and customized plans to U.S. and international clients.`,
    },
    {
      id: 'treasury',
      title: 'Treasury Solutions Overview',
      icon: <Zap className="w-4 h-4" />,
      content: `In today’s competitive environment, it’s essential to ensure smooth and effective cash flow for your business. That’s because effective cash management is a crucial part of maximizing your financial resources. At [Bank Name], we make it easier for you to manage your business’s cash flow more efficiently through a suite of industry-leading treasury solutions. Our team of treasury solutions sales experts are relentlessly committed to your success, and will partner with you to deliver the right solutions that fit your specific needs.`,
      products: [
        { name: 'ACH Origination' },
        { name: 'Wire Transfers' },
        { name: 'Remote Deposit Capture' },
        { name: 'Positive Pay' },
        { name: 'Merchant Services' }
      ]
    },
    {
        id: 'checking',
        title: 'Business Checking',
        icon: <BookOpen className="w-4 h-4" />,
        content: `From basic banking tools for small teams to complex cash management for larger enterprises, [Bank Name] offers tiered checking solutions designed to grow with your business.`,
        products: [
            { name: 'Basic Business Checking' },
            { name: 'Advantage Business Checking' },
            { name: 'Premier Business Checking' }
        ]
    },
    {
      id: 'lending',
      title: 'Lending Solutions',
      icon: <CreditCard className="w-4 h-4" />,
      content: `From building credit to managing growth, [Bank Name]’s lending solutions give you flexibility and control to fund what matters most, when you need it. Whether you need short-term working capital or long-term financing, we provide lending options tailored to your business goals.`,
      products: [
        { name: 'Business Line of Credit' },
        { name: 'Business Term Loan' },
        { name: 'Visa Business Credit Card' },
        { name: 'Visa Secured Business Credit Card' }
      ]
    },
    {
      id: 'fraud',
      title: 'Fraud Mitigation',
      icon: <ShieldCheck className="w-4 h-4" />,
      content: `Keep funds secure and mitigate risk with our advanced fraud detection tools. [Bank Name]’s online banking tools provide quick and easy access to solutions that protect against internal and external fraud.`,
      products: [
        { name: 'Reverse Positive Pay' },
        { name: 'ACH Positive Pay' },
        { name: 'ACH Debit Block' }
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center">
          <Target className="w-3.5 h-3.5 mr-2 text-blue-600" />
          Banker Talking Points & Narrative
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {sections.map((section) => (
          <div key={section.id} className="group">
            <button
              onClick={() => setOpenSectionId(openSectionId === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded-lg ${openSectionId === section.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {section.icon}
                </div>
                <span className={`text-xs font-bold ${openSectionId === section.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>
                  {section.title}
                </span>
              </div>
              {openSectionId === section.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {openSectionId === section.id && (
              <div className="p-4 pt-0 bg-gray-50/30 dark:bg-slate-900/50 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-[11px] leading-relaxed text-gray-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">
                  {section.content}
                </p>
                {section.products && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.products.map((prod, idx) => (
                      <button
                        key={idx}
                        onClick={() => onAddProduct?.(prod.name)}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750 rounded-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all text-left shadow-sm group/prod"
                      >
                        <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 truncate pr-2">{prod.name}</span>
                        <PlusCircle className="w-3.5 h-3.5 text-gray-300 group-hover/prod:text-blue-500 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
