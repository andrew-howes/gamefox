#!/bin/sh

set -e

top=$(pwd)

echo
echo "*****************************************************"
echo

if [ ! -z `echo $VERSION | grep pre` ]; then
    nopre=`echo $VERSION | sed -e "s/pre//"`
    echo "The version number ($VERSION) indicates that this is a pre-release"
    echo "build. Use a version number without 'pre' in it to build a dist."
    echo
    echo "Try 'make dist VERSION=$nopre'"
    exit 1
fi

cd releasef
./mkrelease.py -x "$XPI_NAME.xpi" \
    --hash "sha1:$(sha1sum $top/$XPI |cut -d ' ' -f 1)" \
    $VERSION > release.rdf
./mknews.py $VERSION > news.xhtml
cd ..

mkdir $DISTDIR
cp release/release.rdf release/news.xhtml $XPI \
    $DISTDIR

echo "Release files are now in $DISTDIR. You should inspect them"
echo "first, then 'git add' the directory, commit and push."
echo
echo "An XPI for AMO has also been built at $MOZXPI."
echo "You should upload that to AMO as well."
