#!/bin/sh

set -e

top=$(pwd)

if [ ! -f "$VERSIONFILE" ]
then
    exit 0
fi

DISTVERSION=$(cat $VERSIONFILE)
DISTDIR=$top/$(dirname $VERSIONFILE)/$DISTVERSION

if [ ! -f "$LASTVERSIONFILE" ]
then
    echo "warning: $LASTVERSIONFILE: No such file or directory"
    LASTVERSION=""
else
    LASTVERSION=$(cat $LASTVERSIONFILE)
fi

if [ ! "$DISTVERSION" = "$LASTVERSION" ]
then
    echo "NEW $DISTVERSION"
fi
