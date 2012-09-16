name 		= gamefox
version 	= 0.8.8

jar_dir 	= chrome
jar 		= $(jar_dir)/$(name).jar
jar_files 	= content skin locale
xpi 		= $(name)-$(version).xpi
xpi_files 	= install.rdf chrome.manifest COPYING defaults components

define build-xpi
	@common/make.sh "$(name)" "$(version)" "$(jar_dir)" "$(jar)" \
		"$(jar_files)" "$(xpi)" "$(xpi_files)" "$1"
endef

.PHONY: preview release amo clean

preview: version:=$(version)pre
preview:
	$(call build-xpi,preview)

release:
	$(call build-xpi,release)

amo: xpi:=$(basename $(xpi),xpi)_amo.xpi
amo:
	$(call build-xpi,amo)

clean:
	rm -f "$(jar)" "$(name)"-*.xpi
	test ! -d "$(jar_dir)" || rmdir --ignore-fail-on-non-empty "$(jar_dir)"
