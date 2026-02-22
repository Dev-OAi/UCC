import React, { useState, useEffect, useRef } from 'react';
import { productData } from '../lib/productData';

interface ProductsProps {
  highlightedProductId?: string | null;
}

export const Products: React.FC<ProductsProps> = ({ highlightedProductId }) => {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync hovered state with highlighted prop for external control
  useEffect(() => {
    if (highlightedProductId) {
        // Use a small timeout to allow the DOM to update
        setTimeout(() => {
            const element = document.getElementById(`product-${highlightedProductId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
  }, [highlightedProductId]);

  const effectiveHighlightId = highlightedProductId || hoveredProductId;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
            <div className="max-w-6xl mx-auto space-y-12 pb-12">
                {productData.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-6">
                        <div className="text-center border-b-2 border-blue-600/20 pb-4">
                             <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-[0.2em]">{section.title}</h2>
                        </div>

                        {section.categories.map((category, cIdx) => (
                            <div key={cIdx} className="space-y-4">
                                {category.title && (
                                    <div className="flex items-center space-x-4">
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800"></div>
                                        <h3 className="text-sm font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest px-4 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-900/50">
                                            {category.title}
                                        </h3>
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800"></div>
                                    </div>
                                )}

                                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                                <th className="px-4 py-3 text-left border-b border-gray-200 dark:border-slate-800 w-1/4">Product Name</th>
                                                <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Points</th>
                                                <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Min Balance</th>
                                                <th className="px-4 py-3 text-left border-b border-gray-200 dark:border-slate-800 w-1/4">Tiers / Range</th>
                                                <th className="px-4 py-3 text-center border-b border-gray-200 dark:border-slate-800">Tier Points</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {category.subCategories.map((sub, subIdx) => (
                                                <React.Fragment key={subIdx}>
                                                    {sub.title && (
                                                        <tr className="bg-gray-50/80 dark:bg-slate-800/80">
                                                            <td colSpan={5} className="px-4 py-2.5 font-bold text-gray-800 dark:text-gray-200 uppercase text-[11px] tracking-[0.15em] text-center border-y border-gray-200 dark:border-slate-800">
                                                                {sub.title}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {sub.products.map((product, pIdx) => {
                                                        const hasTiers = product.tiers && product.tiers.length > 0;
                                                        const rowSpan = hasTiers ? product.tiers!.length : 1;
                                                        const productId = `${sIdx}-${cIdx}-${subIdx}-${pIdx}`;
                                                        const isEffectivelyHighlighted = highlightedProductId === productId || hoveredProductId === productId;

                                                        return (
                                                            <React.Fragment key={pIdx}>
                                                                <tr
                                                                    id={`product-${productId}`}
                                                                    onMouseEnter={() => setHoveredProductId(productId)}
                                                                    onMouseLeave={() => setHoveredProductId(null)}
                                                                    className={`${isEffectivelyHighlighted ? 'bg-blue-100/50 dark:bg-blue-900/30' : ''} transition-all duration-300`}
                                                                >
                                                                    <td rowSpan={rowSpan} className="px-4 py-4 font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-slate-800 align-middle">
                                                                        {product.name}
                                                                    </td>
                                                                    <td rowSpan={rowSpan} className="px-4 py-4 text-center text-gray-500 dark:text-slate-400 border-r border-gray-100 dark:border-slate-800 align-middle font-medium">
                                                                        {product.points ?? 'N/A'}
                                                                    </td>
                                                                    <td rowSpan={rowSpan} className="px-4 py-4 text-center text-gray-500 dark:text-slate-400 border-r border-gray-100 dark:border-slate-800 align-middle font-medium">
                                                                        {product.minBalance ?? '--'}
                                                                    </td>
                                                                    {hasTiers ? (
                                                                        <>
                                                                            <td className="px-4 py-4 text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                                                                                {product.tiers![0].tier}
                                                                            </td>
                                                                            <td className="px-4 py-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/5">
                                                                                {product.tiers![0].points}
                                                                            </td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <td className="px-4 py-4 border-r border-gray-100 dark:border-slate-800"></td>
                                                                            <td className="px-4 py-4"></td>
                                                                        </>
                                                                    )}
                                                                </tr>
                                                                {hasTiers && product.tiers!.slice(1).map((tier, tIdx) => (
                                                                    <tr
                                                                        key={tIdx}
                                                                        onMouseEnter={() => setHoveredProductId(productId)}
                                                                        onMouseLeave={() => setHoveredProductId(null)}
                                                                        className={`${isEffectivelyHighlighted ? 'bg-blue-100/50 dark:bg-blue-900/30' : ''} transition-all duration-300`}
                                                                    >
                                                                        <td className="px-4 py-4 text-gray-600 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800">
                                                                            {tier.tier}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/5">
                                                                            {tier.points}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

        </div>
    </div>
  );
};
