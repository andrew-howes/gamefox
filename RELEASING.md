Releasing a new version of GameFOX
==================================

This document goes through the steps that need to be taken for a GameFOX
maintainer to release a new stable version.

Requirements
------------

Packages needed to build, sign and upload (on Debian lenny):

* zip
* ruby
* libxslt-ruby
* libnss3-1d
* python-paramiko
* ... and dependencies

[Spock](https://github.com/bard/spock) must be installed in release/spock. The
McCoy profile must be in release/mccoy.default.

Configuration
-------------

To upload to the server, copy common/server.conf.example to common/server.conf
and edit the file to match the correct settings.

SSH is required. Local file operations are not supported yet.

Preparing for a release
-----------------------

The web change log needs to be written. Use www/changes-next.mdwn as a staging
area for the next version.

Uploading a release
-------------------

You must first build a distribution which contains the XPI, news and unsigned
release files. To do so, type

    make dist VERSION=x.y.z

where VERSION is the version of the release. This should be the current
version in git without the "pre". For example, you should use VERSION=0.7.5
if the git version is 0.7.5pre.

After inspecting and testing the distribution, upload it by typing

    make upload

This automatically does the following:

1. Uploads the XPI to $(file_dir)
2. Uploads the news to $(file_dir)/news
3. Signs the update RDF file and uploads it
4. Replaces the current changes.mdwn file on the server with the contents of
   changes-next.mdwn
5. Moves the XPI of the previous version to $(file_dir)/oldxpi
6. Deletes the current nightly XPI

What to do after a release
--------------------------

First, you should tag the git repo with the latest version number. Then you
should bump the version number in:

* Makefile
* content/NEWS
* install.rdf
* www/index.php.txt (including date and version compatibility)

You should also add the release date to the latest version in
www/changes-next.mdwn, then copy it to www/changes.mdwn.

Commit and push the updates above.

Make a release topic on Blood Money. The title should be "[release] GameFOX
x.y.z", and conform to this template:

    <b>Download:</b>

    http://link_to_xpi

    <b>Changes:</b>

    [changes for the latest version from content/NEWS or
     www/changes(-next).mdwn]

Finally, you should upload the *_amo.xpi file in the root of the git tree to
addons.mozilla.org.

Configuring a nightly build server
----------------------------------

(Not yet written.)
