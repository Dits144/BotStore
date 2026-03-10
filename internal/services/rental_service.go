package services

import (
	"time"

	"botstore/internal/models"
	"botstore/internal/repositories"
)

type RentalService struct {
	repo *repositories.RentalRepository
	loc  *time.Location
}

func NewRentalService(repo *repositories.RentalRepository, loc *time.Location) *RentalService {
	return &RentalService{repo: repo, loc: loc}
}

func (s *RentalService) IsGroupActive(groupID string) bool {
	data, err := s.repo.Get(groupID)
	if err != nil {
		return false
	}
	now := time.Now().In(s.loc)
	return data.IsActive && data.ExpiredAt.After(now)
}

func (s *RentalService) RefreshFlags() error {
	return s.repo.RefreshActiveFlags(time.Now().In(s.loc))
}

func (s *RentalService) ComputeRenewal(existing *models.Rental, days int) time.Time {
	now := time.Now().In(s.loc)
	if existing != nil && existing.ExpiredAt.After(now) {
		return existing.ExpiredAt.AddDate(0, 0, days)
	}
	return now.AddDate(0, 0, days)
}
