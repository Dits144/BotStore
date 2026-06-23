/**
 * Real API layer for the WhatsApp Store Bot dashboard.
 * Connects to the Express backend running on the Bot VM.
 */

const API_BASE = import.meta.env.VITE_API_URL || "https://shot-protocols-course-flood.trycloudflare.com/api";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
  fastDelivery: boolean;
  isRare: boolean;
}

export interface LinkedGroup {
  token: string; // Group JID
  name: string;
  linkedAt: string;
}

export interface AuthSession {
  email: string;
  role: string;
  token: string; // JWT
  groups: LinkedGroup[];
}

function getAuthHeader(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  const sessionData = localStorage.getItem("wa-bot-dashboard:session:v1");
  if (!sessionData) return {};
  const session = JSON.parse(sessionData);
  return { Authorization: `Bearer ${session.token}` };
}

// ---- Auth ----
export async function registerRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Registration failed");
  }
  return res.json();
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Login failed");
  }
  return res.json();
}

export async function linkAdditionalGroup(
  groupToken: string,
  groupPassword?: string,
): Promise<LinkedGroup> {
  const res = await fetch(`${API_BASE}/groups/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ groupToken, groupPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to link group");
  }
  return res.json();
}

// ---- Rentals (Owner Only) ----

export interface Rental {
  group_id: string;
  group_name: string;
  duration_days: number;
  expired_at: string;
  is_active: number;
}

export async function fetchRentals(): Promise<Rental[]> {
  const res = await fetch(`${API_BASE}/rentals`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch rentals");
  return res.json();
}

export async function addRentalTime(groupToken: string, days: number): Promise<void> {
  const res = await fetch(`${API_BASE}/rentals/${encodeURIComponent(groupToken)}/add_time`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) throw new Error("Failed to add time");
}

export async function reduceRentalTime(groupToken: string, days: number): Promise<void> {
  const res = await fetch(`${API_BASE}/rentals/${encodeURIComponent(groupToken)}/reduce_time`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) throw new Error("Failed to reduce time");
}

// ---- Products (scoped to a group token) ----

export async function fetchProducts(groupToken: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(groupToken)}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function createProduct(
  groupToken: string,
  product: Omit<Product, "id">,
): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(groupToken)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
}

export async function updateProduct(
  groupToken: string,
  id: string,
  patch: Partial<Product>,
): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(groupToken)}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update product");
  
  // Note: the backend currently just returns { success: true }, 
  // so we return a merged mock of the updated product for the UI
  return { id, ...patch } as Product;
}

export async function deleteProduct(
  groupToken: string,
  id: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(groupToken)}/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete product");
}

// ---- Admin Tools (Group Management) ----

export interface GroupCustomer {
  rank: number;
  customerJid: string;
  phone: string;
  totalTransactions: number;
  tier: string;
  emoji: string;
}

export async function fetchCustomers(groupToken: string): Promise<GroupCustomer[]> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/customers`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Gagal mengambil data customer");
  return res.json();
}

export async function toggleGroupSetting(
  groupToken: string,
  action: "open" | "close",
): Promise<void> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/setting`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengubah setting grup");
  }
}

export async function broadcastMessage(
  groupToken: string,
  message: string,
  image?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ message, image }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengirim broadcast");
  }
}

export async function cloneCatalogue(
  groupToken: string,
  sourceGroupToken: string,
): Promise<{ cloned: number }> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/clone`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ sourceGroupToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal melakukan clone");
  }
  return res.json();
}

// ---- Owner Controls (CRUD Owners & CRUD Rentals) ----

export interface BotOwner {
  jid: string;
  is_main: number;
  created_at: string;
}

export async function fetchOwners(): Promise<BotOwner[]> {
  const res = await fetch(`${API_BASE}/owners`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Gagal mengambil data owner");
  return res.json();
}

export async function addOwner(jid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/owners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ jid }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menambah owner baru");
  }
}

export async function deleteOwner(jid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/owners/${encodeURIComponent(jid)}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menghapus owner");
  }
}

export async function addRental(
  group_id: string,
  group_name: string,
  duration_days: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/rentals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ group_id, group_name, duration_days }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menambahkan grup sewa baru");
  }
}

export async function deleteRental(groupToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rentals/${encodeURIComponent(groupToken)}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menghapus grup sewa");
  }
}

export interface GroupDiagnostics {
  group_id: string;
  group_name: string;
  duration_days: number;
  expired_at: string;
  is_active: number;
  total_products: number;
  total_transactions: number;
  total_customers: number;
  system: {
    cpu_usage: number;
    memory_usage: number;
    memory_used_mb: number;
    memory_total_mb: number;
    database_size_kb: number;
  };
}

export async function fetchDiagnostics(groupToken: string): Promise<GroupDiagnostics> {
  const res = await fetch(`${API_BASE}/rentals/${encodeURIComponent(groupToken)}/diagnostics`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengambil diagnostik grup");
  }
  return res.json();
}

export function fetchQrisUrl(): string {
  return `${API_BASE}/qris?t=${new Date().getTime()}`;
}

export async function uploadQris(base64Image: string): Promise<void> {
  const res = await fetch(`${API_BASE}/qris`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ image: base64Image }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal memperbarui QRIS");
  }
}

export async function getPaymentCaption(): Promise<string> {
  const res = await fetch(`${API_BASE}/payment-caption`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengambil caption pembayaran");
  }
  const data = await res.json();
  return data.caption;
}

