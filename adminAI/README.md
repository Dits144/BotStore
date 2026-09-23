# DitsStore AI Admin — AI-Powered WhatsApp Customer Service

**DitsStore AI Admin** adalah platform manajemen Customer Service WhatsApp berbasis Kecerdasan Buatan (AI) yang dibangun khusus untuk **DitsStore**. Sistem ini mengintegrasikan Next.js (App Router), TypeScript, Tailwind CSS, Prisma ORM, Google Gemini AI Engine, dan Baileys WhatsApp Gateway untuk memberikan respon cepat, akurat, tanpa halusinasi, serta mendukung handover mulus ke admin manusia.

---

## 🚀 Key Features & Capabilities

1. **3-Column Professional CS Inbox**:
   - Filter percakapan berdasarkan mode (`ALL`, `AUTO`, `ASSIST`, `MANUAL`).
   - Chat stream real-time dengan pengenal pengirim (Pelanggan, AI Assistant, Admin).
   - Mode `ASSIST`: AI menghasilkan **Suggested Reply** draf balasan yang dapat di-edit, disetujui, atau dikirim oleh admin.
   - Tombol **Take Over** (mengubah percakapan ke `MANUAL`) dan **Return to AI** (mengembalikan ke `AUTO`).

2. **AI Engine & Function Calling Safety Layer**:
   - Ditenagai oleh **Google Gemini API** (`gemini-1.5-flash`).
   - Berjalan melalui **Tool Execution Layer** (`search_products`, `check_stock`, `get_price`, `search_faq`, `get_payment_methods`, `get_order_status`, `handover_to_admin`).
   - **Zero Hallucination Guarantee**: AI dilarang mengarang harga, stok, atau data produk. Semua data harus bersumber dari database resmi DitsStore.

3. **WhatsApp Baileys Gateway**:
   - Koneksi nomor WhatsApp DitsStore melalui `@whiskeysockets/baileys`.
   - Halaman status koneksi, generator QR Code, logs event koneksi, dan reconnect otomatis.

4. **Katalog Produk & Pengetahuan (Knowledge Base)**:
   - Management Produk (SKU, Harga, Stok, Instruksi Produk, Garansi, dan Notes Khusus AI).
   - Knowledge Base (FAQ, Cara Bayar, Kebijakan Garansi, SOP Refund, Jam Operasional).

5. **Customer & Order Management**:
   - Database pelanggan WhatsApp, total transaksi, total spending, tag (`VIP`, `Returning Customer`, `Potential Buyer`), dan AI Memory summary.
   - Tracking status transaksi & pembayaran.

6. **Audit & Activity Logs**:
   - Pencatatan seluruh aksi AI, panggilan tool, pengalihan handover, dan aktivitas admin secara mendetail.

---

## 🛠️ Tech Stack

- **Frontend & Framework**: Next.js 14+ (App Router), TypeScript, React 18, Tailwind CSS, Lucide Icons.
- **Database & ORM**: PostgreSQL / Supabase, Prisma ORM.
- **AI Integration**: Google Gemini API (`@google/generative-ai`), System Prompt Builder, Structured Tool Execution.
- **WhatsApp Integration**: `@whiskeysockets/baileys`, `qrcode`.

---

## 📂 Project Architecture & Folder Structure

```
adminAI/
├── prisma/
│   └── schema.prisma         # Unified Prisma Database Schema
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/    # KPI metrics overview & charts
│   │   │   ├── inbox/        # 3-Column CS Inbox UI
│   │   │   ├── products/     # Product catalog & stock manager
│   │   │   ├── customers/    # Customer directory & AI memory
│   │   │   ├── knowledge/    # Knowledge Base CRUD
│   │   │   ├── orders/       # Order & Payment tracker
│   │   │   ├── ai-settings/  # Gemini AI & Persona configuration
│   │   │   ├── whatsapp/     # Baileys QR code & WA status
│   │   │   ├── analytics/    # Performance & AI automation metrics
│   │   │   ├── logs/         # Audit & Tool call logs
│   │   │   └── settings/     # Admin settings
│   │   └── api/              # App Router REST API endpoints
│   ├── components/
│   │   └── layout/           # Sidebar & Header components
│   ├── lib/
│   │   ├── db.ts             # Prisma client singleton
│   │   ├── mockStore.ts      # Development fallback store
│   │   └── utils.ts          # Formatting & styling helpers
│   ├── services/
│   │   ├── ai/
│   │   │   ├── gemini.ts     # Google Gemini API provider
│   │   │   ├── router.ts     # Intent classification & routing engine
│   │   │   ├── prompts.ts    # DitsStore system prompt builder
│   │   │   └── tools/        # Tool registry & function definitions
│   │   └── whatsapp/
│   │       ├── client.ts     # Baileys WhatsApp client & QR stream
│   │       └── events.ts     # WhatsApp message event router
│   └── types/                # TypeScript type declarations
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup Guide

### 1. Clone & Install Dependencies

```bash
cd c:\xampp\htdocs\botStore\adminAI
npm install
```

### 2. Configure Environment Variables

Salin `.env.example` ke `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ditsstore_ai?schema=public"

GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

APP_URL="http://localhost:3000"
WHATSAPP_SESSION_SECRET="super-secret-ditsstore-key"
```

### 3. Database Migration & Setup

```bash
# Push schema to PostgreSQL database
npm run db:push

# Generate Prisma Client
npm run db:generate
```

### 4. Run Development Server

```bash
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🔐 Security Notes

- API Key Google Gemini (`GEMINI_API_KEY`) disimpan pada server-side environment variables dan **TIDAK PERNAH** di-expose ke browser.
- Kredensial & sesi WhatsApp disimpan secara aman di folder server `wa_session_data`.

---

## 📄 License & Ownership

Dibuat untuk **DitsStore Official**. Hak cipta dilindungi undang-undang.
