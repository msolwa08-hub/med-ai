#!/usr/bin/env bash
# The Translator's context hook, for ANY repo, on ANY machine — not just the
# home repo on this one. A session opened directly in med-ai (or any other
# project repo) has no local copy of mind/, calibration.md, or registry.md to
# read. This ensures one exists (clone once, pull thereafter), then delegates
# to context-inject.sh — the actual content logic stays single-sourced in the
# Translator repo, never copied/duplicated into each project (L9's mistake,
# avoided on purpose). Only this small bootstrap script is copied per-repo.
#
# Fails SILENTLY (exit 0) on any network/git problem — a context hook must
# never block the user's actual prompt because the network hiccuped.
set -uo pipefail

CACHE="${TRANSLATOR_CACHE:-$HOME/.translator-brain}"
REPO_URL="https://github.com/msolwa08-hub/agent.git"
BRANCH="claude/code-translator-agent-b7ln0p"

if [ ! -d "$CACHE/.git" ]; then
  git clone --quiet --branch "$BRANCH" --single-branch "$REPO_URL" "$CACHE" >/dev/null 2>&1 || exit 0
else
  git -C "$CACHE" fetch --quiet origin "$BRANCH" >/dev/null 2>&1 && \
  git -C "$CACHE" reset --quiet --hard "origin/$BRANCH" >/dev/null 2>&1 || true
fi

[ -f "$CACHE/tools/context-inject.sh" ] || exit 0
CLAUDE_PROJECT_DIR="$CACHE" bash "$CACHE/tools/context-inject.sh"
