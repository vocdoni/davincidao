.PHONY: help deploy test run clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

#=============================================================================
# Help
#=============================================================================

help: ## Show this help message
	@echo -e "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo -e "$(BLUE)║          DavinciDAO - Delegation & Census System            ║$(NC)"
	@echo -e "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo -e "$(GREEN)Main Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(GREEN)Available Deployments:$(NC)"
	@if [ -d "deployments" ]; then \
		for dir in deployments/*/; do \
			if [ -d "$$dir" ]; then \
				name=$$(basename "$$dir"); \
				echo -e "  $(YELLOW)$$name$(NC)"; \
			fi \
		done \
	else \
		echo -e "  $(RED)(none found)$(NC)"; \
	fi
	@echo ""
	@echo -e "$(GREEN)Examples:$(NC)"
	@echo -e "  make deploy haberdashery      Deploy haberdashery configuration"
	@echo -e "  make test                     Run Solidity contract tests"
	@echo -e "  make run                      Start webapp development server"
	@echo ""
	@echo -e "$(GREEN)Configuration:$(NC)"
	@echo -e "  Environment variables can be set in .env file or passed interactively"
	@echo ""

#=============================================================================
# Main Deployment Pipeline
#=============================================================================

deploy: ## Complete deployment pipeline (usage: make deploy <deployment-name>)
	@if [ -z "$(filter-out deploy,$(MAKECMDGOALS))" ]; then \
		echo -e "$(RED)Error: Deployment name required$(NC)"; \
		echo -e "$(YELLOW)Usage: make deploy <deployment-name>$(NC)"; \
		echo -e "$(YELLOW)Available deployments:$(NC)"; \
		ls -1 deployments/ 2>/dev/null | grep -v '^\.' || echo "  (none found)"; \
		exit 1; \
	fi
	@deployment="$(filter-out deploy,$(MAKECMDGOALS))"; \
	if [ ! -d "deployments/$$deployment" ]; then \
		echo -e "$(RED)Error: Deployment '$$deployment' not found$(NC)"; \
		echo -e "$(YELLOW)Available deployments:$(NC)"; \
		ls -1 deployments/ 2>/dev/null | grep -v '^\.' || echo "  (none found)"; \
		exit 1; \
	fi; \
	echo -e "$(BLUE)╔══════════════════════════════════════════════════════════════╗$(NC)"; \
	echo -e "$(BLUE)║  Deploying: $$deployment$(NC)"; \
	echo -e "$(BLUE)╚══════════════════════════════════════════════════════════════╝$(NC)"; \
	echo ""; \
	./scripts/deploy.sh "$$deployment"

# Dummy targets to allow deployment names as arguments
%:
	@:

#=============================================================================
# Development Commands
#=============================================================================

test: ## Run Solidity contract tests with gas reporting
	@echo -e "$(BLUE)Running Solidity tests...$(NC)"
	@forge test --gas-report
	@echo -e "$(GREEN)✓ Tests complete$(NC)"

run: ## Start webapp development server
	@echo -e "$(BLUE)Starting webapp development server...$(NC)"
	@if [ ! -d "webapp/node_modules" ]; then \
		echo -e "$(YELLOW)Installing webapp dependencies...$(NC)"; \
		cd webapp && pnpm install; \
	fi
	@cd webapp && pnpm dev

clean: ## Clean all build artifacts
	@echo -e "$(BLUE)Cleaning build artifacts...$(NC)"
	@forge clean
	@rm -rf out cache broadcast
	@rm -f .deployment-*.env
	@echo -e "$(GREEN)✓ Clean complete$(NC)"

#=============================================================================
# Utility Commands
#=============================================================================

install: ## Install all dependencies
	@echo -e "$(BLUE)Installing dependencies...$(NC)"
	@echo -e "$(YELLOW)• Foundry contracts$(NC)"
	@forge install
	@echo -e "$(YELLOW)• Subgraph$(NC)"
	@cd subgraph && npm install
	@echo -e "$(YELLOW)• Webapp$(NC)"
	@cd webapp && pnpm install
	@echo -e "$(GREEN)✓ All dependencies installed$(NC)"

build: ## Build smart contracts
	@echo -e "$(BLUE)Building contracts...$(NC)"
	@forge build
	@echo -e "$(GREEN)✓ Build complete$(NC)"

fmt: ## Format Solidity code
	@forge fmt

verify-contract: ## Verify deployed contract (usage: make verify-contract CONTRACT=0x... CHAIN_ID=11155111)
	@if [ -z "$(CONTRACT)" ]; then \
		echo -e "$(RED)Error: CONTRACT address required$(NC)"; \
		echo "Usage: make verify-contract CONTRACT=0x... CHAIN_ID=11155111"; \
		exit 1; \
	fi
	@. ./.env && forge verify-contract $(CONTRACT) src/DavinciDao.sol:DavinciDao \
		--chain-id $${CHAIN_ID:-11155111} \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		--watch
