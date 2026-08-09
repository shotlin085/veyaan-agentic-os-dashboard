import { FileCode2 } from "lucide-react";
import { WorkspaceUnavailable } from "@/components/data/WorkspaceUnavailable";
export default function PromptStudioPage() { return <WorkspaceUnavailable title="Prompt Studio" description="Prompt versions and model policies will load from the authenticated workspace instead of local editor fixtures." icon={FileCode2} />; }
