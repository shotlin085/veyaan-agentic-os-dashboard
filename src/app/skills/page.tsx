"use client";

import React, { useState } from "react";
import { Wrench, Plus, CheckCircle2, FileText, Code2 } from "lucide-react";
import Editor from "@monaco-editor/react";

export default function SkillStudioPage() {
  const [skillMd, setSkillMd] = useState<string>(
    `---
name: Autonomous React Flow Builder
description: Generates clean, accessible React Flow DAG graph nodes and connection validation rules.
version: 1.0.0
tools:
  - veyaan_hermes_orchestrator.validate_graph
---

# SKILL: Autonomous React Flow Builder

## Overview
Use this skill whenever an agent needs to produce or modify visual workflow graph topologies.
`
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="h-14 px-5 bg-popover border border-border rounded-2xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted-foreground/20 border border-muted-foreground/40 flex items-center justify-center text-muted-foreground">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              SKILL STUDIO
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted-foreground/20 text-muted-foreground">
                SKILL.md MANIFEST
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground">Guided non-coder wizard & raw SKILL.md markdown editor with tool policies</p>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted-foreground text-white font-bold text-xs hover:bg-foreground">
          <Plus className="w-4 h-4" /> Create New Skill
        </button>
      </div>

      <div className="flex-1 bg-background border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="h-10 px-4 border-b border-border bg-muted/60 flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>Editing SKILL.md</span>
          <span>YAML Frontmatter Enabled</span>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            theme="vs-dark"
            value={skillMd}
            onChange={(val) => setSkillMd(val || "")}
            options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
          />
        </div>
      </div>
    </div>
  );
}
