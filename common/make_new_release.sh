#!/bin/sh

if make scandist | grep -q NEW
then
    make release
fi
