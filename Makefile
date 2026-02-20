# ==============================================================================
# Makefile for OmniLIVE Tools
# ==============================================================================
#
# Usage: make [target]
#
# Run 'make help' to see all available commands
# ==============================================================================

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------

# Shell configuration
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

# Disable built-in rules and variables for better performance
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

# Default target
.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# Variables
# ------------------------------------------------------------------------------

# Tools
NODE := node
NPM := npm
TSC := npx tsc
TS_NODE := npx ts-node
ESLINT := npx eslint

# Directories
BACKEND_DIR := backend
FRONTEND_DIR := frontend
ELECTRON_DIR := electron
DIST_DIR := $(BACKEND_DIR)/dist
DIST_ELECTRON_DIR := $(ELECTRON_DIR)/dist-electron
RELEASE_DIR := release
PUBLIC_DIR := public-react
NODE_MODULES := node_modules

# Colors for output (using printf-compatible format)
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
CYAN := \033[0;36m
BOLD := \033[1m
NC := \033[0m

# ------------------------------------------------------------------------------
# Help (Auto-generated from comments)
# ------------------------------------------------------------------------------

.PHONY: help h
## help: Display this help message [alias: h]
help h:
	@printf "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)\n"
	@printf "$(BLUE)║         OmniLIVE Tools - Available Commands                  ║$(NC)\n"
	@printf "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)\n"
	@printf "\n"
	@printf "$(BOLD)Usage:$(NC) make $(GREEN)<target>$(NC)\n"
	@grep -E '^## @|^## [a-zA-Z_-]+:' $(MAKEFILE_LIST) | \
		awk 'BEGIN { \
			cyan="\033[0;36m"; green="\033[0;32m"; nc="\033[0m" \
		} \
		/^## @/ { \
			sub(/^## @/, ""); \
			printf "\n%s▸ %s%s\n", cyan, $$0, nc; \
			next \
		} \
		/^## / { \
			sub(/^## /, ""); \
			idx = index($$0, ": "); \
			cmd = substr($$0, 1, idx - 1); \
			desc = substr($$0, idx + 2); \
			printf "  %s%-22s%s %s\n", green, cmd, nc, desc \
		}'
	@printf "\n$(YELLOW)Tip:$(NC) Most commands have short aliases (e.g., 'bi' for 'backend-install')\n\n"

# ------------------------------------------------------------------------------
# Internal Utility Targets (not shown in help)
# ------------------------------------------------------------------------------

.PHONY: check-node
check-node:
	@printf "$(BLUE)Checking Node.js version...$(NC)\n"
	@node_version=$$($(NODE) --version | cut -d'v' -f2 | cut -d'.' -f1); \
	if [ $$node_version -lt 18 ]; then \
		printf "$(RED)✗ Node.js version 18 or higher is required$(NC)\n"; \
		exit 1; \
	else \
		printf "$(GREEN)✓ Node.js version OK ($$($(NODE) --version))$(NC)\n"; \
	fi

.PHONY: check-backend-deps
check-backend-deps:
	@if [ ! -d "$(BACKEND_DIR)/$(NODE_MODULES)" ]; then \
		printf "$(YELLOW)⚠️  Backend dependencies not found. Running 'make backend-install'...$(NC)\n"; \
		$(MAKE) backend-install; \
	fi

.PHONY: check-electron-deps
check-electron-deps:
	@if [ ! -d "$(NODE_MODULES)" ]; then \
		printf "$(YELLOW)⚠️  Electron dependencies not found. Running 'make electron-install'...$(NC)\n"; \
		$(MAKE) electron-install; \
	fi

.PHONY: check-frontend-deps
check-frontend-deps:
	@if [ ! -d "$(FRONTEND_DIR)/$(NODE_MODULES)" ]; then \
		printf "$(YELLOW)⚠️  Frontend dependencies not found. Running 'make frontend-install'...$(NC)\n"; \
		$(MAKE) frontend-install; \
	fi

# ------------------------------------------------------------------------------
## @Combined Commands (Backend + Frontend)
# ------------------------------------------------------------------------------

.PHONY: install i
## install: Install all dependencies (backend + frontend + electron) [alias: i]
install i: backend-install frontend-install electron-install
	@printf "$(GREEN)✓ All dependencies installed$(NC)\n"

.PHONY: dev d
## dev: Start both backend and frontend dev servers [alias: d]
dev d:
	@printf "$(BLUE)🚀 Starting backend and frontend servers...$(NC)\n"
	@printf "$(YELLOW)  Backend:  http://localhost:8081$(NC)\n"
	@printf "$(YELLOW)  Frontend: http://localhost:3000$(NC)\n"
	@printf "\n"
	@cd $(BACKEND_DIR) && $(NPM) run dev & cd $(FRONTEND_DIR) && $(NPM) run dev

.PHONY: build b
## build: Build both backend and frontend [alias: b]
build b: backend-build frontend-build
	@printf "$(GREEN)✓ Full build complete$(NC)\n"

.PHONY: start s
## start: Build and start production [alias: s]
start s: build backend-start

.PHONY: lint l
## lint: Run linters on both projects [alias: l]
lint l: backend-lint frontend-lint
	@printf "$(GREEN)✓ All linting complete$(NC)\n"

.PHONY: test t
## test: Run all tests [alias: t]
test t: backend-test frontend-test
	@printf "$(GREEN)✓ All tests complete$(NC)\n"

.PHONY: test-watch tw
## test-watch: Run tests in watch mode [alias: tw]
test-watch tw: backend-test-watch frontend-test-watch

.PHONY: test-coverage tc
## test-coverage: Run tests with coverage report [alias: tc]
test-coverage tc: backend-test-coverage frontend-test-coverage

.PHONY: clean c
## clean: Clean all build artifacts [alias: c]
clean c: backend-clean frontend-clean electron-clean
	@printf "$(GREEN)✓ All clean complete$(NC)\n"

.PHONY: clean-all ca
## clean-all: Clean artifacts and all node_modules [alias: ca]
clean-all ca: backend-clean-all frontend-clean electron-clean
	@printf "$(BLUE)🧹 Removing frontend node_modules...$(NC)\n"
	@rm -rf $(FRONTEND_DIR)/$(NODE_MODULES)
	@printf "$(BLUE)🧹 Removing root node_modules...$(NC)\n"
	@rm -rf $(NODE_MODULES)
	@printf "$(GREEN)✓ Full clean complete$(NC)\n"

.PHONY: info
## info: Display project information
info:
	@printf "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)\n"
	@printf "$(BLUE)║                   Project Information                        ║$(NC)\n"
	@printf "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)\n"
	@printf "\n"
	@printf "$(CYAN)Root (Electron):$(NC)\n"
	@printf "  Name:    %s\n" "$$($(NODE) -p "require('./package.json').name")"
	@printf "  Version: %s\n" "$$($(NODE) -p "require('./package.json').version")"
	@printf "\n"
	@printf "$(CYAN)Backend:$(NC)\n"
	@printf "  Name:    %s\n" "$$($(NODE) -p "require('./backend/package.json').name")"
	@printf "  Version: %s\n" "$$($(NODE) -p "require('./backend/package.json').version")"
	@printf "\n"
	@printf "$(CYAN)Frontend:$(NC)\n"
	@printf "  Name:    %s\n" "$$($(NODE) -p "require('./frontend/package.json').name")"
	@printf "  Version: %s\n" "$$($(NODE) -p "require('./frontend/package.json').version")"
	@printf "\n"
	@printf "$(CYAN)Environment:$(NC)\n"
	@printf "  Node:    %s\n" "$$($(NODE) --version)"
	@printf "  NPM:     %s\n" "$$($(NPM) --version)"

.PHONY: setup
## setup: Fresh install and build (clean-all + install + build)
setup: clean-all install build
	@printf "$(GREEN)✓ Project setup complete$(NC)\n"

# ------------------------------------------------------------------------------
## @Backend Commands (Node.js + TypeScript)
# ------------------------------------------------------------------------------

.PHONY: backend-install bi
## backend-install: Install backend dependencies [alias: bi]
backend-install bi: check-node
	@printf "$(BLUE)📦 Installing backend dependencies...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) install
	@printf "$(GREEN)✓ Backend dependencies installed$(NC)\n"

.PHONY: backend-dev bd
## backend-dev: Start backend dev server (:8081) [alias: bd]
backend-dev bd: check-backend-deps
	@printf "$(BLUE)🚀 Starting backend dev server...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run dev

.PHONY: backend-dev-watch bdw
## backend-dev-watch: Start backend with auto-reload [alias: bdw]
backend-dev-watch bdw: check-backend-deps
	@printf "$(BLUE)🚀 Starting backend dev server with auto-reload...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run dev:watch

.PHONY: backend-build bb
## backend-build: Compile TypeScript to JavaScript [alias: bb]
backend-build bb: check-backend-deps frontend-build
	@printf "$(BLUE)📝 Compiling backend TypeScript...$(NC)\n"
	@rm -rf $(DIST_DIR)
	@cd $(BACKEND_DIR) && $(NPM) run build
	@printf "$(GREEN)✓ Backend build complete$(NC)\n"

.PHONY: backend-start bs
## backend-start: Start production server [alias: bs]
backend-start bs:
	@printf "$(BLUE)🚀 Starting backend production server...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run start

.PHONY: backend-lint bl
## backend-lint: Run ESLint on backend [alias: bl]
backend-lint bl: check-backend-deps
	@printf "$(BLUE)🔍 Running backend linter...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run lint

.PHONY: backend-lint-fix blf
## backend-lint-fix: Run ESLint with auto-fix [alias: blf]
backend-lint-fix blf: check-backend-deps
	@printf "$(BLUE)🔧 Running backend linter with auto-fix...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run lint:fix
	@printf "$(GREEN)✓ Backend lint fixes applied$(NC)\n"

.PHONY: backend-watch bw
## backend-watch: Watch for file changes and rebuild [alias: bw]
backend-watch bw: check-backend-deps
	@printf "$(BLUE)👀 Watching backend for changes...$(NC)\n"
	@cd $(BACKEND_DIR) && $(TSC) --watch

.PHONY: backend-clean bc
## backend-clean: Remove backend build artifacts [alias: bc]
backend-clean bc:
	@printf "$(BLUE)🧹 Cleaning backend build artifacts...$(NC)\n"
	@rm -rf $(DIST_DIR)
	@rm -rf $(BACKEND_DIR)/coverage
	@printf "$(GREEN)✓ Backend clean complete$(NC)\n"

.PHONY: backend-clean-all bca
## backend-clean-all: Remove backend artifacts and dependencies [alias: bca]
backend-clean-all bca: backend-clean
	@printf "$(BLUE)🧹 Removing backend node_modules...$(NC)\n"
	@rm -rf $(BACKEND_DIR)/$(NODE_MODULES)
	@printf "$(GREEN)✓ Backend full clean complete$(NC)\n"

.PHONY: backend-verify bvf
## backend-verify: Run linter and type check [alias: bvf]
backend-verify bvf: backend-lint
	@printf "$(GREEN)✓ Backend verification complete$(NC)\n"

.PHONY: backend-upgrade bu
## backend-upgrade: Update backend dependencies [alias: bu]
backend-upgrade bu:
	@printf "$(BLUE)📦 Updating backend dependencies...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) update
	@printf "$(GREEN)✓ Backend dependencies updated$(NC)\n"

.PHONY: backend-outdated bo
## backend-outdated: Check for outdated backend packages [alias: bo]
backend-outdated bo:
	@printf "$(BLUE)📦 Checking for outdated backend packages...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) outdated || true

.PHONY: backend-test bt
## backend-test: Run backend tests [alias: bt]
backend-test bt: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) test
	@printf "$(GREEN)✓ Backend tests completed$(NC)\n"

.PHONY: backend-test-watch btw
## backend-test-watch: Run backend tests in watch mode [alias: btw]
backend-test-watch btw: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests in watch mode...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run test:watch

.PHONY: backend-test-coverage btc
## backend-test-coverage: Run backend tests with coverage [alias: btc]
backend-test-coverage btc: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests with coverage...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run test:coverage
	@printf "$(GREEN)✓ Coverage report generated in ./backend/coverage$(NC)\n"

.PHONY: backend-test-ci
## backend-test-ci: Run backend tests in CI mode
backend-test-ci: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests in CI mode...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run test:ci

.PHONY: backend-build-exe bbe
## backend-build-exe: Build backend executables [alias: bbe]
backend-build-exe bbe: backend-build
	@printf "$(BLUE)📦 Building backend executables...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run build:exe
	@printf "$(GREEN)✓ Backend executables built$(NC)\n"

# ------------------------------------------------------------------------------
## @Frontend Commands (React + TypeScript + Tailwind)
# ------------------------------------------------------------------------------

.PHONY: frontend-install fi
## frontend-install: Install frontend dependencies [alias: fi]
frontend-install fi: check-node
	@printf "$(BLUE)📦 Installing frontend dependencies...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) install
	@printf "$(GREEN)✓ Frontend dependencies installed$(NC)\n"

.PHONY: frontend-dev fd
## frontend-dev: Start frontend dev server (:3000) [alias: fd]
frontend-dev fd: check-frontend-deps
	@printf "$(BLUE)🚀 Starting frontend dev server...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run dev

.PHONY: frontend-build fb
## frontend-build: Build frontend for production [alias: fb]
frontend-build fb: check-frontend-deps
	@printf "$(BLUE)📝 Building frontend...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run build
	@printf "$(GREEN)✓ Frontend build complete$(NC)\n"

.PHONY: frontend-lint fl
## frontend-lint: Run frontend linter [alias: fl]
frontend-lint fl: check-frontend-deps
	@printf "$(BLUE)🔍 Running frontend linter...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run lint

.PHONY: frontend-lint-fix flf
## frontend-lint-fix: Run frontend linter with auto-fix [alias: flf]
frontend-lint-fix flf: check-frontend-deps
	@printf "$(BLUE)🔧 Running frontend linter with auto-fix...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run lint -- --fix
	@printf "$(GREEN)✓ Frontend lint fixes applied$(NC)\n"

.PHONY: frontend-clean fc
## frontend-clean: Remove frontend build artifacts [alias: fc]
frontend-clean fc:
	@printf "$(BLUE)🧹 Cleaning frontend build...$(NC)\n"
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(PUBLIC_DIR)
	@printf "$(GREEN)✓ Frontend clean complete$(NC)\n"

.PHONY: frontend-test ft
## frontend-test: Run frontend tests [alias: ft]
frontend-test ft: check-frontend-deps
	@printf "$(BLUE)🧪 Running frontend tests...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run test:run
	@printf "$(GREEN)✓ Frontend tests complete$(NC)\n"

.PHONY: frontend-test-watch ftw
## frontend-test-watch: Run frontend tests in watch mode [alias: ftw]
frontend-test-watch ftw: check-frontend-deps
	@printf "$(BLUE)🧪 Running frontend tests in watch mode...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run test

.PHONY: frontend-test-coverage ftc
## frontend-test-coverage: Run frontend tests with coverage [alias: ftc]
frontend-test-coverage ftc: check-frontend-deps
	@printf "$(BLUE)🧪 Running frontend tests with coverage...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run test:coverage
	@printf "$(GREEN)✓ Frontend coverage report generated$(NC)\n"

# ------------------------------------------------------------------------------
## @Electron Commands (Desktop App)
# ------------------------------------------------------------------------------

.PHONY: electron-install ei
## electron-install: Install Electron dependencies [alias: ei]
electron-install ei: check-node
	@printf "$(BLUE)📦 Installing Electron dependencies...$(NC)\n"
	@$(NPM) install
	@printf "$(GREEN)✓ Electron dependencies installed$(NC)\n"

.PHONY: electron-build-ts ebt
## electron-build-ts: Compile Electron TypeScript [alias: ebt]
electron-build-ts ebt: check-electron-deps
	@printf "$(BLUE)📝 Compiling Electron TypeScript...$(NC)\n"
	@$(NPM) run electron:build-ts
	@printf "$(GREEN)✓ Electron TypeScript compiled$(NC)\n"

.PHONY: electron-dev ed
## electron-dev: Build and launch Electron dev app [alias: ed]
electron-dev ed: check-electron-deps check-backend-deps build
	@printf "$(BLUE)🖥️  Launching Electron dev app...$(NC)\n"
	@$(NPM) run electron:dev

.PHONY: electron-dist edist
## electron-dist: Build distributable installers [alias: edist]
electron-dist edist: check-electron-deps check-backend-deps frontend-build bump-version-changelog
	@printf "$(BLUE)🔨 Building Electron distributables...$(NC)\n"
	@chmod +x build-exe-electron.sh
	@./build-exe-electron.sh
	@printf "$(GREEN)✓ Electron distributables built successfully$(NC)\n"

.PHONY: electron-clean ec
## electron-clean: Remove Electron build artifacts [alias: ec]
electron-clean ec:
	@printf "$(BLUE)🧹 Cleaning Electron build artifacts...$(NC)\n"
	@rm -rf $(DIST_ELECTRON_DIR)
	@rm -rf $(RELEASE_DIR)
	@printf "$(GREEN)✓ Electron clean complete$(NC)\n"

# ------------------------------------------------------------------------------
## @Version Commands
# ------------------------------------------------------------------------------

.PHONY: bump-version bv
## bump-version: Update version based on commits [alias: bv]
bump-version bv:
	@./scripts/update-version.sh

.PHONY: bump-version-changelog bvc
## bump-version-changelog: Update version and changelog [alias: bvc]
bump-version-changelog bvc:
	@./scripts/update-version.sh --changelog

.PHONY: bump-version-dry bvd
## bump-version-dry: Preview version changes without applying [alias: bvd]
bump-version-dry bvd:
	@./scripts/update-version.sh --dry-run

.PHONY: bump-version-yes bvy
## bump-version-yes: Update version without confirmation [alias: bvy]
bump-version-yes bvy:
	@./scripts/update-version.sh --yes

.PHONY: changelog cl
## changelog: Regenerate CHANGELOG.md from git tags [alias: cl]
changelog cl:
	@./scripts/update-changelog.sh

.PHONY: changelog-dry cld
## changelog-dry: Preview changelog without applying [alias: cld]
changelog-dry cld:
	@./scripts/update-changelog.sh --dry-run

# ------------------------------------------------------------------------------
## @Utility Commands
# ------------------------------------------------------------------------------

.PHONY: logs
## logs: Tail all log files (if any)
logs:
	@printf "$(BLUE)📋 Tailing logs...$(NC)\n"
	@tail -f $(BACKEND_DIR)/*.log 2>/dev/null || printf "$(YELLOW)No log files found$(NC)\n"

.PHONY: ports
## ports: Show processes using project ports (3000, 8081)
ports:
	@printf "$(BLUE)🔌 Checking ports in use...$(NC)\n"
	@printf "$(CYAN)Port 3000 (Frontend):$(NC)\n"
	@lsof -i :3000 2>/dev/null || printf "  Not in use\n"
	@printf "$(CYAN)Port 8081 (Backend):$(NC)\n"
	@lsof -i :8081 2>/dev/null || printf "  Not in use\n"

.PHONY: kill-ports kp
## kill-ports: Kill processes on project ports [alias: kp]
kill-ports kp:
	@printf "$(BLUE)🔪 Killing processes on ports 3000 and 8081...$(NC)\n"
	@lsof -ti :3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti :8081 | xargs kill -9 2>/dev/null || true
	@printf "$(GREEN)✓ Ports cleared$(NC)\n"

.PHONY: deps-check dc
## deps-check: Check all outdated dependencies [alias: dc]
deps-check dc: backend-outdated
	@printf "$(BLUE)📦 Checking frontend outdated packages...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) outdated || true
	@printf "$(BLUE)📦 Checking root outdated packages...$(NC)\n"
	@$(NPM) outdated || true

.PHONY: format fmt
## format: Run all formatters and linters with fix [alias: fmt]
format fmt: backend-lint-fix frontend-lint-fix
	@printf "$(GREEN)✓ All code formatted$(NC)\n"

# ------------------------------------------------------------------------------
# End of Makefile
# ------------------------------------------------------------------------------
