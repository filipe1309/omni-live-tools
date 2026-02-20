#!/bin/bash

# Script to update package version based on commit history
# Follows Conventional Commits specification for semantic versioning
# Usage: ./scripts/update-version.sh [--since DATE] [--dry-run] [--no-tag] [--changelog] [--yes]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRY_RUN=false
SINCE_DATE=""
CREATE_TAG=true
SKIP_CONFIRM=false
UPDATE_CHANGELOG=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --since)
      SINCE_DATE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-tag)
      CREATE_TAG=false
      shift
      ;;
    --yes|-y)
      SKIP_CONFIRM=true
      shift
      ;;
    --changelog)
      UPDATE_CHANGELOG=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--since DATE] [--dry-run] [--no-tag] [--changelog] [--yes]"
      echo ""
      echo "Options:"
      echo "  --since DATE   Analyze commits since DATE (e.g., '2026-02-16' or 'yesterday')"
      echo "                 If not provided, analyzes commits since last tag"
      echo "  --dry-run      Show what would be done without making changes"
      echo "  --no-tag       Skip creating a git tag for the new version"
      echo "  --changelog    Update CHANGELOG.md after creating the tag"
      echo "  --yes, -y      Skip confirmation prompt"
      echo "  -h, --help     Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get the root directory of the git repository
REPO_ROOT=$(git rev-parse --show-toplevel)
PACKAGE_JSON="$REPO_ROOT/package.json"

# Check if package.json exists
if [[ ! -f "$PACKAGE_JSON" ]]; then
  echo -e "${RED}Error: package.json not found at $PACKAGE_JSON${NC}"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(grep -o '"version": *"[^"]*"' "$PACKAGE_JSON" | head -1 | sed 's/"version": *"//' | sed 's/"//')

if [[ -z "$CURRENT_VERSION" ]]; then
  echo -e "${RED}Error: Could not parse current version from package.json${NC}"
  exit 1
fi

echo -e "${BLUE}Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Build git log command
if [[ -n "$SINCE_DATE" ]]; then
  echo -e "${BLUE}Analyzing commits since: ${YELLOW}$SINCE_DATE${NC}"
  COMMITS=$(git log --oneline --since="$SINCE_DATE 00:00:00" --until="$SINCE_DATE 23:59:59" 2>/dev/null || git log --oneline --since="$SINCE_DATE" 2>/dev/null)
else
  # Get last tag, if any
  LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  if [[ -n "$LAST_TAG" ]]; then
    echo -e "${BLUE}Analyzing commits since tag: ${YELLOW}$LAST_TAG${NC}"
    COMMITS=$(git log --oneline "$LAST_TAG"..HEAD)
  else
    echo -e "${BLUE}No tags found. Analyzing all commits.${NC}"
    COMMITS=$(git log --oneline)
  fi
fi

if [[ -z "$COMMITS" ]]; then
  echo -e "${YELLOW}No commits found to analyze.${NC}"
  exit 0
fi

echo -e "\n${BLUE}Commits to analyze:${NC}"
echo "$COMMITS"
echo ""

# Initialize bump type
BUMP_TYPE="none"
HAS_BREAKING=false
HAS_FEAT=false
HAS_FIX=false
HAS_PATCH=false

