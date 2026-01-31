import { CSVItem } from '../types';
import { CSV_HEADERS } from '../constants';

export class CSVParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CSVParseError';
  }
}

export const parseCSV = (text: string): CSVItem[] => {
  const lines = text.trim().split('\n');

  if (lines.length < 2) {
    throw new CSVParseError('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  const skuIndex = headers.findIndex(h => CSV_HEADERS.sku.includes(h as any));
  const nameIndex = headers.findIndex(h => CSV_HEADERS.name.includes(h as any));
  const quantityIndex = headers.findIndex(h => CSV_HEADERS.quantity.includes(h as any));

  if (skuIndex === -1) {
    throw new CSVParseError('CSV must have a SKU column');
  }

  if (quantityIndex === -1) {
    throw new CSVParseError('CSV must have a Quantity column');
  }

  const items: CSVItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const sku = values[skuIndex];
    const name = nameIndex !== -1 ? values[nameIndex] : sku;
    const quantity = parseInt(values[quantityIndex]) || 0;

    if (sku) {
      items.push({ sku, name, quantity });
    }
  }

  return items;
};
