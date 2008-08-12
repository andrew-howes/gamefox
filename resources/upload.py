#!/usr/bin/python

import sys
import os
import sha
import re
import paramiko
paramiko.util.log_to_file('upload.log')

if len(sys.argv) < 2:
    print "upload.py gamefox.xpi [update.rdf]"
    sys.exit()

# get files
lfile = sys.argv[1]
rfile = os.path.basename(lfile)

# check to make sure the filename is in a proper format
if not re.match(r"gamefox-[0-9]+\.[0-9]+\.[0-9]+\.xpi$", rfile):
    print "xpi filename must be /gamefox-[0-9]+\.[0-9]+\.[0-9]+\.xpi/"
    sys.exit()

passwd = open("upload.passwd", "r")
credentials = passwd.readlines()
passwd.close()

host = credentials[0].strip()
port = int(credentials[1])
transport = paramiko.Transport((host, port))

username = credentials[2].strip()
password = credentials[3].strip()
transport.connect(username = username, password = password)

sftp = paramiko.SFTPClient.from_transport(transport)

print lfile, "->", rfile

# sha1sum
lsha1sum = sha.new(open(lfile).read()).hexdigest()
print "local sha1  :", lsha1sum

# put files to server
sftp.chdir("public_html/gfox")
sftp.put(lfile, rfile)

# verify the files
checkfile = "gamefox-upload-integrity-check"
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

        fcontent = re.sub("sha1:[0-9a-z]+", "sha1:" + lsha1sum, fcontent)
        fcontent = re.sub(r"gamefox-[0-9\.]+\.xpi", lfile, fcontent)
        # extract the new version number
        version = re.findall(r"[0-9]+\.[0-9]+\.[0-9]+", lfile)[0]
        fcontent = re.sub(r"<em:version>[0-9]+\.[0-9]+\.[0-9]+<\/em:version>",
                "<em:version>" + version + "</em:version>", fcontent)
        fcontent = re.sub(r"news/[0-9]+\.[0-9]+\.[0-9]+", "news/" + version, fcontent)

        w = open(updatefile + ".tmp", "w")
        w.write(fcontent)
        w.close()

        os.rename(updatefile + ".tmp", updatefile)

        print "Finished. Sign the file with McCoy."
else:
    print "!!! Uploaded file's sha1sum doesn't match"

sftp.close()
transport.close()