export async function updatePaymentCaption(caption: string): Promise<void> {
  const res = await fetch(`${API_BASE}/payment-caption`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ caption }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal memperbarui caption pembayaran");
  }
}

export interface GroupPaymentSettings {
  hasQris: boolean;
  qrisUrl: string;
  caption: string;
}

export async function getGroupPaymentSettings(groupToken: string): Promise<GroupPaymentSettings> {
  const res = await fetch(`${API_BASE}/groups/${groupToken}/payment`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengambil pengaturan pembayaran grup");
  }
  return res.json();
}

export async function updateGroupPaymentSettings(
  groupToken: string,
  caption?: string,
  base64Image?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/groups/${groupToken}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ caption, image: base64Image }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal memperbarui pengaturan pembayaran grup");
  }
}

export async function sendRentalReport(
  groupToken: string,
  packageName: string,
  base64Proof: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/rentals/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ groupToken, packageName, proofImage: base64Proof }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengirimkan laporan bukti transfer");
  }
}

export interface WelcomeSettings {
  welcomeEnabled: boolean;
  welcomeMessage: string;
}

export async function fetchWelcomeSettings(groupToken: string): Promise<WelcomeSettings> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/welcome`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal memuat setting welcome");
  }
  return res.json();
}

export async function updateWelcomeSettings(
  groupToken: string,
  welcomeEnabled: boolean,
  welcomeMessage: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/welcome`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ welcomeEnabled, welcomeMessage }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal memperbarui setting welcome");
  }
}

export interface GroupMember {
  jid: string;
  phone: string;
  name?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export async function fetchGroupMembers(groupToken: string): Promise<GroupMember[]> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/members`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal memuat daftar anggota grup");
  }
  return res.json();
}

export async function kickGroupMember(groupToken: string, participantJid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/members/kick`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ participantJid }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal mengeluarkan anggota grup");
  }
}

export async function addGroupMember(groupToken: string, phone: string): Promise<void> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupToken)}/members/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menambahkan anggota grup");
  }
}

// ─── Transaction API ──────────────────────────────────────────────────────────

export interface Transaction {
  id: number;
  trx_id: string;
  group_id: string;
  group_name: string;
  customer_jid: string;
  admin_jid: string;
  product: string;
  amount: number;
  status: "pending" | "done" | "refund" | "batal";
  ocr_raw: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionStats {
  today: { total_count: number; revenue_done: number; revenue_refund: number; profit: number; revenue_all: number };
  month: { total_count: number; revenue_done: number; revenue_refund: number; profit: number; revenue_all: number };
  allTime: { total_count: number; revenue_done: number; revenue_refund: number; profit: number };
}

export interface ChartData {
  month: string;
  total_count: number;
  revenue_done: number;
  revenue_refund: number;
  profit: number;
}

export interface TopProduct {
  product: string;
  count: number;
  revenue: number;
}

export interface GroupSummary {
  group_id: string;
  group_name: string;
  total_count: number;
  revenue_done: number;
}

export async function fetchTransactions(
  groupToken: string,
  opts: { status?: string; limit?: number; offset?: number } = {}
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  const qs = params.toString() ? `?${params}` : "";
  const res = await fetch(
    `${API_BASE}/transactions/${encodeURIComponent(groupToken)}${qs}`,
    { headers: getAuthHeader() }
  );
  if (!res.ok) throw new Error("Gagal mengambil riwayat transaksi");
  return res.json();
}

export async function fetchTransactionStats(groupToken: string): Promise<TransactionStats> {
  const res = await fetch(
    `${API_BASE}/transactions/${encodeURIComponent(groupToken)}/stats`,
    { headers: getAuthHeader() }
  );
  if (!res.ok) throw new Error("Gagal mengambil statistik transaksi");
  return res.json();
}

export async function fetchTransactionChart(groupToken: string, year?: number): Promise<ChartData[]> {
  const qs = year ? `?year=${year}` : "";
  const res = await fetch(
    `${API_BASE}/transactions/${encodeURIComponent(groupToken)}/chart${qs}`,
    { headers: getAuthHeader() }
  );
  if (!res.ok) throw new Error("Gagal mengambil data chart");
  return res.json();
}

export async function fetchTopProducts(groupToken: string, limit = 10): Promise<TopProduct[]> {
  const res = await fetch(
    `${API_BASE}/transactions/${encodeURIComponent(groupToken)}/products?limit=${limit}`,
    { headers: getAuthHeader() }
  );
  if (!res.ok) throw new Error("Gagal mengambil produk terlaris");
  return res.json();
}

export async function fetchDashboardSummary(): Promise<GroupSummary[]> {
  const res = await fetch(`${API_BASE}/dashboard/summary`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Gagal mengambil ringkasan dashboard");
  return res.json();
}

export async function updateTransactionStatus(
  trxId: string,
  status: "pending" | "done" | "refund" | "batal"
): Promise<void> {
  const res = await fetch(`${API_BASE}/transactions/${encodeURIComponent(trxId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal memperbarui status transaksi");
  }
}

export async function clearAllTransactions(groupToken: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/transactions/${encodeURIComponent(groupToken)}/clear-all`,
    {
      method: "POST",
      headers: getAuthHeader(),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Gagal menghapus data transaksi");
  }
}

