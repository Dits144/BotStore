import {
  ProductItem,
  CustomerItem,
  KnowledgeItem,
  OrderItemType,
  ConversationItem,
  MessageItem,
  AiSettings,
} from "@/types";

export interface MockStoreData {
  products: ProductItem[];
  customers: CustomerItem[];
  knowledge: KnowledgeItem[];
  orders: OrderItemType[];
  conversations: ConversationItem[];
  settings: AiSettings;
  logs: any[];
}

const initialProducts: ProductItem[] = [
  {
    id: "prod-1",
    name: "ChatGPT Plus (1 Bulan)",
    categoryId: "cat-ai",
    description: "Akun ChatGPT Plus Private / Sharing 1 Bulan dengan garansi full.",
    price: 30000,
    stock: 12,
    status: "AVAILABLE",
    sku: "GPT-PLUS-01",
    productInstructions: "Login menggunakan email yang kami berikan. Gunakan VPN jika terjadi kendala rintangan jaringan.",
    warrantyInfo: "Garansi 30 hari ganti baru jika mengalami kendala login.",
    notesForAi: "Selalu tegaskan bahwa ini versi terbaru (GPT-4o & Canvas). Stok selalu ready selama status AVAILABLE.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Claude Pro (1 Bulan)",
    categoryId: "cat-ai",
    description: "Akses ke Claude 3.5 Sonnet & Claude Opus 1 bulan.",
    price: 35000,
    stock: 8,
    status: "AVAILABLE",
    sku: "CLAUDE-PRO-01",
    productInstructions: "Akses via email invite / credential resmi.",
    warrantyInfo: "Garansi 30 hari penuh.",
    notesForAi: "Sangat direkomendasikan untuk coding dan analisis dokumen panjang.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    name: "Canva Pro Individual (1 Tahun)",
    categoryId: "cat-design",
    description: "Invite Canva Pro via email pribadi customer tanpa ganti password.",
    price: 15000,
    stock: 25,
    status: "AVAILABLE",
    sku: "CANVA-PRO-1Y",
    productInstructions: "Kirimkan email Canva customer setelah pembayaran.",
    warrantyInfo: "Garansi 1 tahun penuh, jika terdegradasi akan di-invite ulang gratis.",
    notesForAi: "Proses cepat 1-5 menit setelah pembayaran terverifikasi.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    name: "Netflix Premium Ultra HD (1 Bulan)",
    categoryId: "cat-stream",
    description: "Profile 1 User 1 Screen Ultra HD 4K garansi 30 hari.",
    price: 45000,
    stock: 0,
    status: "OUT_OF_STOCK",
    sku: "NFLX-UHD-1M",
    productInstructions: "Dilarang mengubah PIN profile lain atau menambah profile.",
    warrantyInfo: "Garansi 30 hari.",
    notesForAi: "Saat ini stok habis. Informasikan ke customer bahwa akan restock nanti malam.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    name: "Spotify Premium Family Plan (1 Bulan)",
    categoryId: "cat-stream",
    description: "Invite akun pribadi ke Plan Family Spotify.",
    price: 20000,
    stock: 15,
    status: "AVAILABLE",
    sku: "SPOT-FAM-1M",
    productInstructions: "Ganti alamat akun Spotify sesuai alamat yang diberikan admin.",
    warrantyInfo: "Garansi 30 hari.",
    notesForAi: "Wajib menyamakan alamat rumah plan family saat mengonfirmasi link.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialKnowledge: KnowledgeItem[] = [
  {
    id: "kb-1",
    title: "Cara Pemesanan & Pembayaran",
    category: "Payment",
    content: "Pemesanan dilakukan via WhatsApp DitsStore. Pembayaran dapat melalui QRIS (All e-Wallet/Bank), BCA (8291039101 a.n DitsStore), Dana, OVO, atau ShopeePay. Setelah transfer, kirimkan bukti pembayaran untuk diproses otomatis/manual.",
    keywords: ["bayar", "transfer", "qris", "bca", "dana", "cara order", "pembayaran"],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-2",
    title: "Kebijakan Garansi & Klaim",
    category: "Warranty",
    content: "Semua produk bergaransi sesuai deskripsi (misal 30 hari). Jika terjadi kendala akun (salah password/back to free), customer cukup mengirimkan screenshot error dan No. Order ke WhatsApp CS. Penggantian akan diproses maks 1x24 jam.",
    keywords: ["garansi", "rusak", "error", "klaim", "ganti", "kendala", "bermasalah"],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-3",
    title: "Jam Operasional DitsStore",
    category: "Store Policy",
    content: "DitsStore buka setiap hari dari jam 08:00 WIB hingga 23:00 WIB. Pemesanan di luar jam operasional tetap diproses oleh AI Assistant, namun handover admin akan direspon saat jam buka.",
    keywords: ["jam buka", "operasional", "tutup", "jam kerja", "buka jam berapa"],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-4",
    title: "Syarat & Ketentuan Refund",
    category: "Refund",
    content: "Refund tunai (kembali uang) HANYA berlaku jika stok pengganti habis total dan garansi belum lewat. AI tidak berhak menyetujui refund secara langsung. Semua pengajuan refund WAJIB di-handover ke Admin Manusia.",
    keywords: ["refund", "kembali uang", "batal", "retur", "dikebalikan"],
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialCustomers: CustomerItem[] = [
  {
    id: "cust-1",
    whatsappNumber: "6281234567890",
    name: "Budi Santoso",
    firstContact: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastContact: new Date(Date.now() - 3600000).toISOString(),
    totalConversations: 3,
    totalOrders: 2,
    totalSpending: 65000,
    tags: ["VIP", "Returning Customer"],
    notes: "Sering beli produk AI. Pembayaran langganan via QRIS.",
  },
  {
    id: "cust-2",
    whatsappNumber: "6289876543210",
    name: "Siti Rahma",
    firstContact: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastContact: new Date(Date.now() - 1800000).toISOString(),
    totalConversations: 1,
    totalOrders: 1,
    totalSpending: 15000,
    tags: ["New Customer"],
    notes: "Membeli Canva Pro 1 Tahun.",
  },
  {
    id: "cust-3",
    whatsappNumber: "6285512345678",
    name: "Ahmad Fauzi",
    firstContact: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastContact: new Date(Date.now() - 600000).toISOString(),
    totalConversations: 1,
    totalOrders: 0,
    totalSpending: 0,
    tags: ["Potential Buyer"],
    notes: "Tanya ketersediaan stok Netflix Premium.",
  },
];

const initialConversations: ConversationItem[] = [
  {
    id: "conv-1",
    customerId: "cust-1",
    customer: initialCustomers[0],
    mode: "AUTO",
    status: "ACTIVE",
    requiresAttention: false,
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      {
        id: "msg-1",
        conversationId: "conv-1",
        sender: "CUSTOMER",
        whatsappMsgId: "wamid-1",
        content: "Halo admin, ChatGPT Plus ready gak ya?",
        status: "READ",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "msg-2",
        conversationId: "conv-1",
        sender: "AI",
        whatsappMsgId: "wamid-2",
        content: "Halo kak Budi! Halo dari DitsStore 😊 ChatGPT Plus (1 Bulan) saat ini **Ready Stok** (tersisa 12 stok) dengan harga Rp 30.000.\n\nFasilitas:\n- Akun Private / Sharing Garansi 30 Hari\n- Bebas akses GPT-4o & Canvas\n\nKak Budi berminat order sekarang?",
        status: "DELIVERED",
        intent: "product_inquiry",
        sentiment: "neutral",
        confidence: 0.98,
        createdAt: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
      },
      {
        id: "msg-3",
        conversationId: "conv-1",
        sender: "CUSTOMER",
        whatsappMsgId: "wamid-3",
        content: "Boleh kak, mau bayar pakai QRIS ya",
        status: "READ",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg-4",
        conversationId: "conv-1",
        sender: "AI",
        whatsappMsgId: "wamid-4",
        content: "Siap kak Budi! Pembayaran via QRIS dapat langsung di-scan.\nTotal: **Rp 30.000**\n\nSetelah transfer berhasil, mohon upload / kirimkan bukti pembayarannya ke sini ya agar pesanan segera kami aktifkan!",
        status: "DELIVERED",
        intent: "payment_question",
        sentiment: "positive",
        confidence: 0.95,
        createdAt: new Date(Date.now() - 3600000 + 4000).toISOString(),
      },
    ],
  },
  {
    id: "conv-2",
    customerId: "cust-3",
    customer: initialCustomers[2],
    mode: "ASSIST",
    status: "ACTIVE",
    requiresAttention: true,
    handoverReason: "Stok produk yang ditanyakan habis (Netflix Premium)",
    lastMessageAt: new Date(Date.now() - 600000).toISOString(),
    messages: [
      {
        id: "msg-5",
        conversationId: "conv-2",
        sender: "CUSTOMER",
        whatsappMsgId: "wamid-5",
        content: "Gan, Netflix Premium yang 1 bulan ada stok gak?",
        status: "READ",
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: "msg-6",
        conversationId: "conv-2",
        sender: "AI",
        whatsappMsgId: "wamid-6",
        content: "Halo Kak Ahmad! Mohon maaf sekali, saat ini stok **Netflix Premium Ultra HD (1 Bulan)** sedang kosong (Out of Stock).\n\nPerkiraan restock akan dilakukan nanti malam pukul 20:00 WIB. Apakah Kak Ahmad ingin kami kabari saat stok sudah tersedia?",
        status: "SENT",
        suggestedReply: "Halo Kak Ahmad! Saat ini Netflix Premium sedang habis stoknya, estimasi restock nanti malam jam 8 ya kak. Mau di-booking dulu?",
        intent: "stock_inquiry",
        sentiment: "neutral",
        confidence: 0.91,
        createdAt: new Date(Date.now() - 590000).toISOString(),
      },
    ],
  },
  {
    id: "conv-3",
    customerId: "cust-2",
    customer: initialCustomers[1],
    mode: "MANUAL",
    status: "ACTIVE",
    requiresAttention: true,
    handoverReason: "Customer mengajukan komplain kendala akun",
    handoverTimestamp: new Date(Date.now() - 1800000).toISOString(),
    lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
    messages: [
      {
        id: "msg-7",
        conversationId: "conv-3",
        sender: "CUSTOMER",
        whatsappMsgId: "wamid-7",
        content: "Min, akun Canva Pro yang kemarin saya beli kenapa hari ini balik ke free lagi ya? Mohon dibantu",
        status: "READ",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
];

const initialOrders: OrderItemType[] = [
  {
    id: "ORD-9901",
    customerId: "cust-1",
    customerName: "Budi Santoso",
    totalAmount: 35000,
    status: "COMPLETED",
    paymentStatus: "PAID",
    notes: "Order Claude Pro 1 Bulan",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      {
        id: "item-1",
        productId: "prod-2",
        productName: "Claude Pro (1 Bulan)",
        quantity: 1,
        price: 35000,
      },
    ],
  },
  {
    id: "ORD-9902",
    customerId: "cust-2",
    customerName: "Siti Rahma",
    totalAmount: 15000,
    status: "COMPLETED",
    paymentStatus: "PAID",
    notes: "Order Canva Pro Individual 1 Tahun",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: "item-2",
        productId: "prod-3",
        productName: "Canva Pro Individual (1 Tahun)",
        quantity: 1,
        price: 15000,
      },
    ],
  },
  {
    id: "ORD-9903",
    customerId: "cust-1",
    customerName: "Budi Santoso",
    totalAmount: 30000,
    status: "WAITING_PAYMENT",
    paymentStatus: "UNPAID",
    notes: "Pemesanan ChatGPT Plus via QRIS",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      {
        id: "item-3",
        productId: "prod-1",
        productName: "ChatGPT Plus (1 Bulan)",
        quantity: 1,
        price: 30000,
      },
    ],
  },
];

const initialSettings: AiSettings = {
  aiEnabled: true,
  aiModel: "gemini-1.5-flash",
  defaultMode: "AUTO",
  temperature: 0.3,
  maxTokens: 500,
  responseDelay: 2,
  businessName: "DitsStore",
  assistantName: "DitsStore AI Assistant",
  businessDescription: "Toko Penyedia Akun Digital Premium Resmi & Bergaransi (ChatGPT, Claude, Canva Pro, Netflix, Spotify, Midjourney, dll).",
  personality: "Kamu adalah admin customer service DitsStore. Gunakan Bahasa Indonesia yang santai, sopan, natural, tidak kaku, dan tidak berlebihan. Jangan mengarang informasi produk, harga, stok, garansi, pembayaran atau order. Gunakan tools yang tersedia untuk mendapatkan informasi aktual.",
  greetingStyle: "Halo kak! Selamat datang di DitsStore 😊 Ada yang bisa kami bantu?",
  closingStyle: "Terima kasih telah menghubungi DitsStore! Semoga harimu menyenangkan 🙏",
  autoHandover: true,
  confidenceThreshold: 0.75,
  systemInstructions: "Jangan pernah memberikan nomor rekening pribadi selain rekening resmi DitsStore (BCA 8291039101). Jika ragu, segera hubungi admin manusia.",
};

const initialLogs = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    event: "AI_RESPONSE_GENERATED",
    actor: "Gemini AI Engine",
    conversationId: "conv-1",
    customerName: "Budi Santoso",
    status: "SUCCESS",
    metadata: { intent: "product_inquiry", confidence: 0.98, toolsUsed: ["search_products", "check_stock"] },
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    event: "HUMAN_TAKEOVER_TRIGGERED",
    actor: "AI Router Auto-Handover",
    conversationId: "conv-3",
    customerName: "Siti Rahma",
    status: "WARNING",
    metadata: { reason: "Customer complaint detected - Canva Pro account issue" },
  },
];

