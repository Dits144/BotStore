package repositories

import (
	"strings"
	"time"

	"botstore/internal/models"
	"github.com/jmoiron/sqlx"
)

type ProductRepository struct{ db *sqlx.DB }

func NewProductRepository(db *sqlx.DB) *ProductRepository { return &ProductRepository{db: db} }

func (r *ProductRepository) Add(groupID, name, desc, by string) error {
	_, err := r.db.Exec(`INSERT INTO product_lists (group_id, name, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, groupID, strings.ToLower(name), desc, by, time.Now(), time.Now())
	return err
}

func (r *ProductRepository) Delete(groupID, name string) error {
	_, err := r.db.Exec(`DELETE FROM product_lists WHERE group_id = ? AND name = ?`, groupID, strings.ToLower(name))
	return err
}

func (r *ProductRepository) Update(groupID, name, desc string) error {
	_, err := r.db.Exec(`UPDATE product_lists SET description = ?, updated_at = ? WHERE group_id = ? AND name = ?`, desc, time.Now(), groupID, strings.ToLower(name))
	return err
}

func (r *ProductRepository) GetByName(groupID, name string) (*models.ProductList, error) {
	var data models.ProductList
	err := r.db.Get(&data, `SELECT * FROM product_lists WHERE group_id = ? AND name = ? LIMIT 1`, groupID, strings.ToLower(name))
	if err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *ProductRepository) ListByGroup(groupID string) ([]models.ProductList, error) {
	var items []models.ProductList
	err := r.db.Select(&items, `SELECT * FROM product_lists WHERE group_id = ? ORDER BY name ASC`, groupID)
	return items, err
}
