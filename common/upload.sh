#!/bin/bash
set -e

path=$1 type=$2
IFS=":" read host dir <<< "$path"
rdf="release/$type.rdf"

trap '[ $? -ne 0 ] && echo -e "Missing files; try \`make $type\x27."' EXIT
xpi=$(basename $(xmlstarlet sel -t -v "//em:updateLink" "$rdf") 2> /dev/null)
[ -f "$xpi" ] || exit 1

case $type in
  snapshot)
    ssh $host "rm -f $dir/snapshot/*.xpi"
    scp -p "$xpi" "$rdf" "$path/snapshot"
    ;;
  release)
    ssh $host "mv $dir/*.xpi $dir/archive 2> /dev/null" || true
    scp -p "$xpi" "$rdf" "$path"
esac
