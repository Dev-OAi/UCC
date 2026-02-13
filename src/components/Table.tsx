import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { DataRow } from '../lib/dataService';
import { ExternalLink } from 'lucide-react';

interface TableProps {
  data: DataRow[];
  visibleColumns: string[];
  selectedRow: DataRow | null;
  onRowSelect: (row: DataRow) => void;
}

export const Table: React.FC<TableProps> = ({ data, visibleColumns, selectedRow, onRowSelect }) => {
  const columns = visibleColumns;

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
          className="text-blue-600 hover:underline flex items-center inline-flex"
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
      fixedHeaderContent={() => (
        <tr className="bg-gray-50 border-b border-gray-200">
          {columns.map(col => (
            <th
              key={col}
              className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
            >
              {col}
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
              className={`px-4 py-3 text-sm border-b border-gray-100 cursor-pointer transition-colors ${
                selectedRow === row
                  ? 'bg-blue-100/50 text-blue-700 font-semibold'
                  : (index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50') + ' text-gray-600 hover:bg-blue-50/30'
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
