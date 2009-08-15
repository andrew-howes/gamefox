#!/bin/sh

XPI=$1
VERSION=$2
BASEVERSION=$3

SPOCK=spock
MCCOY=mccoy.nightly

echo

if [ ! -d $SPOCK ]; then
    echo "You need the spock binary in `readlink -f $SPOCK`" 1>&2
elif [ ! -d $MCCOY ]; then
    echo "You need the mccoy profile in `readlink -f $MCCOY`" 1>&2
else
    $SPOCK/spock ./update.rdf \
    -i urn:mozilla:extension:{6dd0bdba-0a02-429e-b595-87a7dfdca7a1} \
    -d $MCCOY -v $VERSION \
    -u http://beyondboredom.net/gfox/nightly/gamefox-$BASEVERSION.xpi \
    -f ../$XPI > nightly.rdf || exit 1

    ./put.py ../$XPI nightly/gamefox-$BASEVERSION.xpi \
        nightly.rdf nightly/nightly.rdf || exit 1
fi