class MockStore {
  private data: MockStoreData;

  constructor() {
    this.data = {
      products: [...initialProducts],
      customers: [...initialCustomers],
      knowledge: [...initialKnowledge],
      orders: [...initialOrders],
      conversations: [...initialConversations],
      settings: { ...initialSettings },
      logs: [...initialLogs],
    };
  }

  // Products
  getProducts() {
    return this.data.products;
  }
  getProductById(id: string) {
    return this.data.products.find((p) => p.id === id);
  }
  saveProduct(prod: ProductItem) {
    const idx = this.data.products.findIndex((p) => p.id === prod.id);
    if (idx >= 0) {
      this.data.products[idx] = { ...prod, updatedAt: new Date().toISOString() };
    } else {
      this.data.products.unshift({ ...prod, id: prod.id || `prod-${Date.now()}` });
    }
    return this.getProductById(prod.id);
  }
  deleteProduct(id: string) {
    this.data.products = this.data.products.filter((p) => p.id !== id);
  }

  // Knowledge Base
  getKnowledge() {
    return this.data.knowledge;
  }
  saveKnowledge(item: KnowledgeItem) {
    const idx = this.data.knowledge.findIndex((k) => k.id === item.id);
    if (idx >= 0) {
      this.data.knowledge[idx] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      this.data.knowledge.unshift({ ...item, id: item.id || `kb-${Date.now()}` });
    }
  }
  deleteKnowledge(id: string) {
    this.data.knowledge = this.data.knowledge.filter((k) => k.id !== id);
  }

