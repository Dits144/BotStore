import { geminiProvider } from "./gemini";
import { mockStore } from "@/lib/mockStore";
import { AiRoutingResult, ConversationMode } from "@/types";

export class AIRouter {
  async processIncomingMessage(
    conversationId: string,
    messageContent: string,
    customerContext?: any
  ): Promise<{
    actionTaken: "AUTO_REPLIED" | "SUGGESTION_CREATED" | "HANDOVER_TRIGGERED" | "IGNORED_MANUAL";
    responseContent?: string;
    routingResult?: AiRoutingResult;
  }> {
    const conv = mockStore.getConversationById(conversationId);
    if (!conv) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 1. If mode is MANUAL -> Do NOT execute AI
    if (conv.mode === "MANUAL") {
      mockStore.addLog({
        event: "AI_MESSAGE_ROUTER_SKIPPED",
        actor: "AIRouter",
        conversationId,
        status: "INFO",
        metadata: { reason: "Conversation mode is MANUAL. AI is silenced." },
      });
      return { actionTaken: "IGNORED_MANUAL" };
    }

    const settings = mockStore.getSettings();
    const history = (conv.messages || []).map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    // 2. Execute AI Provider (Gemini / Fallback Engine)
    const result = await geminiProvider.processMessage(
      messageContent,
      history,
      settings,
      customerContext || conv.customer
    );

    // Check handover rules
    const shouldHandover =
      result.recommended_action === "HANDOVER" ||
      result.intent === "complaint" ||
      result.intent === "refund_request" ||
      result.confidence < settings.confidenceThreshold;

    if (shouldHandover) {
      const handoverReason = result.handover_reason || `Auto-Handover: Intent (${result.intent}), Confidence (${result.confidence})`;
      mockStore.updateConversationMode(conversationId, "MANUAL", handoverReason);
      
      const systemReply = result.suggested_reply || "Percakapan telah dialihkan ke Admin Manusia DitsStore.";
      mockStore.addMessage(conversationId, {
        sender: "AI",
        content: systemReply,
        status: "DELIVERED",
        intent: result.intent,
        sentiment: result.sentiment,
        confidence: result.confidence,
      });

      mockStore.addLog({
        event: "HUMAN_TAKEOVER_TRIGGERED",
        actor: "AIRouter",
        conversationId,
        customerName: conv.customer.name,
        status: "WARNING",
        metadata: { reason: handoverReason, intent: result.intent },
      });

      return {
        actionTaken: "HANDOVER_TRIGGERED",
        responseContent: systemReply,
        routingResult: result,
      };
    }

    // 3. If mode is ASSIST -> Create suggested reply but do NOT auto-send
    if (conv.mode === "ASSIST") {
      const suggestedText = result.suggested_reply || "Terima kasih atas pertanyaannya kak! Ada yang bisa dibantu?";
      
      // Update last message or store suggested reply state
      const lastMsg = conv.messages?.[conv.messages.length - 1];
      if (lastMsg) {
        lastMsg.suggestedReply = suggestedText;
      }

      mockStore.addLog({
        event: "AI_SUGGESTION_CREATED",
        actor: "AIRouter",
        conversationId,
        status: "SUCCESS",
        metadata: { suggestedReply: suggestedText, intent: result.intent },
      });

      return {
        actionTaken: "SUGGESTION_CREATED",
        responseContent: suggestedText,
        routingResult: result,
      };
    }

    // 4. If mode is AUTO -> Send AI Response
    const autoReplyText = result.suggested_reply || settings.greetingStyle;
    mockStore.addMessage(conversationId, {
      sender: "AI",
      content: autoReplyText,
      status: "DELIVERED",
      intent: result.intent,
      sentiment: result.sentiment,
      confidence: result.confidence,
      toolCalls: result.tool_calls,
    });

    mockStore.addLog({
      event: "AI_RESPONSE_GENERATED",
      actor: "AIRouter",
      conversationId,
      customerName: conv.customer.name,
      status: "SUCCESS",
      metadata: { intent: result.intent, toolsUsed: result.tool_calls?.map((t) => t.name) },
    });

    return {
      actionTaken: "AUTO_REPLIED",
      responseContent: autoReplyText,
      routingResult: result,
    };
  }
}

export const aiRouter = new AIRouter();
