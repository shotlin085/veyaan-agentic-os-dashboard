"use client";

import React from "react";
import { Settings, Shield, Key, Users, Lock, Server } from "lucide-react";
import { DEV_CURRENT_USER } from "@/lib/api";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="border-b border-border-subtle pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent-cyan" />
          ORGANIZATION & SECURITY SETTINGS
        </h1>
        <p className="text-xs text-text-muted mt-1">Internal workspace policies, RBAC roles, secret keys, API integrations, and session security controls.</p>
      </div>

      <div className="p-5 rounded-2xl bg-bg-surface-1 border border-border-subtle space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent-purple" />
          Internal Session Identity
        </h2>

        <div className="grid grid-cols-2 gap-4 font-mono text-xs p-3 rounded-xl bg-bg-surface-2 border border-border-subtle">
          <div>
            <div className="text-text-muted text-[10px]">Signed-in User</div>
            <div className="font-bold text-white">No authenticated user session</div>
          </div>
          <div>
            <div className="text-text-muted text-[10px]">Ecosystem Role</div>
            <div className="font-bold text-accent-cyan">Supabase sign-in required</div>
          </div>
        </div>
      </div>
    </div>
  );
}
