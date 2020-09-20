.PHONY: build
build:
	docker build -t iidx-routine .

.PHONY: run
run: build
	docker run --rm -it --cap-add=SYS_ADMIN \
		-e TWOCAPTCHA_API_KEY \
		-e KONAMI_ID \
		-e KONAMI_PASSWORD \
		-e IST_ID \
		-e IST_PASSWORD \
		iidx-routine