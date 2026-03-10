package handlers

import (
	"fmt"
	"strings"

	waEvents "go.mau.fi/whatsmeow/types/events"

	"botstore/internal/config"
)

func (h *Handler) handleOwnerClaim(evt *waEvents.Message) {
	if evt.Info.IsGroup {
		return
	}
	if h.cfg.OwnerLockClaim {
		h.reply(evt.Info.Chat, "🔒 Claim owner alternatif sedang dikunci oleh sistem.")
		return
	}
	isOwner, _ := h.owners.IsOwner(evt.Info.Sender.String())
	if isOwner {
		h.reply(evt.Info.Chat, "✅ Kamu sudah terdaftar sebagai owner bot.")
		return
	}
	if err := h.owners.AddOwner(evt.Info.Sender.String(), false); err != nil {
		h.reply(evt.Info.Chat, "❌ Gagal claim owner. Coba lagi nanti.")
		return
	}
	h.reply(evt.Info.Chat, "🎉 Claim berhasil! Kamu sekarang owner tambahan bot.")
}

func (h *Handler) handleOwnerCommands(evt *waEvents.Message, cmd string, args []string, isOwner bool) {
	if !isOwner {
		h.reply(evt.Info.Chat, "❌ Command ini hanya untuk owner bot.")
		return
	}
	switch cmd {
	case "owner":
		if len(args) != 1 {
			h.reply(evt.Info.Chat, helpFormat("owner 62xxxx@s.whatsapp.net"))
			return
		}
		jid := strings.ToLower(strings.TrimSpace(args[0]))
		if err := h.owners.AddOwner(jid, false); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal menambahkan owner.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("✅ Owner baru ditambahkan:\n👤 %s", jid))
	case "delowner":
		if len(args) != 1 {
			h.reply(evt.Info.Chat, helpFormat("delowner 62xxxx@s.whatsapp.net"))
			return
		}
		jid := strings.ToLower(strings.TrimSpace(args[0]))
		if jid == config.MainOwnerJID {
			h.reply(evt.Info.Chat, "⛔ Owner utama tidak bisa dihapus.")
			return
		}
		if err := h.owners.RemoveOwner(jid); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal menghapus owner.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("🗑️ Owner dihapus:\n👤 %s", jid))
	case "listowner":
		owners, err := h.owners.List()
		if err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal mengambil data owner.")
			return
		}
		var b strings.Builder
		b.WriteString("┏━━〔 👑 LIST OWNER BOT 〕━━┓\n")
		for i, o := range owners {
			mark := "Owner Tambahan"
			if o.IsMain {
				mark = "Owner Utama"
			}
			b.WriteString(fmt.Sprintf("%d. %s (%s)\n", i+1, o.JID, mark))
		}
		b.WriteString("┗━━━━━━━━━━━━━━━━━━━━┛")
		h.reply(evt.Info.Chat, b.String())
	}
}
