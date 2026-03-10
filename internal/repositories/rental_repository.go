package repositories

import (
	"time"

	"botstore/internal/models"
	"github.com/jmoiron/sqlx"
)

type RentalRepository struct{ db *sqlx.DB }

func NewRentalRepository(db *sqlx.DB) *RentalRepository { return &RentalRepository{db: db} }

func (r *RentalRepository) Upsert(groupID, groupName string, days int, expiredAt time.Time, addedBy string) error {
	now := time.Now()
	_, err := r.db.Exec(`
INSERT INTO rentals (group_id, group_name, duration_days, expired_at, added_by, is_active, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, 1, ?, ?)
ON CONFLICT(group_id) DO UPDATE SET
group_name = excluded.group_name,
duration_days = excluded.duration_days,
expired_at = excluded.expired_at,
added_by = excluded.added_by,
is_active = 1,
updated_at = excluded.updated_at,
deleted_at = NULL`, groupID, groupName, days, expiredAt, addedBy, now, now)
	return err
}

func (r *RentalRepository) Delete(groupID string) error {
	_, err := r.db.Exec(`UPDATE rentals SET is_active = 0, deleted_at = ?, updated_at = ? WHERE group_id = ?`, time.Now(), time.Now(), groupID)
	return err
}

func (r *RentalRepository) Get(groupID string) (*models.Rental, error) {
	var data models.Rental
	err := r.db.Get(&data, `SELECT * FROM rentals WHERE group_id = ? LIMIT 1`, groupID)
	if err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *RentalRepository) List() ([]models.Rental, error) {
	var rows []models.Rental
	err := r.db.Select(&rows, `SELECT * FROM rentals ORDER BY updated_at DESC`)
	return rows, err
}

func (r *RentalRepository) RefreshActiveFlags(now time.Time) error {
	_, err := r.db.Exec(`UPDATE rentals SET is_active = CASE WHEN expired_at > ? AND deleted_at IS NULL THEN 1 ELSE 0 END, updated_at = ?`, now, now)
	return err
}
