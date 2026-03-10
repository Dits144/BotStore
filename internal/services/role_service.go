package services

import (
	"context"

	"go.mau.fi/whatsmeow"
	waTypes "go.mau.fi/whatsmeow/types"

	"botstore/internal/repositories"
)

type RoleService struct {
	owners *repositories.OwnerRepository
}

func NewRoleService(owners *repositories.OwnerRepository) *RoleService {
	return &RoleService{owners: owners}
}

func (s *RoleService) IsBotOwner(jid waTypes.JID) bool {
	ok, err := s.owners.IsOwner(jid.String())
	return err == nil && ok
}

func (s *RoleService) IsGroupAdmin(ctx context.Context, cli *whatsmeow.Client, groupJID, userJID waTypes.JID) bool {
	info, err := cli.GetGroupInfo(groupJID)
	if err != nil {
		return false
	}
	for _, p := range info.Participants {
		if p.JID.User == userJID.User && p.JID.Server == userJID.Server {
			return p.IsAdmin || p.IsSuperAdmin
		}
	}
	return false
}
