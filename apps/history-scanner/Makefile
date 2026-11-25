.PHONY: docker-build docker-push clean version help

SERVICE := radar-history-scanner
VERSION ?= $(shell git rev-parse HEAD 2>/dev/null || echo "dev")
REGISTRY := withobsrvr
MONOREPO_ROOT := ../..

docker-build:
	@echo "Building $(REGISTRY)/$(SERVICE):$(VERSION)"
	cd $(MONOREPO_ROOT) && docker build \
		-f apps/history-scanner/Dockerfile \
		-t $(REGISTRY)/$(SERVICE):$(VERSION) \
		.

docker-push: docker-build
	docker push $(REGISTRY)/$(SERVICE):$(VERSION)

clean:
	-docker rmi $(REGISTRY)/$(SERVICE):$(VERSION)

version:
	@echo "$(VERSION)"

help:
	@echo "docker-build  - Build image tagged with the source commit"
	@echo "docker-push   - Build and push the immutable source-commit tag"
	@echo "clean         - Remove local images"
