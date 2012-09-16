#!/bin/bash
set -e

name=$1 version=$2 jar_dir=$3 jar=$4 jar_files=$5 xpi=$6 xpi_files=$7 type=$8
tmp=$(mktemp -d)
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
        sed -i -re "s, (content|skin|locale)/, jar:$jar\!/\1/," \
            chrome.manifest &&
        xmlstarlet ed -P -L -u "//em:version" -v "$version" install.rdf &&
        if [ "$type" = "amo" ]; then
            xmlstarlet ed -P -L -d "//em:updateURL" install.rdf
        fi &&
        zip -r9q "$xpi" "$jar_dir" $xpi_files
    )
    mv "$tmp/$xpi" .
}

jar; xpi
echo "Done: $xpi ($(du -bh "$xpi" | cut -f1))"
