name        = gamefox
version     = 0.8.9.1
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
	@name="$(name)" version="$(version)" url="$(url)" jar_dir="$(jar_dir)" \
		jar="$(jar)" jar_files="$(jar_files)" xpi="$(xpi)" \
		xpi_files="$(xpi_files)" type="$1" common/make.sh
endef

define upload
	@path="$(path)" type="$1" common/upload.sh
endef

.PHONY: preview snapshot snapshot-upload release upload amo help clean

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
