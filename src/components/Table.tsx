import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { DataRow } from '../lib/dataService';
import { ExternalLink } from 'lucide-react';

interface TableProps {
  data: DataRow[];
  visibleColumns: string[];
}

export const Table: React.FC<TableProps> = ({ data, visibleColumns }) => {
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
              className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap max-w-xs truncate hover:whitespace-normal hover:overflow-visible hover:bg-white relative z-0 hover:z-10"
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
