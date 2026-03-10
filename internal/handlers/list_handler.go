package handlers

import (
	"context"
	"fmt"
	"strings"

	waEvents "go.mau.fi/whatsmeow/types/events"

	"botstore/internal/utils"
)

func (h *Handler) handleListProducts(evt *waEvents.Message) {
	items, err := h.products.ListByGroup(evt.Info.Chat.String())
	if err != nil {
		h.reply(evt.Info.Chat, "❌ Gagal membaca katalog grup.")
		return
	}
	if len(items) == 0 {
		h.reply(evt.Info.Chat, "🛒 Toko kosong, admin belum menambahkan katalog.")
		return
	}
	name := h.parseGroupName(evt.Info.Chat.String())
	now := safeNow(h.cfg.Timezone)
	var b strings.Builder
	b.WriteString(fmt.Sprintf("┏━━〔 ⚙ %s 〕━━┓\n┃ ◆ ◆ ◆ ◆ ◆ ◆\n┗━━━━━━━━━━━━━┛\n\n⚡ Available Services\n\n⏱ time : %s\n📅 date : %s\n\n╭──〔 📦 CATALOGUE 〕──╮\n", name, utils.FormatJamID(now), utils.FormatTanggalID(now)))
	for _, item := range items {
		b.WriteString(fmt.Sprintf("┃ 💎 %s\n", item.Name))
	}
	b.WriteString("╰────────────────────╯\n\n📌 NOTE\n• ketik nama produk untuk melihat detail\n• atau gunakan menu bot yang tersedia\n• transaksi hanya melalui admin")
	h.reply(evt.Info.Chat, b.String())
}

func (h *Handler) handleListManage(evt *waEvents.Message, cmd, rawArgs string) {
	rawArgs = strings.TrimSpace(rawArgs)
	switch cmd {
	case "addlist":
		parts := strings.SplitN(rawArgs, "@", 2)
		if len(parts) != 2 || strings.TrimSpace(parts[0]) == "" || strings.TrimSpace(parts[1]) == "" {
			h.reply(evt.Info.Chat, helpFormat("addlist capcut@1 bulan harga 50.000 ribu"))
			return
		}
		name := sanitizeName(parts[0])
		desc := strings.TrimSpace(parts[1])
		if err := h.products.Add(evt.Info.Chat.String(), name, desc, evt.Info.Sender.String()); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal menambahkan list. Pastikan nama unik per grup.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("✅ List berhasil ditambahkan\n📦 Nama : %s\n📝 Deskripsi : %s", name, desc))
	case "dellist":
		if rawArgs == "" {
			h.reply(evt.Info.Chat, helpFormat("dellist capcut"))
			return
		}
		name := sanitizeName(rawArgs)
		if err := h.products.Delete(evt.Info.Chat.String(), name); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal menghapus list.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("🗑️ List berhasil dihapus\n📦 Nama : %s", name))
	case "updatelist":
		parts := strings.SplitN(rawArgs, "@", 2)
		if len(parts) != 2 || strings.TrimSpace(parts[0]) == "" || strings.TrimSpace(parts[1]) == "" {
			h.reply(evt.Info.Chat, helpFormat("updatelist capcut@1 bulan harga 45.000 promo minggu ini"))
			return
		}
		name := sanitizeName(parts[0])
		desc := strings.TrimSpace(parts[1])
		if err := h.products.Update(evt.Info.Chat.String(), name, desc); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal memperbarui list.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("♻️ List berhasil diperbarui\n📦 Nama : %s\n📝 Deskripsi Baru : %s", name, desc))
	}
}

func (h *Handler) handleProductDetailTrigger(_ context.Context, evt *waEvents.Message, text string) {
	name := sanitizeName(text)
	if name == "" {
		return
	}
	item, err := h.products.GetByName(evt.Info.Chat.String(), name)
	if err != nil || item == nil {
		return
	}
	h.reply(evt.Info.Chat, fmt.Sprintf("┏━━〔 📦 DETAIL PRODUK 〕━━┓\n┗━━━━━━━━━━━━━━━━━━━━┛\n\n💎 Nama : %s\n📝 Deskripsi : %s\n\n📌 Hubungi admin untuk order.", item.Name, item.Description))
}

func sanitizeName(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	return strings.Join(strings.Fields(v), " ")
}
