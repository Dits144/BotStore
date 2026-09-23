import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { mockStore } from "@/lib/mockStore";
import { aiRouter } from "@/services/ai/router";

export interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string | null;
  qrCodeUrl?: string | null;
  connectionState: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "QR_READY";
  lastSeen?: string | null;
}

class WhatsAppService {
  private socket: WASocket | null = null;
  private status: WhatsAppStatus = {
    connected: false,
    phoneNumber: null,
    qrCodeUrl: null,
    connectionState: "DISCONNECTED",
  };

  getStatus(): WhatsAppStatus {
    return this.status;
  }

  async initializeSocket(): Promise<void> {
    if (this.status.connectionState === "CONNECTING" || this.status.connectionState === "CONNECTED") {
      return;
    }

    try {
      this.status.connectionState = "CONNECTING";
      const { state, saveCreds } = await useMultiFileAuthState("wa_session_data");

      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
      });

      this.socket.ev.on("creds.update", saveCreds);

      this.socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrUrl = await QRCode.toDataURL(qr);
            this.status.qrCodeUrl = qrUrl;
            this.status.connectionState = "QR_READY";
            mockStore.addLog({
              event: "WHATSAPP_QR_GENERATED",
              actor: "Baileys Client",
              status: "INFO",
              metadata: { message: "Scan QR Code with WhatsApp mobile app" },
            });
          } catch (e) {
            console.error("QR Code Error:", e);
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          this.status.connected = false;
          this.status.connectionState = "DISCONNECTED";
          this.status.qrCodeUrl = null;
          mockStore.addLog({
            event: "WHATSAPP_DISCONNECTED",
            actor: "Baileys Client",
            status: "WARNING",
            metadata: { reconnecting: shouldReconnect, statusCode },
          });

          if (shouldReconnect) {
            setTimeout(() => this.initializeSocket(), 5000);
          }
        } else if (connection === "open") {
          this.status.connected = true;
          this.status.connectionState = "CONNECTED";
          this.status.qrCodeUrl = null;
          this.status.phoneNumber = this.socket?.user?.id.split(":")[0] || "DitsStore Admin CS";
          this.status.lastSeen = new Date().toISOString();

          mockStore.addLog({
            event: "WHATSAPP_CONNECTED",
            actor: "Baileys Client",
            status: "SUCCESS",
            metadata: { phone: this.status.phoneNumber },
          });
        }
      });

      // Listen for incoming personal WhatsApp messages
      this.socket.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const remoteJid = msg.key.remoteJid;
          if (!remoteJid || remoteJid.endsWith("@g.us")) continue; // Skip group chats

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            "";

          if (!text.trim()) continue;

          const rawPhone = remoteJid.split("@")[0];
          const formattedPhone = rawPhone.startsWith("62") ? rawPhone : `62${rawPhone}`;

          // Find or create Customer
          let customer = mockStore.getCustomerByPhone(formattedPhone);
          if (!customer) {
            const pushName = msg.pushName || `Pelanggan WA (${formattedPhone})`;
            customer = {
              id: `cust-${Date.now()}`,
              whatsappNumber: formattedPhone,
              name: pushName,
              firstContact: new Date().toISOString(),
              lastContact: new Date().toISOString(),
              totalConversations: 1,
              totalOrders: 0,
              totalSpending: 0,
              tags: ["New Customer", "WhatsApp Chat"],
              notes: "Otomatis dibuat dari percakapan WhatsApp baru.",
            };
            mockStore.saveCustomer(customer);
          }

          // Find or create active Conversation
          let conv = mockStore.getConversations().find(
            (c) => c.customerId === customer.id && c.status === "ACTIVE"
          );

          if (!conv) {
            conv = {
              id: `conv-${Date.now()}`,
              customerId: customer.id,
              customer: customer,
              mode: mockStore.getSettings().defaultMode || "AUTO",
              status: "ACTIVE",
              requiresAttention: false,
              lastMessageAt: new Date().toISOString(),
              messages: [],
            };
            mockStore.getConversations().unshift(conv);
          }

          // Save incoming Customer message
          mockStore.addMessage(conv.id, {
            sender: "CUSTOMER",
            whatsappMsgId: msg.key.id || undefined,
            content: text,
            status: "READ",
          });

          // Route to AI Assistant Engine
          try {
            const result = await aiRouter.processIncomingMessage(conv.id, text, customer);
            if (
              (result.actionTaken === "AUTO_REPLIED" || result.actionTaken === "HANDOVER_TRIGGERED") &&
              result.responseContent
            ) {
              await this.sendMessage(remoteJid, result.responseContent);
            }
          } catch (routerErr) {
            console.error("[WhatsApp AI Router Error]:", routerErr);
          }
        }
      });
    } catch (err) {
      console.error("[WhatsApp Init Error]:", err);
      this.status.connectionState = "DISCONNECTED";
    }
  }

  async sendMessage(toJid: string, text: string): Promise<boolean> {
    if (!this.socket || !this.status.connected) {
      console.log(`[WhatsApp Mock/Pending Send] To: ${toJid} | Content: ${text}`);
      return true;
    }
    try {
      const jid = toJid.includes("@s.whatsapp.net") ? toJid : `${toJid.replace(/\D/g, "")}@s.whatsapp.net`;
      await this.socket.sendMessage(jid, { text });
      return true;
    } catch (err) {
      console.error("[WhatsApp Send Error]:", err);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.logout();
      } catch (e) {
        this.socket.end(undefined);
      }
      this.socket = null;
    }
    this.status = {
      connected: false,
      phoneNumber: null,
      qrCodeUrl: null,
      connectionState: "DISCONNECTED",
    };
  }
}

export const whatsappService = new WhatsAppService();
