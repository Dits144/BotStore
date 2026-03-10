package bot

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waEvents "go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"go.uber.org/zap"

	"botstore/internal/config"
	"botstore/internal/handlers"
	"botstore/internal/services"
)

type Client struct {
	cfg       *config.Config
	logger    *zap.Logger
	handler   *handlers.Handler
	rentalSvc *services.RentalService
}

func NewClient(cfg *config.Config, logger *zap.Logger, handler *handlers.Handler, rentalSvc *services.RentalService) *Client {
	return &Client{cfg: cfg, logger: logger, handler: handler, rentalSvc: rentalSvc}
}

func (b *Client) Run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	container, err := sqlstore.New("sqlite", fmt.Sprintf("file:%s?_pragma=foreign_keys(1)", b.cfg.SessionDBPath), waLog.Stdout("Session", "INFO", true))
	if err != nil {
		return err
	}
	device, err := container.GetFirstDevice()
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	cli := whatsmeow.NewClient(device, waLog.Stdout("Whatsmeow", "INFO", true))
	b.handler.AttachClient(cli)

	cli.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *waEvents.Message:
			b.handler.HandleMessage(v)
		case *waEvents.Connected:
			b.logger.Info("bot connected")
		case *waEvents.Disconnected:
			b.logger.Warn("bot disconnected")
		case *waEvents.KeepAliveTimeout:
			b.logger.Warn("reconnecting")
		}
	})

	if cli.Store.ID == nil {
		qrChan, _ := cli.GetQRChannel(context.Background())
		if err = cli.Connect(); err != nil {
			return err
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				fmt.Println("qr generated")
				fmt.Println(evt.Code)
			}
		}
	} else if err = cli.Connect(); err != nil {
		return err
	}

	go b.startRentalRefresher(ctx)
	<-ctx.Done()
	cli.Disconnect()
	return nil
}

func (b *Client) startRentalRefresher(ctx context.Context) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := b.rentalSvc.RefreshFlags(); err != nil {
				b.logger.Error("refresh rental flags", zap.Error(err))
			}
		}
	}
}
