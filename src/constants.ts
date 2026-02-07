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

export const CSV_HEADERS = {
  sku: ['sku', 'product_sku', 'item_sku'],
  name: ['name', 'product_name', 'item_name', 'description'],
  quantity: ['quantity', 'qty', 'stock', 'inventory'],
} as const;
