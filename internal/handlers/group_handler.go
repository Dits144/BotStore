package handlers

import (
	"fmt"
	"time"

	waEvents "go.mau.fi/whatsmeow/types/events"
)

func (h *Handler) handleInfoGroup(evt *waEvents.Message) {
	if !evt.Info.IsGroup {
		h.reply(evt.Info.Chat, "⚠️ Command ini hanya untuk grup.")
		return
	}
	info, err := h.cli.GetGroupInfo(evt.Info.Chat)
	if err != nil {
		h.reply(evt.Info.Chat, "❌ Gagal mengambil metadata grup.")
		return
	}
	link := "tidak tersedia"
	if info.InviteLink != "" {
		link = info.InviteLink
	}
	owner := "tidak diketahui"
	if info.OwnerJID.String() != "" {
		owner = info.OwnerJID.String()
	}
	created := "tidak diketahui"
	if info.GroupCreated != 0 {
		created = time.Unix(int64(info.GroupCreated), 0).In(h.cfg.Timezone).Format("02-01-2006 15:04")
	}
	admins := 0
	for _, p := range info.Participants {
		if p.IsAdmin || p.IsSuperAdmin {
			admins++
		}
	}
	text := fmt.Sprintf("┏━━〔 📌 INFO GRUP 〕━━┓\n┃ ✦ Detail Grup WhatsApp\n┗━━━━━━━━━━━━━━━━━━┛\n\n📛 Nama Group : %s\n🔗 Link Group : %s\n🆔 ID Group : %s\n👑 Owner Group : %s\n📅 Tanggal Dibuat : %s\n👥 Total Member : %d\n🛡️ Jumlah Admin : %d\n\n✅ Gunakan info ini dengan bijak.", info.Name, link, evt.Info.Chat.String(), owner, created, len(info.Participants), admins)
	h.reply(evt.Info.Chat, text)
}
