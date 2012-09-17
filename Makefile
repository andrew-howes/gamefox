name        = gamefox
version     = 0.8.8
url         = https://beyondboredom.net/gamefox/download
path        = beyondboredom.net:/var/www/main/gamefox/download

jar_dir     = chrome
jar         = $(jar_dir)/$(name).jar
jar_files   = content skin locale
xpi         = $(name)-$(version).xpi
xpi_files   = install.rdf chrome.manifest LICENSE defaults components
base_ver   := $(version)

-include common/Makefile.config

define build-xpi
	@common/make.sh "$(name)" "$(version)" "$(url)" "$(jar_dir)" "$(jar)" \
		"$(jar_files)" "$(xpi)" "$(xpi_files)" "$1"
endef

define upload
	@common/upload.sh "$(path)" "$1"
endef

.PHONY: preview snapshot snapshot-upload release upload amo clean help

preview: override version := $(version)pre
preview:
	$(call build-xpi,preview)

snapshot: override version := $(version)pre$(shell date +%Y%m%d)
snapshot:
	$(call build-xpi,snapshot)

snapshot-upload:
	$(call upload,snapshot)

release:
	$(call build-xpi,release)

upload:
	$(call upload,release)

amo: override xpi := $(basename $(xpi),xpi)_amo.xpi
amo:
	$(call build-xpi,amo)

help:
	@echo "name: $(name)"
	@echo "version: $(version)"
	@echo "xpi: $(xpi)"
	@echo "targets: preview, snapshot, snapshot-upload, release, upload, amo"

clean:
	rm -f "$(jar)" "$(name)"-*.xpi release/release.rdf release/snapshot.rdf
	rmdir "$(jar_dir)" release 2> /dev/null || true
