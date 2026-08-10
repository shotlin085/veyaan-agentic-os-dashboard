"use client";

import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

interface ActiveAgentValue {
  agentDefinitionId: string | null;
  displayName: string | null;
  loading: boolean;
}

const ActiveAgentContext = createContext<ActiveAgentValue>({
  agentDefinitionId: null,
  displayName: null,
  loading: false,
});

/**
 * Resolves a conversation's agent_definition_id (see Conversation.
 * agent_definition_id, app/conversations/models.py) to the agent's real
 * display_name, once per conversation - not per message. Consumed both by
 * the conversation-header banner (ConversationPage) and by ResponseMeta's
 * per-message "agent" stat (Thread.tsx), so the same fetch isn't repeated
 * once per message in a long conversation.
 */
export const ActiveAgentProvider: FC<{ agentDefinitionId: string | null; children: ReactNode }> = ({
  agentDefinitionId,
  children,
}) => {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!agentDefinitionId || !session?.access_token || !workspace?.id) {
      setDisplayName(null);
      return;
    }
    setLoading(true);
    void fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/agent-definitions/${encodeURIComponent(agentDefinitionId)}`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok || !active) return;
        const body = await response.json().catch(() => null);
        if (active) setDisplayName(body?.display_name ?? null);
      })
      .catch(() => {
        if (active) setDisplayName(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [agentDefinitionId, session?.access_token, workspace?.id]);

  return (
    <ActiveAgentContext.Provider value={{ agentDefinitionId: agentDefinitionId ?? null, displayName, loading }}>
      {children}
    </ActiveAgentContext.Provider>
  );
};

export function useActiveAgent(): ActiveAgentValue {
  return useContext(ActiveAgentContext);
}
