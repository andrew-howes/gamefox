#!/usr/bin/python

import sys
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

for i in range(1, len(sys.argv), 2): # ./put.py localfile remotefile localfile2 remotefile2
    sftp.put(sys.argv[i], sys.argv[i+1])

sftp.close()
transport.close()
