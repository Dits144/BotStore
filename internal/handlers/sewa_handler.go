package handlers

import (
	"fmt"
	"strconv"
	"strings"

	waEvents "go.mau.fi/whatsmeow/types/events"

	"botstore/internal/utils"
)

func (h *Handler) handleSewaCommands(evt *waEvents.Message, cmd string, args []string, isOwner bool) {
	if !isOwner {
		h.reply(evt.Info.Chat, "❌ Command sewa hanya untuk owner bot.")
		return
	}
	switch cmd {
	case "addsewa":
		if len(args) != 2 {
			h.reply(evt.Info.Chat, helpFormat("addsewa 123456789@g.us 90"))
			return
		}
		days, err := strconv.Atoi(args[1])
		if err != nil || days <= 0 {
			h.reply(evt.Info.Chat, helpFormat("addsewa 123456789@g.us 90"))
			return
		}
		groupID := args[0]
		expired := safeNow(h.cfg.Timezone).AddDate(0, 0, days)
		name := h.parseGroupName(groupID)
		if err := h.rentals.Upsert(groupID, name, days, expired, evt.Info.Sender.String()); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal menambahkan sewa.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("📦 Group : %s\n🆔 Group ID : %s\n⏳ Durasi : %d Hari\n📅 Expired : %s %s\n✅ Grup berhasil ditambahkan ke daftar sewa", name, groupID, days, utils.FormatTanggalID(expired), utils.FormatJamID(expired)))
	case "renewsewa":
		if len(args) != 2 {
			h.reply(evt.Info.Chat, helpFormat("renewsewa 123456789@g.us 30"))
			return
		}
		days, err := strconv.Atoi(args[1])
		if err != nil || days <= 0 {
			h.reply(evt.Info.Chat, helpFormat("renewsewa 123456789@g.us 30"))
			return
		}
		groupID := args[0]
		current, _ := h.rentals.Get(groupID)
		expired := h.rentalSvc.ComputeRenewal(current, days)
		name := h.parseGroupName(groupID)
		if err := h.rentals.Upsert(groupID, name, days, expired, evt.Info.Sender.String()); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal memperpanjang sewa.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("♻️ Group : %s\n🆔 Group ID : %s\n⏳ Penambahan : %d Hari\n📅 Expired Baru : %s %s\n✅ Masa sewa berhasil diperpanjang", name, groupID, days, utils.FormatTanggalID(expired), utils.FormatJamID(expired)))
	case "delsewa":
		if len(args) != 1 {
			h.reply(evt.Info.Chat, helpFormat("delsewa 123456789@g.us"))
			return
		}
		groupID := args[0]
		name := h.parseGroupName(groupID)
		if err := h.rentals.Delete(groupID); err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal menghapus sewa grup.")
			return
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("🗑️ Group : %s\n🆔 Group ID : %s\n✅ Grup berhasil dihapus dari daftar sewa", name, groupID))
	case "listsewa":
		rows, err := h.rentals.List()
		if err != nil {
			h.reply(evt.Info.Chat, "❌ Gagal mengambil daftar sewa.")
			return
		}
		if len(rows) == 0 {
			h.reply(evt.Info.Chat, "📭 Belum ada data sewa grup.")
			return
		}
		var b strings.Builder
		b.WriteString("┏━━〔 📦 LIST SEWA GRUP 〕━━┓\n")
		for i, r := range rows {
			status := "expired"
			if r.IsActive && r.ExpiredAt.After(safeNow(h.cfg.Timezone)) {
				status = "aktif"
			}
			b.WriteString(fmt.Sprintf("%d) %s\n🆔 %s\n📅 %s %s\n🔖 %s\n\n", i+1, r.GroupName, r.GroupID, utils.FormatTanggalID(r.ExpiredAt.In(h.cfg.Timezone)), utils.FormatJamID(r.ExpiredAt.In(h.cfg.Timezone)), status))
		}
		b.WriteString("┗━━━━━━━━━━━━━━━━━━━━┛")
		h.reply(evt.Info.Chat, b.String())
	case "ceksewa":
		if len(args) != 1 {
			h.reply(evt.Info.Chat, helpFormat("ceksewa 123456789@g.us"))
			return
		}
		r, err := h.rentals.Get(args[0])
		if err != nil {
			h.reply(evt.Info.Chat, "❌ Data sewa grup tidak ditemukan.")
			return
		}
		status := "expired"
		if r.IsActive && r.ExpiredAt.After(safeNow(h.cfg.Timezone)) {
			status = "aktif"
		}
		h.reply(evt.Info.Chat, fmt.Sprintf("📦 Group : %s\n🆔 Group ID : %s\n📅 Expired : %s %s\n🔖 Status : %s", r.GroupName, r.GroupID, utils.FormatTanggalID(r.ExpiredAt.In(h.cfg.Timezone)), utils.FormatJamID(r.ExpiredAt.In(h.cfg.Timezone)), status))
	}
}
