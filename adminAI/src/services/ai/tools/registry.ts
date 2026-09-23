import { mockStore } from "@/lib/mockStore";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any) => Promise<any> | any;
}

export const toolsRegistry: Record<string, ToolDefinition> = {
  search_products: {
    name: "search_products",
    description: "Cari produk berdasarkan kata kunci nama produk atau deskripsi.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Kata kunci nama produk, contoh: 'ChatGPT', 'Netflix', 'Canva'" },
      },
      required: ["query"],
    },
    execute: async ({ query }: { query: string }) => {
      const products = mockStore.getProducts();
      const q = query.toLowerCase();
      const results = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
      return {
        count: results.length,
        products: results.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          status: p.status,
          description: p.description,
          warrantyInfo: p.warrantyInfo,
          notesForAi: p.notesForAi,
        })),
      };
    },
  },

  check_stock: {
    name: "check_stock",
    description: "Cek stok dan ketersediaan produk spesifik berdasarkan product_id atau nama.",
    parameters: {
      type: "object",
      properties: {
        product_query: { type: "string", description: "Nama atau ID produk" },
      },
      required: ["product_query"],
    },
    execute: async ({ product_query }: { product_query: string }) => {
      const products = mockStore.getProducts();
      const q = product_query.toLowerCase();
      const prod = products.find((p) => p.id === product_query || p.name.toLowerCase().includes(q));
      if (!prod) return { found: false, message: `Produk '${product_query}' tidak ditemukan.` };
      return {
        found: true,
        id: prod.id,
        name: prod.name,
        stock: prod.stock,
        status: prod.status,
        available: prod.status === "AVAILABLE" && prod.stock > 0,
      };
    },
  },

  get_price: {
    name: "get_price",
    description: "Dapatkan informasi harga resmi produk.",
    parameters: {
      type: "object",
      properties: {
        product_query: { type: "string", description: "Nama atau ID produk" },
      },
      required: ["product_query"],
    },
    execute: async ({ product_query }: { product_query: string }) => {
      const products = mockStore.getProducts();
      const q = product_query.toLowerCase();
      const prod = products.find((p) => p.id === product_query || p.name.toLowerCase().includes(q));
      if (!prod) return { found: false, message: `Produk '${product_query}' tidak ditemukan.` };
      return {
        found: true,
        name: prod.name,
        price: prod.price,
        formattedPrice: `Rp ${prod.price.toLocaleString("id-ID")}`,
      };
    },
  },

  search_faq: {
    name: "search_faq",
    description: "Cari jawaban pertanyaan pelanggan dari Knowledge Base DitsStore (pembayaran, garansi, jam operasional, refund, dll).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Topik atau pertanyaan pelanggan" },
      },
      required: ["query"],
    },
    execute: async ({ query }: { query: string }) => {
      const kb = mockStore.getKnowledge();
      const q = query.toLowerCase();
      const results = kb.filter(
        (k) =>
          k.status === "ACTIVE" &&
          (k.title.toLowerCase().includes(q) ||
            k.content.toLowerCase().includes(q) ||
            k.keywords.some((kw) => kw.toLowerCase().includes(q)))
      );
      return {
        count: results.length,
        articles: results.map((r) => ({
          title: r.title,
          category: r.category,
          content: r.content,
        })),
      };
    },
  },

  get_payment_methods: {
    name: "get_payment_methods",
    description: "Dapatkan daftar metode pembayaran resmi DitsStore dan nomor rekening/QRIS.",
    parameters: {
      type: "object",
      properties: {},
    },
    execute: async () => {
      return {
        methods: [
          { name: "QRIS", details: "All e-Wallet (Dana, OVO, GoPay, ShopeePay, LinkAja) & All Bank QRIS", fee: "Rp 0" },
          { name: "Bank BCA", accountNumber: "8291039101", accountName: "DitsStore CS", fee: "Rp 0" },
          { name: "Dana / OVO / GoPay", number: "081234567890", accountName: "DitsStore", fee: "Rp 0" },
        ],
        instructions: "Setelah transfer, pelanggan wajib mengirimkan screenshot bukti transfer.",
      };
    },
  },

  get_order_status: {
    name: "get_order_status",
    description: "Cek status pesanan pelanggan berdasarkan ID pesanan (contoh: ORD-9901).",
    parameters: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "ID order, misal ORD-9901" },
      },
      required: ["order_id"],
    },
    execute: async ({ order_id }: { order_id: string }) => {
      const orders = mockStore.getOrders();
      const ord = orders.find((o) => o.id.toUpperCase() === order_id.toUpperCase());
      if (!ord) return { found: false, message: `Order ID ${order_id} tidak ditemukan.` };
      return {
        found: true,
        orderId: ord.id,
        status: ord.status,
        paymentStatus: ord.paymentStatus,
        totalAmount: ord.totalAmount,
        createdAt: ord.createdAt,
        items: ord.items,
      };
    },
  },

  handover_to_admin: {
    name: "handover_to_admin",
    description: "Serahkan percakapan kepada admin manusia bila pelanggan marah, minta refund, terjadi masalah kompleks, atau AI ragu.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Alasan handover ke admin manusia" },
      },
      required: ["reason"],
    },
    execute: async ({ reason }: { reason: string }) => {
      return {
        action: "HANDOVER_TRIGGERED",
        reason,
        message: "Percakapan ini telah dialihkan ke Admin Manusia DitsStore.",
      };
    },
  },
};
