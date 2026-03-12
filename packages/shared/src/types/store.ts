export type StoreId = 'costco' | 'aldi'

export interface Store {
  id: StoreId
  name: string
  logoUrl: string
  color: string
}

export const STORES: Record<StoreId, Store> = {
  costco: {
    id: 'costco',
    name: 'Costco',
    logoUrl: '/logos/costco.svg',
    color: '#005DAA',
  },
  aldi: {
    id: 'aldi',
    name: 'Aldi',
    logoUrl: '/logos/aldi.svg',
    color: '#00529F',
  },
}

export const STORE_IDS: StoreId[] = ['costco', 'aldi']
