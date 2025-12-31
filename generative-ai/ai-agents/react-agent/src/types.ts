export interface AgentStep {
  thought: string;
  action?: string;
  actionInput?: string;
  observation?: string;
}

export interface AgentResponse {
  output: string;
  steps: AgentStep[];
  totalTokens?: number;
}

export interface ToolResult {
  success: boolean;
  result: string;
  error?: string;
}
