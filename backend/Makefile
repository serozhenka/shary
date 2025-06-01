.PHONY: run test test-coverage
run:
	go run cmd/main.go

test:
	go test ./tests/...

test-coverage:
	go test -coverprofile=coverage.out ./tests/... -coverpkg=./internal/...
	go tool cover -html=coverage.out -o coverage.html
