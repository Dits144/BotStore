package models

import "time"

type Owner struct {
	ID        int64     `db:"id"`
	JID       string    `db:"jid"`
	IsMain    bool      `db:"is_main"`
	CreatedAt time.Time `db:"created_at"`
}

type Rental struct {
	ID        int64      `db:"id"`
	GroupID   string     `db:"group_id"`
	GroupName string     `db:"group_name"`
	Duration  int        `db:"duration_days"`
	ExpiredAt time.Time  `db:"expired_at"`
	AddedBy   string     `db:"added_by"`
	IsActive  bool       `db:"is_active"`
	CreatedAt time.Time  `db:"created_at"`
	UpdatedAt time.Time  `db:"updated_at"`
	DeletedAt *time.Time `db:"deleted_at"`
}

type ProductList struct {
	ID          int64     `db:"id"`
	GroupID     string    `db:"group_id"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	CreatedBy   string    `db:"created_by"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}
