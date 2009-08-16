#!/bin/sh

set -e

top=$(pwd)
type=$1
jar=$2
dirs=$3
text=$4
bin=$5
shift 5;
files="$@"

stage="$top/${jar%.*}"
mkdir -p $stage

getfiles () {
    filter="\.($(echo $1 | tr ' ' '|'))$"; shift
    find "$@" 2>/dev/null | grep -E "$filter" || true
}
copytext () {
    # Replace some things for the build, depending on filename or type
    if [ $1 = "content/NEWS" ]; then # news date
        perl -0777pi -e "s/^.*/$(date +%Y-%m-%d):/" <"$1" >"$2"
    elif [ $type = "jar" ] || [ $type = "xpi" ]; then
        sed -e "s,###VERSION###,$VERSION,g" \
            -e "s,<em:version>\([0-9a-z.]\+\)</em:version>,<em:version>$VERSION</em:version>,g" \
            -e "s,###GIT_VERSION###,$GIT_VERSION,g" \
            -e "s,###DATE###,$DATE,g" \
            <"$1" >"$2"
    elif [ $type = "mozxpi" ]; then
        sed -e "s,###VERSION###,$VERSION,g" \
            -e "s,<em:version>\([0-9a-z.]\+\)</em:version>,<em:version>$VERSION</em:version>,g" \
            -e "s,###GIT_VERSION###,$GIT_VERSION,g" \
            -e "s,###DATE###,$DATE,g" \
            -e "s,<em:updateURL>.*</em:updateURL>,,g" \
            -e "s,<em:updateKey>.*</em:updateKey>,,g" \
            <"$1" >"$2"
    elif [ $type = "nightly" ]; then
        sed -e "s,###VERSION###,$VERSION,g" \
            -e "s,<em:version>\([0-9a-z.]\+\)</em:version>,<em:version>$VERSION</em:version>,g" \
            -e "s,###GIT_VERSION###,$GIT_VERSION,g" \
            -e "s,###DATE###,$DATE,g" \
            -e "s,<em:version>\([0-9.]\+\)pre</em:version>,<em:version>\1pre$NIGHTLY_DATE</em:version>,g" \
            -e "s,<em:updateURL>.*</em:updateURL>,<em:updateURL>http://beyondboredom.net/gfox/nightly/nightly.rdf</em:updateURL>,g" \
	        -e "s,<em:updateKey>.*</em:updateKey>,<em:updateKey>$(cat $top/common/nightly.key)</em:updateKey>,g" \
            <"$1" >"$2"
    fi

    cmp -s "$1" "$2" ||
    ( echo "modified: $1"; diff -u "$1" "$2" | grep '^[-+][^-+]' )
}

for dir in $dirs; do
    for f in $(getfiles "$bin" "$dir"); do
        mkdir -p "$stage/${f%/*}"
        cp $f "$stage/$f"
    done
    for f in $(getfiles "$text" "$dir"); do
        mkdir -p "$stage/${f%/*}"
        copytext $f "$stage/$f"
    done
done
for f in $files; do
    [ -f "$f" ] && copytext "$f" "$stage/$f"
done

if [ $type = "jar" ]; then
    cd $stage && zip -r0 "$top/$jar" *
else
    cd $stage && zip -r9 "$top/$jar" *
fi
rm -rf "$stage"
