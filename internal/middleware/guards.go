package middleware

import (
	"context"

	"go.mau.fi/whatsmeow"
	waTypes "go.mau.fi/whatsmeow/types"

	"botstore/internal/services"
)

func CanManageList(ctx context.Context, cli *whatsmeow.Client, roles *services.RoleService, groupJID, sender waTypes.JID) bool {
	if roles.IsBotOwner(sender) {
		return true
	}
	return roles.IsGroupAdmin(ctx, cli, groupJID, sender)
}
