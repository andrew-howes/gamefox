#!/usr/bin/python

import os
import sys
import shelve
import ConfigParser
import paramiko

class sync:
    def open_shelf(self):
        self.db = shelve.open("sync.db")

    def close_shelf(self):
        self.db.close()

    def get_file_mtimes(self):
        file_list = []

        for root, dirs, files in os.walk('.'):
            for file in files:
                path = "%s/%s" % (root, file)
                file_list.append((path, os.path.getmtime(path)))

        return file_list

    def list_changed_files(self):
        changed_files = []
        for file in self.get_file_mtimes():
            # Skip self and dotfiles
            if file[0] in ["./sync.db", "./sync.py"] \
                    or file[0].startswith("./."): continue
            
            if not self.db.has_key(file[0]) or file[1] > self.db[file[0]]:
                changed_files.append(file)
        
        return changed_files
    
    def upload(self, files):
        # connect
        config = ConfigParser.ConfigParser()
        config.read("../etc/server.conf")

        transport = paramiko.Transport((config.get("server", "host"),
            int(config.get("server", "port"))))
        transport.connect(username = config.get("server", "user"),
                password = config.get("server", "pass"))

        print "Made connection to", config.get("server", "host")

        sftp = paramiko.SFTPClient.from_transport(transport)
        sftp.chdir(config.get("server", "web_dir"))

        # update
        for file in files:
            try:
                sftp.put(file[0], file[0])
                self.db[file[0]] = file[1]
                print "Uploaded file:", file[0]
            except IOError:
                # TODO: Automatically create missing directories
                sys.stderr.write("Failed to upload file:" + file[0])

        sftp.close()
        transport.close()

if __name__ == "__main__":
    sync = sync()

    sync.open_shelf()

    print "Syncing files..."
    files = sync.list_changed_files()
    if not files:
        print "No files are out of date."
    else:
        sync.upload(files)

    sync.close_shelf()
