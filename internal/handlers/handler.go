package handlers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow"
	waE2E "go.mau.fi/whatsmeow/binary/proto"
	waTypes "go.mau.fi/whatsmeow/types"
	waEvents "go.mau.fi/whatsmeow/types/events"
	"go.uber.org/zap"

	"botstore/internal/config"
	"botstore/internal/middleware"
	"botstore/internal/repositories"
	"botstore/internal/services"
	"botstore/internal/utils"
)

type Handler struct {
	cfg       *config.Config
	logger    *zap.Logger
	cli       *whatsmeow.Client
	owners    *repositories.OwnerRepository
	rentals   *repositories.RentalRepository
	products  *repositories.ProductRepository
	roles     *services.RoleService
	rentalSvc *services.RentalService
}

func NewHandler(cfg *config.Config, logger *zap.Logger, owners *repositories.OwnerRepository, rentals *repositories.RentalRepository, products *repositories.ProductRepository, roles *services.RoleService, rentalSvc *services.RentalService) *Handler {
	return &Handler{cfg: cfg, logger: logger, owners: owners, rentals: rentals, products: products, roles: roles, rentalSvc: rentalSvc}
}

func (h *Handler) AttachClient(cli *whatsmeow.Client) { h.cli = cli }

func (h *Handler) HandleMessage(evt *waEvents.Message) {
	if evt.Info.IsFromMe || evt.Message == nil {
		return
	}
	msg := evt.Message.GetConversation()
	if msg == "" && evt.Message.ExtendedTextMessage != nil {
		msg = evt.Message.ExtendedTextMessage.GetText()
	}
	msg = strings.TrimSpace(msg)
	if msg == "" {
		return
	}

	ctx := context.Background()
	parsed := utils.ParseCommand(msg, h.cfg.CommandPrefix)
	if parsed.Command == "" {
		if evt.Info.IsGroup {
			h.handleProductDetailTrigger(ctx, evt, msg)
		}
		return
	}

	sender := evt.Info.Sender
	chat := evt.Info.Chat
	isOwner := h.roles.IsBotOwner(sender)

	if !evt.Info.IsGroup && strings.EqualFold(msg, h.cfg.ClaimCode) {
		h.handleOwnerClaim(evt)
		return
	}

	switch parsed.Command {
	case "owner", "delowner", "listowner":
		h.handleOwnerCommands(evt, parsed.Command, parsed.Args, isOwner)
		return
	case "addsewa", "renewsewa", "delsewa", "listsewa", "ceksewa":
		h.handleSewaCommands(evt, parsed.Command, parsed.Args, isOwner)
		return
	}

	if evt.Info.IsGroup && !h.rentalSvc.IsGroupActive(chat.String()) {
		if isOwner {
			h.reply(chat, "⚠️ Grup ini belum aktif masa sewanya.\nKamu tetap bisa memakai command owner.")
		}
		return
	}

	switch parsed.Command {
	case "infogrup":
		h.handleInfoGroup(evt)
	case "list":
		h.handleListProducts(evt)
	case "addlist", "dellist", "updatelist":
		if !evt.Info.IsGroup || !middleware.CanManageList(ctx, h.cli, h.roles, chat, sender) {
			h.reply(chat, "❌ Kamu tidak punya izin untuk mengelola list.")
			return
		}
		h.handleListManage(evt, parsed.Command, strings.TrimSpace(strings.TrimPrefix(msg, parsed.Command)))
	default:
		if evt.Info.IsGroup {
			h.handleProductDetailTrigger(ctx, evt, msg)
		}
	}
}

func (h *Handler) reply(to waTypes.JID, text string) {
	_, err := h.cli.SendMessage(context.Background(), to, &waE2E.Message{Conversation: &text})
	if err != nil {
		h.logger.Error("send message", zap.Error(err))
	}
}

func parseJID(raw string) (waTypes.JID, error) {
	return waTypes.ParseJID(strings.TrimSpace(raw))
}

func safeNow(loc *time.Location) time.Time {
	if loc == nil {
		return time.Now()
	}
	return time.Now().In(loc)
}

func (h *Handler) parseGroupName(groupID string) string {
	jid, err := parseJID(groupID)
	if err != nil {
		return "Unknown Group"
	}
	info, err := h.cli.GetGroupInfo(jid)
	if err != nil || info.Name == "" {
		return "Unknown Group"
	}
	return info.Name
}

func helpFormat(ex string) string {
	return fmt.Sprintf("❌ Format salah\nContoh:\n%s", ex)
}
