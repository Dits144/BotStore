package app

import (
	"fmt"

	"botstore/internal/bot"
	"botstore/internal/config"
	"botstore/internal/database"
	"botstore/internal/handlers"
	"botstore/internal/repositories"
	"botstore/internal/services"
	"botstore/internal/utils"
)

func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	logger, err := utils.NewLogger(cfg.LogLevel)
	if err != nil {
		return err
	}
	defer logger.Sync()

	db, err := database.OpenSQLite(cfg.DatabasePath)
	if err != nil {
		return err
	}
	defer db.Close()
	if err = database.Migrate(db); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	ownerRepo := repositories.NewOwnerRepository(db)
	rentalRepo := repositories.NewRentalRepository(db)
	productRepo := repositories.NewProductRepository(db)

	if err = ownerRepo.EnsureMainOwner(config.MainOwnerJID); err != nil {
		return fmt.Errorf("ensure main owner: %w", err)
	}

	roleSvc := services.NewRoleService(ownerRepo)
	rentalSvc := services.NewRentalService(rentalRepo, cfg.Timezone)
	if err = rentalSvc.RefreshFlags(); err != nil {
		logger.Warn("initial rental refresh failed")
	}

	h := handlers.NewHandler(cfg, logger, ownerRepo, rentalRepo, productRepo, roleSvc, rentalSvc)
	b := bot.NewClient(cfg, logger, h, rentalSvc)
	return b.Run()
}
