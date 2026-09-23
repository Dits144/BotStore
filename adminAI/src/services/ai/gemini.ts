import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "./provider";
import { buildSystemPrompt } from "./prompts";
import { toolsRegistry } from "./tools/registry";
import { AiRoutingResult, AiSettings } from "@/types";

export class GeminiProvider implements AIProvider {
  name = "Google Gemini";

  async processMessage(
    userMessage: string,
    history: Array<{ sender: string; content: string }>,
    settings: AiSettings,
    customerContext?: any
  ): Promise<AiRoutingResult> {
    const apiKey = process.env.GEMINI_API_KEY || settings.apiKey;

    // Check intent locally or via fallback if API key is missing
    const localIntent = this.detectLocalIntent(userMessage);

    if (!apiKey || apiKey.trim() === "") {
      // DEVELOPMENT MOCK / NO KEY MODE
      return this.handleFallbackMessage(userMessage, localIntent, settings, customerContext);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const modelName = settings.aiModel || "gemini-1.5-flash";

      // Prepare tools for Gemini
      const functionDeclarations = Object.values(toolsRegistry).map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));

      const model = genAI.getGenerativeAIModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(settings, customerContext),
        tools: [{ functionDeclarations }],
      });

      const formattedHistory = history.map((msg) => ({
        role: msg.sender === "CUSTOMER" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const functionCalls = response.functionCalls();

      const executedTools: Array<{ name: string; arguments: any }> = [];
      let finalResponseText = response.text() || "";

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const tool = toolsRegistry[call.name];
          if (tool) {
            const toolResult = await tool.execute(call.args);
            executedTools.push({ name: call.name, arguments: call.args });

            // If handover tool was called
            if (call.name === "handover_to_admin") {
              return {
                intent: "human_request",
                sentiment: "negative",
                confidence: 0.99,
                requires_tool: true,
                recommended_action: "HANDOVER",
                handover_reason: call.args.reason || "Pelanggan membutuhkan penanganan admin manusia.",
                suggested_reply: "Baik kak, percakapan ini kami alihkan ke Admin Manusia DitsStore ya. Mohon ditunggu sejenak 🙏",
              };
            }

            // Send tool result back to Gemini to complete response
            const secondResult = await chat.sendMessage([
              {
                functionResponse: {
                  name: call.name,
                  response: toolResult,
                },
              },
            ]);
            finalResponseText = secondResult.response.text();
          }
        }
      }

      return {
        intent: localIntent.intent,
        sentiment: localIntent.sentiment,
        confidence: 0.95,
        requires_tool: executedTools.length > 0,
        recommended_action: localIntent.intent === "complaint" || localIntent.intent === "refund_request" ? "HANDOVER" : "AI_REPLY",
        suggested_reply: finalResponseText,
        tool_calls: executedTools,
      };
    } catch (err: any) {
      console.error("[Gemini Provider Error]:", err);
      // Fallback on error
      return this.handleFallbackMessage(userMessage, localIntent, settings, customerContext);
    }
  }

  private detectLocalIntent(userMessage: string) {
    const text = userMessage.toLowerCase();
    if (text.includes("komplain") || text.includes("rusak") || text.includes("error") || text.includes("kecewa")) {
      return { intent: "complaint", sentiment: "negative" };
    }
    if (text.includes("refund") || text.includes("kembalikan uang") || text.includes("retur")) {
      return { intent: "refund_request", sentiment: "negative" };
    }
    if (text.includes("harga") || text.includes("berapa")) {
      return { intent: "price_inquiry", sentiment: "neutral" };
    }
    if (text.includes("ready") || text.includes("stok") || text.includes("ada")) {
      return { intent: "stock_inquiry", sentiment: "neutral" };
    }
    if (text.includes("bayar") || text.includes("qris") || text.includes("bca") || text.includes("rekening")) {
      return { intent: "payment_question", sentiment: "positive" };
    }
    if (text.includes("admin") || text.includes("manusia") || text.includes("orang")) {
      return { intent: "human_request", sentiment: "neutral" };
    }
    if (text.includes("halo") || text.includes("hai") || text.includes("min") || text.includes("p")) {
      return { intent: "greeting", sentiment: "positive" };
    }
    return { intent: "product_inquiry", sentiment: "neutral" };
  }

  private async handleFallbackMessage(
    userMessage: string,
    intentData: { intent: string; sentiment: string },
    settings: AiSettings,
    customerContext?: any
  ): Promise<AiRoutingResult> {
    // Execute tool manually based on intent
    let reply = "";
    let action: "AI_REPLY" | "AI_ASSIST" | "HANDOVER" = "AI_REPLY";
    const executedTools: any[] = [];

    if (intentData.intent === "stock_inquiry" || intentData.intent === "price_inquiry" || intentData.intent === "product_inquiry") {
      const toolRes = await toolsRegistry.search_products.execute({ query: userMessage });
      executedTools.push({ name: "search_products", arguments: { query: userMessage } });

      if (toolRes.count > 0) {
        const prod = toolRes.products[0];
        const stockStatus = prod.stock > 0 && prod.status === "AVAILABLE" ? `Ready (${prod.stock} stok)` : "Sedang Habis (Out of Stock)";
        reply = `Halo kak ${customerContext?.name || ""}! ${prod.name} harganya Rp ${prod.price.toLocaleString("id-ID")}.\nStatus: **${stockStatus}**.\n\nGaransi: ${prod.warrantyInfo || "Garansi resmi 30 hari"}.\n\nKakak berminat untuk order? 😊`;
      } else {
        reply = `Halo kak! Untuk produk yang ditanyakan saat ini belum tersedia di katalog DitsStore. Mau kami bantu carikan alternatifnya?`;
      }
    } else if (intentData.intent === "payment_question") {
      const pm = await toolsRegistry.get_payment_methods.execute({});
      executedTools.push({ name: "get_payment_methods", arguments: {} });
      reply = `Untuk pembayaran DitsStore mendukung:\n- **QRIS** (All e-Wallet & Bank)\n- **Bank BCA** (8291039101 a.n DitsStore CS)\n\nSilakan transfer dan upload bukti tf di sini ya kak 🙏`;
    } else if (intentData.intent === "complaint" || intentData.intent === "refund_request" || intentData.intent === "human_request") {
      action = "HANDOVER";
      reply = "Baik kak, percakapan ini kami alihkan ke Admin Manusia DitsStore ya. Mohon tunggu sebentar 🙏";
    } else {
      reply = `${settings.greetingStyle}\n\nAda yang bisa DitsStore bantu terkait akun premium (ChatGPT, Claude, Canva, Netflix, Spotify)?`;
    }

    return {
      intent: intentData.intent,
      sentiment: intentData.sentiment,
      confidence: 0.9,
      requires_tool: executedTools.length > 0,
      recommended_action: action,
      suggested_reply: reply,
      tool_calls: executedTools,
    };
  }
}

export const geminiProvider = new GeminiProvider();
