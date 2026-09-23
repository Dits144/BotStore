import { AiRoutingResult, AiSettings } from "@/types";

export interface AIProvider {
  name: string;
  processMessage(
    userMessage: string,
    history: Array<{ sender: string; content: string }>,
    settings: AiSettings,
    customerContext?: any
  ): Promise<AiRoutingResult>;
}
