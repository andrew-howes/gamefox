#!/bin/bash

XPI=$1
VERSION=$2
BASEVERSION=$3

echo

if [[ ! -d spock ]]; then
    echo "You need the spock binary in release/spock/" 1>&2
elif [[ ! -d mccoy ]]; then
    echo "You need the mccoy profile in release/mccoy/" 1>&2
else
    ./spock/spock ./update.rdf -i urn:mozilla:extension:{6dd0bdba-0a02-429e-b595-87a7dfdca7a1} \
        -d ./mccoy/ -v $VERSION -u http://beyondboredom.net/gfox/gamefox-$BASEVERSION-git.xpi \
        -f ../$XPI > nightly.rdf || exit 1

    ./put.py ../$XPI gamefox-$BASEVERSION-git-test.xpi nightly.rdf nightly-test.rdf || exit 1
fi
