#!/usr/bin/python

import sys
import os
import sha
import re
import ConfigParser
import paramiko

if len(sys.argv) < 2:
    print "upload.py gamefox-n.n.n.xpi [update.rdf]"
    sys.exit()

versionRegex = r"[0-9]+\.[0-9]+\.[0-9]+"
xpiFilenameRegex = r"gamefox-" + versionRegex + r"\.xpi"
checkfile = "gamefox-xpi-integrity-check"

# get files
lfile = sys.argv[1]
rfile = os.path.basename(lfile)

# check to make sure the filename is in a proper format
if not re.match(xpiFilenameRegex + "$", rfile):
    print "xpi filename must be gamefox-0.0.0.xpi"
    sys.exit()

config = ConfigParser.ConfigParser()
config.read("server.conf")

transport = paramiko.Transport((config.get("server", "host"),
    int(config.get("server", "port"))))

transport.connect(username = config.get("server", "user"),
        password = config.get("server", "pass"))

sftp = paramiko.SFTPClient.from_transport(transport)

print lfile, "->", rfile

# sha1sum
lsha1sum = sha.new(open(lfile).read()).hexdigest()
print "local sha1  :", lsha1sum

# put files to server
sftp.chdir(config.get("server", "dir"))
sftp.put(lfile, rfile)

# verify the files
os.system("wget -q -O " + checkfile + " http://beyondboredom.net/gfox/" + rfile)
rsha1sum = sha.new(open(checkfile).read()).hexdigest()
os.system("rm -f " + checkfile)
print "remote sha1 :", rsha1sum

if lsha1sum == rsha1sum:
    print "File uploaded and verified successfully."
    if len(sys.argv) > 2: # update the stuff in an RDF file
        updatefile = sys.argv[2]
        print
        print "Updating", updatefile, "..."

        f = open(updatefile, "r")
        fcontent = f.read()
        f.close()

        fcontent = re.sub("sha1:[0-9a-z]+", "sha1:" + rsha1sum, fcontent)
        fcontent = re.sub(xpiFilenameRegex, rfile, fcontent)
        # extract the new version number
        version = re.findall(versionRegex, rfile)[0]
        fcontent = re.sub(r"<em:version>" + versionRegex + r"<\/em:version>",
                "<em:version>" + version + "</em:version>", fcontent)
        fcontent = re.sub(r"news/" + versionRegex, "news/" + version, fcontent)

        w = open(updatefile + ".tmp", "w")
        w.write(fcontent)
        w.close()

        os.rename(updatefile + ".tmp", updatefile)

        print "Finished. Sign the file with McCoy."
else:
    print "!!! Uploaded file's sha1sum doesn't match"

sftp.close()
transport.close()