# Analyze commits
while IFS= read -r commit; do
  # Extract commit message (remove hash)
  MSG=$(echo "$commit" | sed 's/^[a-f0-9]* //')
  
  # Check for breaking changes
  if echo "$MSG" | grep -qiE '(BREAKING CHANGE|^[a-z]+(\(.+\))?!:)'; then
    HAS_BREAKING=true
    echo -e "  ${RED}BREAKING:${NC} $MSG"
  # Check for features
  elif echo "$MSG" | grep -qiE '^feat(\(.+\))?:'; then
    HAS_FEAT=true
    echo -e "  ${GREEN}feat:${NC} $MSG"
  # Check for fixes
  elif echo "$MSG" | grep -qiE '^fix(\(.+\))?:'; then
    HAS_FIX=true
    echo -e "  ${YELLOW}fix:${NC} $MSG"
  # Check for other conventional commits that warrant a patch
  elif echo "$MSG" | grep -qiE '^(refactor|perf|style|docs|test|chore|build|ci)(\(.+\))?:'; then
    HAS_PATCH=true
    TYPE=$(echo "$MSG" | grep -oiE '^[a-z]+' | head -1)
    echo -e "  ${BLUE}$TYPE:${NC} $MSG"
  else
    echo -e "  ${NC}other: $MSG"
  fi
done <<< "$COMMITS"

echo ""

# Determine version bump
if $HAS_BREAKING; then
  BUMP_TYPE="major"
  NEW_MAJOR=$((MAJOR + 1))
  NEW_MINOR=0
  NEW_PATCH=0
elif $HAS_FEAT; then
  BUMP_TYPE="minor"
  NEW_MAJOR=$MAJOR
  NEW_MINOR=$((MINOR + 1))
  NEW_PATCH=0
elif $HAS_FIX || $HAS_PATCH; then
  BUMP_TYPE="patch"
  NEW_MAJOR=$MAJOR
  NEW_MINOR=$MINOR
  NEW_PATCH=$((PATCH + 1))
else
  echo -e "${YELLOW}No version bump needed based on commits.${NC}"
  exit 0
fi

NEW_VERSION="$NEW_MAJOR.$NEW_MINOR.$NEW_PATCH"

echo -e "${BLUE}Version bump type: ${YELLOW}$BUMP_TYPE${NC}"
echo -e "${BLUE}New version: ${GREEN}$NEW_VERSION${NC}"

if $DRY_RUN; then
  echo -e "\n${YELLOW}Dry run mode - no changes made.${NC}"
  if $CREATE_TAG; then
    echo -e "${YELLOW}Would create tag: v$NEW_VERSION${NC}"
  fi
  exit 0
fi

# Confirmation prompt
if ! $SKIP_CONFIRM; then
  echo -e "${BLUE}Summary of changes:${NC}"
  echo -e "  - Update package.json: ${YELLOW}$CURRENT_VERSION${NC} → ${GREEN}$NEW_VERSION${NC}"
  if $CREATE_TAG; then
    echo -e "  - Create git tag: ${GREEN}v$NEW_VERSION${NC}"
  fi
  echo ""
  read -p "Proceed with these changes? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted.${NC}"
    exit 0
  fi
fi

# Update package.json
if [[ "$(uname)" == "Darwin" ]]; then
  # macOS
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
else
  # Linux
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
fi

echo -e "\n${GREEN}✓ Updated package.json version: $CURRENT_VERSION → $NEW_VERSION${NC}"

# Create git tag
if $CREATE_TAG; then
  TAG_NAME="v$NEW_VERSION"
  
  # Check if tag already exists
  if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Tag $TAG_NAME already exists, skipping tag creation${NC}"
  else
    git tag -a "$TAG_NAME" -m "Release $NEW_VERSION"
    echo -e "${GREEN}✓ Created git tag: $TAG_NAME${NC}"
    echo -e "${BLUE}  To push the tag, run: ${YELLOW}git push origin $TAG_NAME${NC}"
  fi
fi

# Update changelog
if $UPDATE_CHANGELOG; then
  CHANGELOG_SCRIPT="$REPO_ROOT/scripts/update-changelog.sh"
  if [[ -x "$CHANGELOG_SCRIPT" ]]; then
    echo -e "\n${BLUE}Updating CHANGELOG.md...${NC}"
    "$CHANGELOG_SCRIPT"
  else
    echo -e "${YELLOW}⚠ Changelog script not found or not executable: $CHANGELOG_SCRIPT${NC}"
  fi
fi
