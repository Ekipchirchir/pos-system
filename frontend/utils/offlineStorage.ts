import { SaleRequest } from '@/types';

const OFFLINE_QUEUE_KEY = 'pos_offline_sales_queue';

export interface QueuedSale extends SaleRequest {
    client_sale_id: string;
}

export const getOfflineQueue = (): QueuedSale[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveOfflineSale = (sale: SaleRequest): QueuedSale => {
    const queue = getOfflineQueue();
    const queuedSale: QueuedSale = {
        ...sale,
        client_sale_id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    queue.push(queuedSale);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return queuedSale;
};

export const clearOfflineQueue = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const removeItemsFromQueue = (syncedClientIds: string[]) => {
    const queue = getOfflineQueue();
    const remaining = queue.filter(item => !syncedClientIds.includes(item.client_sale_id));
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
};