/*eslint-disable*/
"use client"

import { syncOfflineSales } from "@/services/api";
import { getOfflineQueue, removeItemsFromQueue } from "@/utils/offlineStorage";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast"; 

export default function SyncManager() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOnline = async () => {
            toast.success("Back online. Syncing data...");
            const queue = getOfflineQueue();
            if (queue.length === 0) return;

            try {
                const response = await syncOfflineSales(queue);
                const successfulIds = response.results
                    .filter((r: any) => r.status == 'success' || r.status == 'already_synced')
                    .map((r: any) => r.client_sale_id);
                
                if (successfulIds.length > 0) {
                    removeItemsFromQueue(successfulIds);
                    queryClient.invalidateQueries({ queryKey: ['products']});
                }
            } catch (error) {
                console.error("Failed to sync offline sales:", error);
            }
        };

        const handleOffline = () => {
            toast.error("You are offline. Viewing local data.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [queryClient]);

    return null;
}