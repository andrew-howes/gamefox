#!/bin/sh

set -e

top=$(pwd)

DISTVERSION=$(cat $VERSIONFILE)
DISTDIR=$top/$(dirname $VERSIONFILE)/$DISTVERSION

XPI=$DISTDIR/*.xpi
XPI_NAME=$(basename $DISTDIR/*.xpi)

NEWS=$DISTDIR/news.xhtml
NEWS_VER=$DISTVERSION.xhtml

RDF=$DISTDIR/release.rdf
SIGNED_RDF=$DISTDIR/signed.rdf
RDF_NAME=$(basename $RDF)

SPOCK=$top/release/spock
MCCOY=$top/release/mccoy.default
PUT=$top/release/put.py
CLEANUP=$top/release/cleanup_old_release.py

if [ ! -d $SPOCK ]; then
    echo "You need the spock binary in `readlink -f $SPOCK`" 1>&2
    exit 1
elif [ ! -d $MCCOY ]; then
    echo "You need the mccoy profile in `readlink -f $MCCOY`" 1>&2
    exit 1
fi

# TODO: This is duplicated in mknightly.sh
$SPOCK/spock $RDF \
    -i urn:mozilla:extension:{6dd0bdba-0a02-429e-b595-87a7dfdca7a1} \
    -d $MCCOY -v $DISTVERSION \
    -u http://beyondboredom.net/gfox/gamefox-$DISTVERSION.xpi \
    -f $XPI > $SIGNED_RDF

(cd release && $PUT $XPI $XPI_NAME  $NEWS news/$NEWS_VER  $SIGNED_RDF $RDF_NAME)

# Clean up old release and nightly XPIs
(cd release && $CLEANUP $XPI_NAME)

# Mark this release as done
echo $DISTVERSION > $LASTVERSIONFILE
