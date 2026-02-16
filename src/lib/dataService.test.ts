import { describe, it, expect, vi } from 'vitest';
import { loadCsv } from './dataService';
import Papa from 'papaparse';

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn((path, config) => {
      if (path === 'test.csv') {
        config.complete({
          data: [
            ['Name', 'Phone', 'Website'],
            ['John Doe', '555-1234', 'http://example.com']
          ]
        });
      }
    })
  }
}));

describe('dataService', () => {
  it('should load CSV and augment with metadata', async () => {
    const file = {
      path: 'test.csv',
      type: 'Generic',
      zip: '33101',
      location: 'Miami',
      filename: 'test.csv'
    };

    const result = await loadCsv(file);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      'Name': 'John Doe',
      'Phone': '555-1234',
      'Website': 'http://example.com',
      '_type': 'Generic',
      '_zip': '33101',
      '_location': 'Miami'
    });
  });

  it('should handle missing headers by providing defaults for YP', async () => {
    // Override mock for this test
    (Papa.parse as any).mockImplementationOnce((path, config) => {
      config.complete({
        data: [
          ['Plumbing', '123', 'Bob Smith', '555-123-4567', 'http://bob.com']
        ]
      });
    });

    const file = {
      path: 'test-no-header.csv',
      type: 'YP',
      zip: '33101',
      location: 'Miami',
      filename: 'test-no-header.csv'
    };

    const result = await loadCsv(file);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      'Category': 'Plumbing',
      'Business Name': 'Bob Smith',
      '_zip': '33101'
    });
  });
});
