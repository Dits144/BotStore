/**
 * Real API layer for the WhatsApp Store Bot dashboard.
 * Connects to the Express backend running on the Bot VM.
 */

const API_BASE = import.meta.env.VITE_API_URL || "https://six-laboratory-neil-issue.trycloudflare.com/api";

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

function getAuthHeader() {
  const sessionData = localStorage.getItem("auth_session");
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
