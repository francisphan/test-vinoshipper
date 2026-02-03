export const STORAGE_KEYS = {
  clients: 'clients',
} as const;

export const KEYRING_SERVICE = 'com.peyto.vinoshipper';

export const KEYRING_KEYS = {
  clients: 'clients',
  migrated: 'storage_migrated',
} as const;

export const FULFILLMENT_OPTIONS = [
  'Hydra (NY)',
  'ShipEz (CA)',
] as const;

export const SYNC_DELAY_MS = 600;

export const MOCK_INVENTORY = [
  { sku: 'WINE-001', name: 'Cabernet Sauvignon 2021', quantity: 45, lastSync: new Date() },
  { sku: 'WINE-002', name: 'Chardonnay 2022', quantity: 32, lastSync: new Date() },
  { sku: 'WINE-003', name: 'Pinot Noir 2021', quantity: 18, lastSync: new Date() },
  { sku: 'WINE-004', name: 'Rosé 2023', quantity: 8, lastSync: new Date() },
  { sku: 'WINE-005', name: 'Merlot 2020', quantity: 0, lastSync: new Date() },
];

export const CSV_HEADERS = {
  sku: ['sku', 'product_sku', 'item_sku'],
  name: ['name', 'product_name', 'item_name', 'description'],
  quantity: ['quantity', 'qty', 'stock', 'inventory'],
} as const;
