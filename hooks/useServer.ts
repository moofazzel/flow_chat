"use client";

import {
  Channel,
  getServerChannels,
  getUserServers,
  Server,
} from "@/lib/serverService";
import { useEffect, useState } from "react";

export function useServers(userId: string | null) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setServers([]);
      setLoading(false);
      return;
    }

    getUserServers(userId).then((data) => {
      setServers(data);
      setLoading(false);
    });
  }, [userId]);

  return { servers, loading, setServers };
}

export function useServerChannels(serverId: string | null) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      setLoading(false);
      return;
    }

    getServerChannels(serverId).then((data) => {
      setChannels(data);
      setLoading(false);
    });
  }, [serverId]);

  return { channels, loading, setChannels };
}
