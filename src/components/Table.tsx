import React, { useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { DataRow } from '../lib/dataService';
import { ExternalLink, ChevronDown, Filter } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';

interface TableProps {
  data: DataRow[];
  allData: DataRow[];
  visibleColumns: string[];
  selectedRow: DataRow | null;
  onRowSelect: (row: DataRow) => void;
  columnFilters: Record<string, string[]>;
  onFilterChange: (column: string, values: string[]) => void;
  sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
  onSortChange: (config: { key: string, direction: 'asc' | 'desc' } | null) => void;
}

export const Table: React.FC<TableProps> = ({
  data,
  allData,
  visibleColumns,
  selectedRow,
  onRowSelect,
  columnFilters,
  onFilterChange,
  sortConfig,
  onSortChange
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const columns = visibleColumns;

  const uniqueValuesForOpenColumn = useMemo(() => {
    if (!openDropdown) return [];

    const values = new Set<string>();
    const rowCount = allData.length;
    
    for (let i = 0; i < rowCount; i++) {
      const row = allData[i];
      const val = openDropdown === 'Location' ? row._location : openDropdown === 'Zip' ? row._zip : row[openDropdown];
      if (val !== undefined && val !== null && val !== '') {
        values.add(String(val));
      }
      if (values.size > 2000) break;
    }

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [allData, openDropdown]);

  const getDisplayValue = (row: DataRow, col: string) => {
    if (col === 'Location') return row._location;
    if (col === 'Zip') return row._zip;
    return row[col];
  };

  const renderCell = (value: any) => {
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('www.'))) {
      const url = value.startsWith('http') ? value : `http://${value}`;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center inline-flex"
        >
          {value}
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      );
    }
    return value;
  };

  return (
    <TableVirtuoso
      style={{ height: '100%' }}
      data={data}
      className="dark:bg-slate-900"
      fixedHeaderContent={() => (
        <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          {columns.map(col => (
            <th
              key={col}
              className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap relative"
            >
              <button
                onClick={() => setOpenDropdown(openDropdown === col ? null : col)}
                className={`flex items-center space-x-1 px-2 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors w-full text-left ${
                  (columnFilters[col]?.length > 0 || sortConfig?.key === col) 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                    : ''
                }`}
              >
                <span className="truncate">{col}</span>
                <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${openDropdown === col ? 'rotate-180' : ''}`} />
                {columnFilters[col]?.length > 0 && (
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full absolute top-2 right-2"></div>
                )}
              </button>

              <FilterDropdown
                column={col}
                allValues={openDropdown === col ? uniqueValuesForOpenColumn : []}
                selectedValues={columnFilters[col] || []}
                onSelect={(values) => onFilterChange(col, values)}
                onSort={(direction) => onSortChange({ key: col, direction })}
                currentSort={sortConfig?.key === col ? sortConfig.direction : null}
                onClear={() => onFilterChange(col, [])}
                isOpen={openDropdown === col}
                onClose={() => setOpenDropdown(null)}
              />
            </th>
          ))}
        </tr>
      )}
      itemContent={(index, row) => (
        <>
          {columns.map(col => (
            <td
              key={col}
              onClick={() => onRowSelect(row)}
              className={`px-4 py-3 text-sm border-b border-gray-100 dark:border-slate-800/50 cursor-pointer transition-colors ${
                selectedRow === row
                  ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                  : (index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30') + ' text-gray-600 dark:text-slate-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
              } whitespace-nowrap max-w-[250px] truncate`}
              title={String(getDisplayValue(row, col) || '')}
            >
              {renderCell(getDisplayValue(row, col))}
            </td>
          ))}
        </>
      )}
    />
  );
};