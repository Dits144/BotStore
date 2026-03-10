package utils

import (
	"fmt"
	"strings"
	"time"
)

func FormatTanggalID(t time.Time) string {
	bulan := []string{"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}
	return fmt.Sprintf("%02d %s %d", t.Day(), bulan[int(t.Month())-1], t.Year())
}

func FormatJamID(t time.Time) string {
	return t.Format("15:04:05 WIB")
}

func Box(title string, body ...string) string {
	var b strings.Builder
	b.WriteString("┏━━〔 " + title + " 〕━━┓\n")
	for _, line := range body {
		b.WriteString(line + "\n")
	}
	b.WriteString("┗━━━━━━━━━━━━━━━━━━━━┛")
	return b.String()
}
