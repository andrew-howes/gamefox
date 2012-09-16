Releasing a new version of GameFOX
==================================

This document goes through the steps that need to be taken for a GameFOX
maintainer to release a new stable version.

Requirements
------------

* bash
* OpenSSH
* XMLStarlet (>= 1.3.1)
* Zip

Configuration
-------------

If you're hosting GameFOX on a different server, you should override/replace
the `url` and `path` variables in the makefile (either directly or by creating
the file common/Makefile.config), and the `em:updateURL` element in
install.rdf. The server will need to support HTTPS if you want to do
self-hosted automatic updates.

Otherwise, everything should already be configured to connect to the server via
SSH.

Preparing for a release
-----------------------

The web change log needs to be written. Use www/changes-next.md as a staging
area for the next version.

Uploading a release
-------------------

First, build release XPIs for self-hosting and Mozilla Addons:

    make release amo

Test the XPIs to make sure they're working. When everything checks out, upload
them:

    make upload

This automatically moves the old release into the archive folder on the server
and uploads the new XPI and update RDF files.

For Mozilla Addons, you'll need to submit the `*_amo.xpi` file manually.

What to do after a release
--------------------------

First, you should tag the git repo with the latest version number. Then you
should bump the version number in:

* Makefile
* content/NEWS
* install.rdf
* www/index.md (including date and version compatibility)

You should also add the release date to the latest version in
www/changes-next.md, then copy it to www/changes.md.

Commit and push the updates above.

Make a release topic on Blood Money. The title should be "[release] GameFOX
x.y.z", and conform to this template:

    <b>Download:</b>

    http://link_to_xpi

    <b>Changes:</b>

    [changes for the latest version from content/NEWS or www/changes(-next).md]

Configuring a nightly build server
----------------------------------

(Not yet written.)
