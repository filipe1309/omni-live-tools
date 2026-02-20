#!/bin/bash

# Script to update CHANGELOG.md based on git tags and commits
# Follows Keep a Changelog format (https://keepachangelog.com)
# Usage: ./scripts/update-changelog.sh [--dry-run] [--all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRY_RUN=false
GENERATE_ALL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --all)
      GENERATE_ALL=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--all]"
      echo ""
      echo "Options:"
      echo "  --dry-run      Show what would be written without making changes"
      echo "  --all          Regenerate the entire changelog from all tags"
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
CHANGELOG="$REPO_ROOT/CHANGELOG.md"

# Get remote URL for comparison links
REMOTE_URL=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' || echo "")
if [[ -z "$REMOTE_URL" ]]; then
  echo -e "${YELLOW}Warning: No remote origin found. Version comparison links will be empty.${NC}"
fi

# Function to get date of a tag
get_tag_date() {
  local tag=$1
  git log -1 --format="%as" "$tag" 2>/dev/null
}

# Function to categorize commits and generate changelog section
generate_version_section() {
  local version=$1
  local from_ref=$2
  local to_ref=$3
  local date=$4
  
  local added=""
  local changed=""
  local deprecated=""
  local removed=""
  local fixed=""
  local security=""
  local docs=""
  
  # Get commits between refs
  local commits
  if [[ -z "$from_ref" ]]; then
    commits=$(git log --oneline "$to_ref" 2>/dev/null)
  else
    commits=$(git log --oneline "$from_ref".."$to_ref" 2>/dev/null)
  fi
  
  if [[ -z "$commits" ]]; then
    return
  fi
  
  # Process each commit
  while IFS= read -r commit; do
    local msg=$(echo "$commit" | sed 's/^[a-f0-9]* //')
    # Remove conventional commit prefix (type(scope)!: )
    local desc=$(echo "$msg" | sed -E 's/^[a-z]+(\([^)]*\))?!?: *//')
    # Capitalize first letter
    desc="$(echo "${desc:0:1}" | tr '[:lower:]' '[:upper:]')${desc:1}"
    
    # Categorize by commit type
    if echo "$msg" | grep -qiE '^feat(\(.+\))?!?:'; then
      added="${added}\n- ${desc}"
    elif echo "$msg" | grep -qiE '^fix(\(.+\))?!?:'; then
      fixed="${fixed}\n- ${desc}"
    elif echo "$msg" | grep -qiE '^(refactor|perf|style)(\(.+\))?!?:'; then
      changed="${changed}\n- ${desc}"
    elif echo "$msg" | grep -qiE '^docs(\(.+\))?!?:'; then
      docs="${docs}\n- ${desc}"
    elif echo "$msg" | grep -qiE '^security(\(.+\))?!?:'; then
      security="${security}\n- ${desc}"
    elif echo "$msg" | grep -qiE '^deprecate(\(.+\))?!?:'; then
      deprecated="${deprecated}\n- ${desc}"
    elif echo "$msg" | grep -qiE '^(remove|revert)(\(.+\))?!?:'; then
      removed="${removed}\n- ${desc}"
    elif echo "$msg" | grep -qiE '^(chore|build|ci|test)(\(.+\))?!?:'; then
      # Group chore/build/ci/test under Changed
      changed="${changed}\n- ${desc}"
    fi
  done <<< "$commits"
  
  # Build section output
  local section="## [${version}] - ${date}"
  
  if [[ -n "$added" ]]; then
    section="${section}\n\n### Added\n${added}"
  fi
  
  if [[ -n "$changed" ]]; then
    section="${section}\n\n### Changed\n${changed}"
  fi
  
  if [[ -n "$deprecated" ]]; then
    section="${section}\n\n### Deprecated\n${deprecated}"
  fi
  
  if [[ -n "$removed" ]]; then
    section="${section}\n\n### Removed\n${removed}"
  fi
  
  if [[ -n "$fixed" ]]; then
    section="${section}\n\n### Fixed\n${fixed}"
  fi
  
  if [[ -n "$security" ]]; then
    section="${section}\n\n### Security\n${security}"
  fi
  
  if [[ -n "$docs" ]]; then
    section="${section}\n\n### Documentation\n${docs}"
  fi
  
  echo -e "$section"
}

# Get all tags sorted by version
TAGS=$(git tag --sort=-v:refname 2>/dev/null)

if [[ -z "$TAGS" ]]; then
  echo -e "${RED}Error: No tags found in the repository.${NC}"
  exit 1
fi

echo -e "${BLUE}Found tags:${NC}"
echo "$TAGS"
echo ""

# Convert tags to array (macOS compatible)
TAG_ARRAY=()
while IFS= read -r tag; do
  TAG_ARRAY+=("$tag")
done <<< "$TAGS"

# Generate changelog content
CHANGELOG_CONTENT="# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
"

LINKS=""

# Process each tag
for i in "${!TAG_ARRAY[@]}"; do
  current_tag="${TAG_ARRAY[$i]}"
  version="${current_tag#v}"  # Remove 'v' prefix
  date=$(get_tag_date "$current_tag")
  
  # Determine the previous tag (next in array since sorted descending)
  if [[ $((i + 1)) -lt ${#TAG_ARRAY[@]} ]]; then
    previous_tag="${TAG_ARRAY[$((i + 1))]}"
  else
    previous_tag=""
  fi
  
  echo -e "${BLUE}Processing ${YELLOW}$current_tag${BLUE} (since ${YELLOW}${previous_tag:-beginning}${BLUE})...${NC}"
  
  # Generate section for this version
  section=$(generate_version_section "$version" "$previous_tag" "$current_tag" "$date")
  
  if [[ -n "$section" ]]; then
    CHANGELOG_CONTENT="${CHANGELOG_CONTENT}

${section}"
  fi
  
  # Build comparison links
  if [[ -n "$REMOTE_URL" ]]; then
    if [[ -n "$previous_tag" ]]; then
      LINKS="${LINKS}
[${version}]: ${REMOTE_URL}/compare/${previous_tag}...${current_tag}"
    else
      LINKS="${LINKS}
[${version}]: ${REMOTE_URL}/releases/tag/${current_tag}"
    fi
  fi
done

# Add links at the end
if [[ -n "$LINKS" ]]; then
  CHANGELOG_CONTENT="${CHANGELOG_CONTENT}
${LINKS}"
fi

if $DRY_RUN; then
  echo -e "\n${YELLOW}=== DRY RUN - Generated CHANGELOG.md ===${NC}\n"
  echo -e "$CHANGELOG_CONTENT"
  echo -e "\n${YELLOW}=== END DRY RUN ===${NC}"
else
  echo -e "$CHANGELOG_CONTENT" > "$CHANGELOG"
  echo -e "\n${GREEN}✓ Updated CHANGELOG.md${NC}"
  echo -e "${BLUE}  File: ${YELLOW}$CHANGELOG${NC}"
fi
