.PHONY: help check-tools clean build test test-verbose test-gas \
        deploy-contract deploy-subgraph deploy-all update-webapp-env \
        subgraph-build subgraph-codegen subgraph-test \
        webapp-install webapp-dev webapp-build \
        delegation-tool-build delegation-tool-test \
        fmt lint snapshot coverage \
        install all

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

#=============================================================================
# Help
#=============================================================================

help: ## Show this help message
	@echo -e "$(BLUE)DavinciDao Project Makefile$(NC)"
	@echo ""
	@echo -e "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo -e "$(GREEN)Environment:$(NC)"
	@echo "  Set configuration in .env file"
	@echo ""

#=============================================================================
# Setup and Validation
#=============================================================================

check-tools: ## Check if all required tools are installed
	@./scripts/check-tools.sh

install: ## Install all dependencies (contract, subgraph, webapp)
	@echo -e "$(BLUE)Installing Foundry dependencies...$(NC)"
	@forge install
	@echo -e "$(BLUE)Installing subgraph dependencies...$(NC)"
	@cd subgraph && npm install
	@echo -e "$(BLUE)Installing webapp dependencies...$(NC)"
	@cd webapp && pnpm install
	@echo -e "$(GREEN)✓ All dependencies installed$(NC)"

#=============================================================================
# Smart Contract Tasks
#=============================================================================

clean: ## Clean build artifacts
	@echo -e "$(BLUE)Cleaning build artifacts...$(NC)"
	@forge clean
	@rm -rf out cache broadcast
	@echo -e "$(GREEN)✓ Clean complete$(NC)"

build: ## Build the smart contracts
	@echo -e "$(BLUE)Building contracts...$(NC)"
	@forge build
	@echo -e "$(GREEN)✓ Build complete$(NC)"

test: ## Run contract tests
	@echo -e "$(BLUE)Running tests...$(NC)"
	@forge test

test-verbose: ## Run contract tests with verbose output
	@forge test -vvv

test-gas: ## Run contract tests with gas reporting
	@forge test --gas-report

snapshot: ## Create gas snapshot
	@forge snapshot

coverage: ## Generate test coverage report
	@forge coverage

fmt: ## Format Solidity code
	@forge fmt

lint: ## Lint Solidity code (requires solhint)
	@if command -v solhint >/dev/null 2>&1; then \
		solhint 'src/**/*.sol' 'script/**/*.sol' 'test/**/*.sol'; \
	else \
		echo -e "$(YELLOW)solhint not installed. Install with: npm install -g solhint$(NC)"; \
	fi

#=============================================================================
# Deployment Tasks
#=============================================================================

deploy-contract: check-tools ## Deploy the DavinciDao contract
	@./scripts/deploy-contract.sh

update-webapp-env: ## Update webapp .env with contract address (usage: make update-webapp-env CONTRACT=0x...)
	@./scripts/update-webapp-env.sh $(CONTRACT)

deploy-subgraph: ## Build and prepare subgraph for deployment
	@./scripts/deploy-subgraph.sh $(CONTRACT)

deploy-all: ## Complete deployment pipeline (test, deploy, configure)
	@./scripts/deploy-all.sh

#=============================================================================
# Subgraph Tasks
#=============================================================================

subgraph-codegen: ## Generate subgraph types
	@echo -e "$(BLUE)Generating subgraph types...$(NC)"
	@cd subgraph && graph codegen
	@echo -e "$(GREEN)✓ Codegen complete$(NC)"

subgraph-build: ## Build subgraph
	@echo -e "$(BLUE)Building subgraph...$(NC)"
	@cd subgraph && graph build
	@echo -e "$(GREEN)✓ Subgraph build complete$(NC)"

subgraph-test: ## Run subgraph tests
	@echo -e "$(BLUE)Running subgraph tests...$(NC)"
	@cd subgraph && npm test

#=============================================================================
# Webapp Tasks
#=============================================================================

webapp-install: ## Install webapp dependencies
	@echo -e "$(BLUE)Installing webapp dependencies...$(NC)"
	@cd webapp && pnpm install
	@echo -e "$(GREEN)✓ Webapp dependencies installed$(NC)"

webapp-dev: ## Start webapp development server
	@echo -e "$(BLUE)Starting webapp dev server...$(NC)"
	@cd webapp && pnpm dev

webapp-build: ## Build webapp for production
	@echo -e "$(BLUE)Building webapp...$(NC)"
	@cd webapp && pnpm build
	@echo -e "$(GREEN)✓ Webapp build complete$(NC)"

webapp-preview: ## Preview production webapp build
	@cd webapp && pnpm preview

webapp-lint: ## Lint webapp code
	@cd webapp && pnpm lint

webapp-format: ## Format webapp code
	@cd webapp && pnpm format

#=============================================================================
# Delegation Tool Tasks
#=============================================================================

delegation-tool-build: ## Build delegation tool
	@echo -e "$(BLUE)Building delegation tool...$(NC)"
	@cd delegation-tool && go build -o bin/delegate ./cmd/delegate
	@echo -e "$(GREEN)✓ Delegation tool built$(NC)"

delegation-tool-test: ## Test delegation tool
	@echo -e "$(BLUE)Testing delegation tool...$(NC)"
	@cd delegation-tool && go test ./...
	@echo -e "$(GREEN)✓ Tests passed$(NC)"

#=============================================================================
# Development Utilities
#=============================================================================

logs: ## Show recent deployment logs
	@if [ -f deploy.log ]; then \
		tail -100 deploy.log; \
	else \
		echo -e "$(YELLOW)No deploy.log found$(NC)"; \
	fi

contract-info: ## Show deployed contract information
	@if [ -f .last_deployed_contract ]; then \
		echo -e "$(GREEN)Last deployed contract:$(NC)"; \
		cat .last_deployed_contract; \
		echo ""; \
	else \
		echo -e "$(YELLOW)No deployment info found$(NC)"; \
	fi

verify-contract: ## Verify contract on Etherscan (usage: make verify-contract CONTRACT=0x...)
	@if [ -z "$(CONTRACT)" ]; then \
		echo -e "$(RED)Error: CONTRACT address required$(NC)"; \
		echo "Usage: make verify-contract CONTRACT=0x..."; \
		exit 1; \
	fi
	@. ./.env && forge verify-contract $(CONTRACT) src/DavinciDao.sol:DavinciDao \
		--chain-id 11155111 \
		--etherscan-api-key $$ETHERSCAN_API_KEY

watch: ## Watch and rebuild on file changes
	@echo -e "$(BLUE)Watching for changes...$(NC)"
	@forge build --watch

#=============================================================================
# Combined Tasks
#=============================================================================

all: clean install build test ## Clean, install, build, and test everything
	@echo -e "$(GREEN)✓ All tasks completed successfully$(NC)"

fresh-start: clean install build test deploy-all ## Complete fresh setup and deployment
	@echo -e "$(GREEN)✓ Fresh start complete!$(NC)"

#=============================================================================
# Docker Tasks (if needed in future)
#=============================================================================

docker-build: ## Build Docker image (placeholder)
	@echo -e "$(YELLOW)Docker support not yet implemented$(NC)"

docker-run: ## Run in Docker (placeholder)
	@echo -e "$(YELLOW)Docker support not yet implemented$(NC)"
