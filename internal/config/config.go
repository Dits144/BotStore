package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

const MainOwnerJID = "6282120196167@s.whatsapp.net"

type Config struct {
	AppName        string
	LogLevel       string
	Timezone       *time.Location
	DatabasePath   string
	SessionDBPath  string
	CommandPrefix  string
	ClaimCode      string
	OwnerLockClaim bool
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	loc, err := time.LoadLocation(getEnv("TZ", "Asia/Jakarta"))
	if err != nil {
		return nil, fmt.Errorf("load timezone: %w", err)
	}

	cfg := &Config{
		AppName:        getEnv("APP_NAME", "Bot WhatsApp Store"),
		LogLevel:       strings.ToLower(getEnv("LOG_LEVEL", "info")),
		Timezone:       loc,
		DatabasePath:   getEnv("DB_PATH", "data/botstore.db"),
		SessionDBPath:  getEnv("SESSION_DB_PATH", "data/session.db"),
		CommandPrefix:  strings.TrimSpace(getEnv("COMMAND_PREFIX", "")),
		ClaimCode:      getEnv("OWNER_CLAIM_CODE", "Ditsanalah144"),
		OwnerLockClaim: strings.EqualFold(getEnv("OWNER_LOCK_CLAIM", "false"), "true"),
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}
