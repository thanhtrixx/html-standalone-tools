#!/usr/bin/env sh
# Dynamic runtime dispatcher: executes script using bun or node based on active package manager

if [ "$1" = "-x" ]; then
  shift
  case "$npm_config_user_agent" in
    bun*)
      exec bunx "$@"
      ;;
    *)
      exec npx "$@"
      ;;
  esac
fi

case "$npm_config_user_agent" in
  bun*)
    exec bun "$@"
    ;;
  *)
    exec node "$@"
    ;;
esac
