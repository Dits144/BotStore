package repositories

import (
	"time"

	"botstore/internal/models"
	"github.com/jmoiron/sqlx"
)

type OwnerRepository struct{ db *sqlx.DB }

func NewOwnerRepository(db *sqlx.DB) *OwnerRepository { return &OwnerRepository{db: db} }

func (r *OwnerRepository) EnsureMainOwner(jid string) error {
	_, err := r.db.Exec(`INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, 1, ?)`, jid, time.Now())
	return err
}

func (r *OwnerRepository) AddOwner(jid string, isMain bool) error {
	_, err := r.db.Exec(`INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, ?, ?)`, jid, boolToInt(isMain), time.Now())
	return err
}

func (r *OwnerRepository) RemoveOwner(jid string) error {
	_, err := r.db.Exec(`DELETE FROM owners WHERE jid = ? AND is_main = 0`, jid)
	return err
}

func (r *OwnerRepository) List() ([]models.Owner, error) {
	var owners []models.Owner
	err := r.db.Select(&owners, `SELECT id, jid, is_main, created_at FROM owners ORDER BY is_main DESC, created_at ASC`)
	return owners, err
}

func (r *OwnerRepository) IsOwner(jid string) (bool, error) {
	var c int
	err := r.db.Get(&c, `SELECT COUNT(1) FROM owners WHERE jid = ?`, jid)
	return c > 0, err
}

func boolToInt(v bool) int {
	if v {
		return 1
	}
	return 0
}
