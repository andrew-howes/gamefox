#!/usr/bin/python

import sys
import os
import ConfigParser
import paramiko

config = ConfigParser.ConfigParser()
# TODO: This relative path is fragile
config.read("../common/server.conf")

transport = paramiko.Transport((config.get("server", "host"),
        int(config.get("server", "port"))))
transport.connect(username = config.get("server", "user"),
        password = config.get("server", "pass"))

sftp = paramiko.SFTPClient.from_transport(transport)
sftp.chdir(config.get("server", "file_dir"))

# Move old release to oldxpi
for i in sftp.listdir("."):
    if os.path.splitext(i)[1] == '.xpi' and i != sys.argv[1]:
        sftp.rename(i, "oldxpi/" + i)

# Remove old nightly
for i in sftp.listdir("nightly"):
    if os.path.splitext(i)[1] == '.xpi':
        sftp.remove("nightly/" + i)

sftp.close()
transport.close()