  // Customers
  getCustomers() {
    return this.data.customers;
  }
  getCustomerById(id: string) {
    return this.data.customers.find((c) => c.id === id);
  }
  getCustomerByPhone(phone: string) {
    const normalized = phone.replace(/\D/g, "");
    return this.data.customers.find((c) => c.whatsappNumber.replace(/\D/g, "") === normalized);
  }
  saveCustomer(cust: CustomerItem) {
    const idx = this.data.customers.findIndex((c) => c.id === cust.id);
    if (idx >= 0) {
      this.data.customers[idx] = { ...cust };
    } else {
      this.data.customers.unshift({ ...cust, id: cust.id || `cust-${Date.now()}` });
    }
  }

  // Conversations
  getConversations() {
    return this.data.conversations;
  }
  getConversationById(id: string) {
    return this.data.conversations.find((c) => c.id === id);
  }
  updateConversationMode(id: string, mode: "AUTO" | "ASSIST" | "MANUAL", handoverReason?: string) {
    const conv = this.getConversationById(id);
    if (conv) {
      conv.mode = mode;
      if (mode === "MANUAL") {
        conv.requiresAttention = true;
        conv.handoverReason = handoverReason || "Manual Takeover by Admin";
        conv.handoverTimestamp = new Date().toISOString();
      } else if (mode === "AUTO") {
        conv.requiresAttention = false;
        conv.handoverReason = null;
      }
    }
    return conv;
  }
  addMessage(conversationId: string, message: Omit<MessageItem, "id" | "createdAt">) {
    const conv = this.getConversationById(conversationId);
    if (!conv) return null;
    const newMsg: MessageItem = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId,
      createdAt: new Date().toISOString(),
    };
    if (!conv.messages) conv.messages = [];
    conv.messages.push(newMsg);
    conv.lastMessageAt = newMsg.createdAt;

    // Update customer last contact
    const cust = this.getCustomerById(conv.customerId);
    if (cust) cust.lastContact = newMsg.createdAt;

    return newMsg;
  }

  // Orders
  getOrders() {
    return this.data.orders;
  }
  saveOrder(order: OrderItemType) {
    const idx = this.data.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.data.orders[idx] = { ...order };
    } else {
      this.data.orders.unshift({ ...order, id: order.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}` });
    }
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }
  updateSettings(newSettings: Partial<AiSettings>) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    return this.data.settings;
  }

  // Logs
  getLogs() {
    return this.data.logs;
  }
  addLog(log: any) {
    this.data.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log,
    });
  }
}

export const mockStore = new MockStore();
