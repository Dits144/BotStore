package utils

import "strings"

type ParsedCommand struct {
	Raw     string
	Command string
	Args    []string
}

func ParseCommand(text, prefix string) ParsedCommand {
	raw := strings.TrimSpace(text)
	if raw == "" {
		return ParsedCommand{}
	}
	if prefix != "" && !strings.HasPrefix(raw, prefix) {
		return ParsedCommand{Raw: raw}
	}
	if prefix != "" {
		raw = strings.TrimPrefix(raw, prefix)
	}
	parts := strings.Fields(raw)
	if len(parts) == 0 {
		return ParsedCommand{}
	}
	cmd := strings.ToLower(parts[0])
	return ParsedCommand{Raw: strings.TrimSpace(text), Command: cmd, Args: parts[1:]}
}
