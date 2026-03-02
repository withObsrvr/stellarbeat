.PHONY: docker-build docker-push clean version help

SERVICE := radar-history-scanner
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
REGISTRY := withobsrvr
MONOREPO_ROOT := ../..

docker-build:
	@echo "Building $(REGISTRY)/$(SERVICE):$(VERSION)"
	cd $(MONOREPO_ROOT) && docker build \
		-f apps/history-scanner/Dockerfile \
		-t $(REGISTRY)/$(SERVICE):$(VERSION) \
		-t $(REGISTRY)/$(SERVICE):latest \
		.

docker-push: docker-build
	docker push $(REGISTRY)/$(SERVICE):$(VERSION)
	docker push $(REGISTRY)/$(SERVICE):latest

clean:
	-docker rmi $(REGISTRY)/$(SERVICE):$(VERSION)
	-docker rmi $(REGISTRY)/$(SERVICE):latest

version:
	@echo "$(VERSION)"

help:
	@echo "docker-build  - Build image"
	@echo "docker-push   - Build and push to registry"
	@echo "clean         - Remove local images"
