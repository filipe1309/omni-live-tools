.PHONY: help check-node \
        backend-install backend-dev backend-dev-watch backend-build backend-start \
        backend-lint backend-lint-fix backend-clean backend-clean-all backend-watch \
        backend-build-exe backend-verify backend-upgrade backend-outdated \
        backend-test backend-test-watch backend-test-coverage backend-test-ci \
        frontend-install frontend-dev frontend-build frontend-lint frontend-clean \
        frontend-test frontend-test-watch frontend-test-coverage \
        electron-dev electron-build-ts electron-dist electron-clean \
        version-update version-update-dry version-update-yes \
        install dev build start lint clean clean-all info test test-watch test-coverage

# Variables
NODE := node
NPM := npm
TSC := npx tsc
TS_NODE := npx ts-node
ESLINT := npx eslint

# Directories
BACKEND_DIR := backend
DIST_DIR := $(BACKEND_DIR)/dist
DIST_ELECTRON_DIR := electron/dist-electron
RELEASE_DIR := release
PUBLIC_DIR := public-react
FRONTEND_DIR := frontend
ELECTRON_DIR := electron
NODE_MODULES := node_modules

# Colors for output (using printf-compatible format)
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
CYAN := \033[0;36m
NC := \033[0m# No Color

# Default target
.DEFAULT_GOAL := help

## help: Display this help message
help:
	@printf "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)\n"
	@printf "$(BLUE)║         TikTok Chat Reader - Available Commands              ║$(NC)\n"
	@printf "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)\n"
	@printf "\n"
	@printf "$(CYAN)▸ Combined Commands (Backend + Frontend)$(NC)\n"
	@printf "  $(GREEN)install$(NC)          Install all dependencies\n"
	@printf "  $(GREEN)dev$(NC)              Start both dev servers\n"
	@printf "  $(GREEN)build$(NC)            Build both projects\n"
	@printf "  $(GREEN)start$(NC)            Build and start production\n"
	@printf "  $(GREEN)lint$(NC)             Run linters on both projects\n"
	@printf "  $(GREEN)clean$(NC)            Clean all build artifacts\n"
	@printf "  $(GREEN)clean-all$(NC)        Clean artifacts + node_modules\n"
	@printf "  $(GREEN)info$(NC)             Display project information\n"
	@printf "  $(GREEN)test$(NC)             Run all tests\n"
	@printf "  $(GREEN)test-watch$(NC)       Run tests in watch mode\n"
	@printf "  $(GREEN)test-coverage$(NC)    Run tests with coverage report\n"
	@printf "\n"
	@printf "$(CYAN)▸ Backend Commands (Node.js + TypeScript)$(NC)\n"
	@printf "  $(GREEN)backend-install$(NC)  Install backend dependencies\n"
	@printf "  $(GREEN)backend-dev$(NC)      Start backend dev server (:8081)\n"
	@printf "  $(GREEN)backend-dev-watch$(NC) Start with auto-reload\n"
	@printf "  $(GREEN)backend-build$(NC)    Compile TypeScript\n"
	@printf "  $(GREEN)backend-start$(NC)    Start production server\n"
	@printf "  $(GREEN)backend-lint$(NC)     Run ESLint\n"
	@printf "  $(GREEN)backend-lint-fix$(NC) Run ESLint with auto-fix\n"
	@printf "  $(GREEN)backend-watch$(NC)    Watch for changes\n"
	@printf "  $(GREEN)backend-clean$(NC)    Remove build artifacts\n"
	@printf "  $(GREEN)backend-clean-all$(NC) Remove artifacts + deps\n"
	@printf "  $(GREEN)backend-build-exe$(NC) Build executables\n"
	@printf "  $(GREEN)backend-verify$(NC)   Run linter + type check\n"
	@printf "  $(GREEN)backend-upgrade$(NC)  Update dependencies\n"
	@printf "  $(GREEN)backend-outdated$(NC) Check outdated packages\n"
	@printf "  $(GREEN)backend-test$(NC)     Run backend tests\n"
	@printf "  $(GREEN)backend-test-watch$(NC) Run tests in watch mode\n"
	@printf "  $(GREEN)backend-test-coverage$(NC) Run tests with coverage\n"
	@printf "\n"
	@printf "$(CYAN)▸ Frontend Commands (React + TypeScript + Tailwind)$(NC)\n"
	@printf "  $(GREEN)frontend-install$(NC) Install frontend dependencies\n"
	@printf "  $(GREEN)frontend-dev$(NC)     Start frontend dev server (:3000)\n"
	@printf "  $(GREEN)frontend-build$(NC)   Build for production\n"
	@printf "  $(GREEN)frontend-lint$(NC)    Run ESLint\n"
	@printf "  $(GREEN)frontend-clean$(NC)   Remove build artifacts\n"
	@printf "  $(GREEN)frontend-test$(NC)    Run frontend tests\n"
	@printf "  $(GREEN)frontend-test-watch$(NC) Run tests in watch mode\n"
	@printf "  $(GREEN)frontend-test-coverage$(NC) Run tests with coverage\n"
	@printf "\n"
	@printf "$(CYAN)▸ Electron Commands (Desktop App)$(NC)\n"
	@printf "  $(GREEN)electron-dev$(NC)     Build & launch Electron dev app\n"
	@printf "  $(GREEN)electron-build-ts$(NC) Compile Electron TypeScript\n"
	@printf "  $(GREEN)electron-dist$(NC)    Build distributable installers\n"
	@printf "  $(GREEN)electron-clean$(NC)   Remove Electron build artifacts\n"
	@printf "\n"
	@printf "$(CYAN)▸ Version Commands$(NC)\n"
	@printf "  $(GREEN)version-update$(NC)   Update version based on commits\n"
	@printf "  $(GREEN)version-update-dry$(NC) Preview version changes\n"
	@printf "  $(GREEN)version-update-yes$(NC) Update version (skip confirm)\n"
	@printf "\n"

# =============================================================================
# Utility Commands
# =============================================================================

## check-node: Verify Node.js version
check-node:
	@printf "$(BLUE)Checking Node.js version...$(NC)\n"
	@node_version=$$($(NODE) --version | cut -d'v' -f2 | cut -d'.' -f1); \
	if [ $$node_version -lt 18 ]; then \
		printf "$(RED)✗ Node.js version 18 or higher is required$(NC)\n"; \
		exit 1; \
	else \
		printf "$(GREEN)✓ Node.js version OK ($$($(NODE) --version))$(NC)\n"; \
	fi

check-backend-deps:
	@if [ ! -d "$(BACKEND_DIR)/$(NODE_MODULES)" ]; then \
		printf "$(YELLOW)⚠️  Backend dependencies not found. Running 'make backend-install'...$(NC)\n"; \
		$(MAKE) backend-install; \
	fi

check-electron-deps:
	@if [ ! -d "$(NODE_MODULES)" ]; then \
		printf "$(YELLOW)⚠️  Electron dependencies not found. Running 'make electron-install'...$(NC)\n"; \
		$(MAKE) electron-install; \
	fi

check-frontend-deps:
	@if [ ! -d "$(FRONTEND_DIR)/$(NODE_MODULES)" ]; then \
		printf "$(YELLOW)⚠️  Frontend dependencies not found. Running 'make frontend-install'...$(NC)\n"; \
		$(MAKE) frontend-install; \
	fi

# =============================================================================
# Combined Commands (Backend + Frontend)
# =============================================================================

## install: Install all dependencies (backend + frontend + electron)
install: backend-install frontend-install electron-install
	@printf "$(GREEN)✓ All dependencies installed$(NC)\n"

## dev: Start both backend and frontend dev servers
dev:
	@printf "$(BLUE)🚀 Starting backend and frontend servers...$(NC)\n"
	@printf "$(YELLOW)  Backend:  http://localhost:8081$(NC)\n"
	@printf "$(YELLOW)  Frontend: http://localhost:3000$(NC)\n"
	@printf "\n"
	@cd $(BACKEND_DIR) && $(NPM) run dev & cd $(FRONTEND_DIR) && $(NPM) run dev

## build: Build both backend and frontend
build: backend-build frontend-build
	@printf "$(GREEN)✓ Full build complete$(NC)\n"

## start: Build and start production
start: build backend-start

## lint: Run linters on both projects
lint: backend-lint frontend-lint
	@printf "$(GREEN)✓ All linting complete$(NC)\n"

## test: Run all tests
test: backend-test frontend-test
	@printf "$(GREEN)✓ All tests complete$(NC)\n"

## test-watch: Run tests in watch mode
test-watch: backend-test-watch frontend-test-watch

## test-coverage: Run tests with coverage report
test-coverage: backend-test-coverage frontend-test-coverage

## clean: Clean all build artifacts
clean: backend-clean frontend-clean electron-clean
	@printf "$(GREEN)✓ All clean complete$(NC)\n"

## clean-all: Clean artifacts and all node_modules
clean-all: backend-clean-all frontend-clean electron-clean
	@printf "$(BLUE)🧹 Removing frontend node_modules...$(NC)\n"
	@rm -rf $(FRONTEND_DIR)/$(NODE_MODULES)
	@printf "$(BLUE)🧹 Removing root node_modules...$(NC)\n"
	@rm -rf $(NODE_MODULES)
	@printf "$(GREEN)✓ Full clean complete$(NC)\n"

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

# =============================================================================
# Backend Commands (Node.js + TypeScript)
# =============================================================================

## backend-install: Install backend dependencies
backend-install: check-node
	@printf "$(BLUE)📦 Installing backend dependencies...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) install
	@printf "$(GREEN)✓ Backend dependencies installed$(NC)\n"

## backend-dev: Start backend dev server (port 8081)
backend-dev: check-backend-deps
	@printf "$(BLUE)🚀 Starting backend dev server...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run dev

## backend-dev-watch: Start backend dev server with auto-reload
backend-dev-watch: check-backend-deps
	@printf "$(BLUE)🚀 Starting backend dev server with auto-reload...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run dev:watch

## backend-build: Compile TypeScript to JavaScript
backend-build: check-backend-deps frontend-build
	@printf "$(BLUE)📝 Compiling backend TypeScript...$(NC)\n"
	@rm -rf $(DIST_DIR)
	@cd $(BACKEND_DIR) && $(NPM) run build
	@printf "$(GREEN)✓ Backend build complete$(NC)\n"

## backend-start: Start production server
backend-start:
	@printf "$(BLUE)🚀 Starting backend production server...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run start

## backend-lint: Run ESLint on backend
backend-lint: check-backend-deps
	@printf "$(BLUE)🔍 Running backend linter...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run lint

## backend-lint-fix: Run ESLint with auto-fix on backend
backend-lint-fix: check-backend-deps
	@printf "$(BLUE)🔧 Running backend linter with auto-fix...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run lint:fix
	@printf "$(GREEN)✓ Backend lint fixes applied$(NC)\n"

## backend-watch: Watch for file changes and rebuild
backend-watch: check-backend-deps
	@printf "$(BLUE)👀 Watching backend for changes...$(NC)\n"
	@cd $(BACKEND_DIR) && $(TSC) --watch

## backend-clean: Remove backend build artifacts
backend-clean:
	@printf "$(BLUE)🧹 Cleaning backend build artifacts...$(NC)\n"
	@rm -rf $(DIST_DIR)
	@rm -rf $(BACKEND_DIR)/coverage
	@printf "$(GREEN)✓ Backend clean complete$(NC)\n"

## backend-clean-all: Remove backend build artifacts and dependencies
backend-clean-all: backend-clean
	@printf "$(BLUE)🧹 Removing backend node_modules...$(NC)\n"
	@rm -rf $(BACKEND_DIR)/$(NODE_MODULES)
	@printf "$(GREEN)✓ Backend full clean complete$(NC)\n"

## backend-verify: Run linter and type check
backend-verify: backend-lint
	@printf "$(GREEN)✓ Backend verification complete$(NC)\n"

## backend-upgrade: Update backend dependencies
backend-upgrade:
	@printf "$(BLUE)📦 Updating backend dependencies...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) update
	@printf "$(GREEN)✓ Backend dependencies updated$(NC)\n"

## backend-outdated: Check for outdated backend packages
backend-outdated:
	@printf "$(BLUE)📦 Checking for outdated backend packages...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) outdated || true

## backend-test: Run backend tests
backend-test: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) test
	@printf "$(GREEN)✓ Backend tests completed$(NC)\n"

## backend-test-watch: Run backend tests in watch mode
backend-test-watch: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests in watch mode...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run test:watch

## backend-test-coverage: Run backend tests with coverage report
backend-test-coverage: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests with coverage...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run test:coverage
	@printf "$(GREEN)✓ Coverage report generated in ./backend/coverage$(NC)\n"

## backend-test-ci: Run backend tests in CI mode
backend-test-ci: check-backend-deps
	@printf "$(BLUE)🧪 Running backend tests in CI mode...$(NC)\n"
	@cd $(BACKEND_DIR) && $(NPM) run test:ci

# =============================================================================
# Frontend Commands (React + TypeScript + Tailwind)
# =============================================================================

## frontend-install: Install frontend dependencies
frontend-install: check-node
	@printf "$(BLUE)📦 Installing frontend dependencies...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) install
	@printf "$(GREEN)✓ Frontend dependencies installed$(NC)\n"

## frontend-dev: Start frontend dev server (port 3000)
frontend-dev: check-frontend-deps
	@printf "$(BLUE)🚀 Starting frontend dev server...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run dev

## frontend-build: Build frontend for production
frontend-build: check-frontend-deps
	@printf "$(BLUE)📝 Building frontend...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run build
	@printf "$(GREEN)✓ Frontend build complete$(NC)\n"

## frontend-lint: Run frontend linter
frontend-lint: check-frontend-deps
	@printf "$(BLUE)🔍 Running frontend linter...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run lint

## frontend-clean: Remove frontend build artifacts
frontend-clean:
	@printf "$(BLUE)🧹 Cleaning frontend build...$(NC)\n"
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf public-react
	@printf "$(GREEN)✓ Frontend clean complete$(NC)\n"

## frontend-test: Run frontend tests
frontend-test: check-frontend-deps
	@printf "$(BLUE)🧪 Running frontend tests...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run test:run
	@printf "$(GREEN)✓ Frontend tests complete$(NC)\n"

## frontend-test-watch: Run frontend tests in watch mode
frontend-test-watch: check-frontend-deps
	@printf "$(BLUE)🧪 Running frontend tests in watch mode...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run test

## frontend-test-coverage: Run frontend tests with coverage report
frontend-test-coverage: check-frontend-deps
	@printf "$(BLUE)🧪 Running frontend tests with coverage...$(NC)\n"
	@cd $(FRONTEND_DIR) && $(NPM) run test:coverage
	@printf "$(GREEN)✓ Frontend coverage report generated$(NC)\n"

# =============================================================================
# Electron Commands (Desktop App)
# =============================================================================

## electron-install: Install Electron dependencies
electron-install: check-node
	@printf "$(BLUE)📦 Installing Electron dependencies...$(NC)\n"
	@$(NPM) install
	@printf "$(GREEN)✓ Electron dependencies installed$(NC)\n"

## electron-build-ts: Compile Electron TypeScript
electron-build-ts: check-electron-deps
	@printf "$(BLUE)📝 Compiling Electron TypeScript...$(NC)\n"
	@$(NPM) run electron:build-ts
	@printf "$(GREEN)✓ Electron TypeScript compiled$(NC)\n"

## electron-dev: Build backend + Electron and launch the desktop app
electron-dev: check-electron-deps check-backend-deps build
	@printf "$(BLUE)🖥️  Launching Electron dev app...$(NC)\n"
	@$(NPM) run electron:dev

## electron-dist: Build distributable Electron installers (.dmg, .exe, etc.)
electron-dist: check-electron-deps check-backend-deps frontend-build version-update
	@printf "$(BLUE)🔨 Building Electron distributables...$(NC)\n"
	@chmod +x build-exe-electron.sh
	@./build-exe-electron.sh
	@printf "$(GREEN)✓ Electron distributables built successfully$(NC)\n"

## electron-clean: Remove Electron build artifacts
electron-clean:
	@printf "$(BLUE)🧹 Cleaning Electron build artifacts...$(NC)\n"
	@rm -rf $(DIST_ELECTRON_DIR)
	@rm -rf $(RELEASE_DIR)
	@printf "$(GREEN)✓ Electron clean complete$(NC)\n"

# =============================================================================
# Version Commands
# =============================================================================

## bump-version: Update package version based on commits (with confirmation)
bv: 
bump-version:
	@./scripts/update-version.sh

## bump-version-dry: Preview version changes without applying
bv-dry:
bump-version-dry:
	@./scripts/update-version.sh --dry-run

## bump-version-yes: Update version without confirmation prompt
bv-yes:
bump-version-yes:
	@./scripts/update-version.sh --yes
