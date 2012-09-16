name 		= gamefox
version 	= 0.8.8
url 		= https://beyondboredom.net/gamefox/download

jar_dir 	= chrome
jar 		= $(jar_dir)/$(name).jar
jar_files 	= content skin locale
xpi 		= $(name)-$(version).xpi
xpi_files 	= install.rdf chrome.manifest COPYING defaults components

-include common/Makefile.config

define build-xpi
	@common/make.sh "$(name)" "$(version)" "$(url)" "$(jar_dir)" "$(jar)" \
		"$(jar_files)" "$(xpi)" "$(xpi_files)" "$1"
endef

.PHONY: preview snapshot release amo clean

preview: override version := $(version)pre
preview:
	$(call build-xpi,preview)

snapshot: override version := $(version)pre$(shell date +%Y%m%d)
snapshot:
	$(call build-xpi,snapshot)

release:
	$(call build-xpi,release)

amo: override xpi := $(basename $(xpi),xpi)_amo.xpi
amo:
	$(call build-xpi,amo)

clean:
	rm -f "$(jar)" "$(name)"-*.xpi
	rm -f release/release.rdf release/snapshot.rdf
	test ! -d "$(jar_dir)" || rmdir --ignore-fail-on-non-empty "$(jar_dir)"
	test ! -d release || rmdir --ignore-fail-on-non-empty release
