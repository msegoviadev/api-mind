#!/usr/bin/env bash
#
# api-mind installer for OpenCode
# Usage: ./install.sh [--global]
#
# Options:
#   --global    Install to ~/.config/opencode/ (user-wide)
#   (none)      Install to current project directory

set -e

PLUGIN_NAME="@msegoviadev/api-mind"
API_MIND_URL="https://raw.githubusercontent.com/msegoviadev/api-mind/main/API-MIND.md"
GLOBAL=false

# Parse arguments
[[ "$1" == "--global" ]] && GLOBAL=true

# Set paths based on installation mode
if $GLOBAL; then
  CONFIG_DIR="$HOME/.config/opencode"
  AGENTS_FILE="$CONFIG_DIR/AGENTS.md"
  CONFIG_FILE="$CONFIG_DIR/opencode.json"
  CONFIG_FILEC="$CONFIG_DIR/opencode.jsonc"
  echo "Installing globally to $CONFIG_DIR/"
else
  CONFIG_DIR="$(pwd)/.opencode"
  AGENTS_FILE="$(pwd)/AGENTS.md"
  CONFIG_FILE="$(pwd)/opencode.json"
  CONFIG_FILEC="$(pwd)/opencode.jsonc"
  echo "Installing to current project directory"
fi

# Find the actual config file (json or jsonc)
find_config_file() {
  if [[ -f "$CONFIG_FILE" ]]; then
    echo "$CONFIG_FILE"
  elif [[ -f "$CONFIG_FILEC" ]]; then
    echo "$CONFIG_FILEC"
  else
    echo "$CONFIG_FILE"
  fi
}

# Check if plugin already installed
check_installed() {
  local config=$(find_config_file)
  if [[ -f "$config" ]]; then
    if grep -q "\"$PLUGIN_NAME\"" "$config" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

# Download API-MIND.md
download_api_mind() {
  mkdir -p "$CONFIG_DIR"
  curl -sSL "$API_MIND_URL" -o "$CONFIG_DIR/API-MIND.md"
}

# Add plugin to opencode.json/jsonc using jq
add_plugin() {
  local config=$(find_config_file)

  # Create file if not exists
  if [[ ! -f "$config" ]]; then
    printf '%s\n' '{' '  "$schema": "https://opencode.ai/config.json",' '  "plugin": ["@msegoviadev/api-mind"]' '}' > "$config"
    return
  fi

  # Check if plugin already exists
  if grep -q "\"$PLUGIN_NAME\"" "$config" 2>/dev/null; then
    return
  fi

  # Use jq to add plugin
  local tmp_file="${config}.tmp"

  # Strip JSONC comments and trailing commas, then process with jq
  # - Remove lines starting with //
  # - Remove trailing commas before } or ]
  # - Then use jq to add the plugin
  sed -e 's|^\s*//.*||' -e 's|,\s*}$|}|' -e 's|,\s*]$|]|' "$config" | \
    jq --arg plugin "$PLUGIN_NAME" '
      if .plugin then
        .plugin = [$plugin] + .plugin
      else
        .plugin = [$plugin]
      end
    ' > "$tmp_file" && mv "$tmp_file" "$config"
}

# Add reference to AGENTS.md
add_agents_reference() {
  mkdir -p "$(dirname "$AGENTS_FILE")"

  local reference="@API-MIND.md"

  # Create file if not exists
  if [[ ! -f "$AGENTS_FILE" ]]; then
    echo "# Project Context" > "$AGENTS_FILE"
    echo "" >> "$AGENTS_FILE"
    echo "$reference" >> "$AGENTS_FILE"
    return
  fi

  # Check if reference already exists
  if grep -q "$reference" "$AGENTS_FILE" 2>/dev/null; then
    return
  fi

  # Append reference
  echo "" >> "$AGENTS_FILE"
  echo "$reference" >> "$AGENTS_FILE"
}

# Main
main() {
  if check_installed; then
    echo "✓ $PLUGIN_NAME already installed"
    exit 0
  fi

  echo "Installing $PLUGIN_NAME..."
  echo ""

  download_api_mind && echo "✓ Downloaded API-MIND.md to $CONFIG_DIR/"
  add_plugin && echo "✓ Added plugin to $(find_config_file)"
  add_agents_reference && echo "✓ Added reference to $AGENTS_FILE"

  echo ""
  echo "✓ Installation complete!"

  if $GLOBAL; then
    echo "  The plugin is now available for all your projects"
  else
    echo "  Run 'opencode' to start using api-mind"
  fi
}

main