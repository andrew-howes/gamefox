#!/bin/bash
set -eu

tmp=$(mktemp -d ./tmpXXXXXX)
trap "rm -rf '$tmp'" EXIT

jar() {
    local tmp_jar="$tmp/jar"
    mkdir "$tmp_jar"
    cp -a $jar_files "$tmp_jar"
    mkdir -p "$tmp/$jar_dir"
    (cd "$tmp_jar" &&
        sed -i -e "1s/^.*/$(date +%Y-%m-%d):/" content/NEWS &&
        zip -r0q "../$jar" $jar_files
    )
}

xpi() {
    cp -a $xpi_files "$tmp"
    (cd "$tmp" &&
        sed -i '' -Ee "s, (content|skin|locale)/, jar:$jar\!/\1/," \
            chrome.manifest &&
#        xmlstarlet ed -P -L -u "//em:version" -v "$version" install.rdf &&

#        case "$type" in
#          amo)
#            xmlstarlet ed -P -L -d "//em:updateURL" install.rdf
#            ;;
#          snapshot)
#            xmlstarlet ed -P -L -u "//em:updateURL" -v \
#                "$url/snapshot/snapshot.rdf" install.rdf
#        esac &&

        zip -r9q "$xpi" "$jar_dir" $xpi_files
    )
    mv "$tmp/$xpi" .

    echo "Done: $xpi ($(du -kh "$xpi" | cut -f1))"
}

#update_rdf() {
#    if [[ "$type" =~ ^(snapshot|release)$ ]]; then
#        local rdf="release/$type.rdf"
#        local hash="sha256:$(sha256sum "$xpi" | cut -d' ' -f1)"
#        local updatelink=$([ "$type" == "snapshot" ] &&
#            echo "$url/snapshot/$xpi" || echo "$url/$xpi")
#        mkdir -p release
#        xmlstarlet ed -P -u "//em:version" -v "$version" -u "//em:updateLink" \
#            -v "$updatelink" -u "//em:updateHash" -v "$hash" \
#            common/update.rdf > "$rdf"

#        echo "      $rdf"
#    fi
#}

jar; xpi #; update_rdf
