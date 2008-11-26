#!/usr/bin/python

from xml.dom import minidom
import getopt, sys

class ReleaseGenerator:
    def __init__(self, file = "update.rdf"):
        self.__dom = minidom.parse(file)

    def changeDOM(self):
        for i in self.__dom.getElementsByTagName("em:version"):
            i.appendChild(self.__dom.createTextNode(self.__version))

        for i in self.__dom.getElementsByTagName("em:updateLink"):
            i.appendChild(self.__dom.createTextNode(self.__updateLink))

        for i in self.__dom.getElementsByTagName("em:updateHash"):
            i.appendChild(self.__dom.createTextNode(self.__updateHash))

        # All this is because spock breaks when em:updateInfoURL elements
        # are present. Bah.
        for i in self.__dom.getElementsByTagName("em:targetApplication"):
            for j in i.getElementsByTagName("RDF:Description"):
                updateInfoURL = j.appendChild(self.__dom.createElement("em:updateInfoURL"))
                updateInfoURL.appendChild(self.__dom.createTextNode(self.__updateInfoURL))

                j.appendChild(self.__dom.createTextNode("    "))
                j.appendChild(updateInfoURL)
                j.appendChild(self.__dom.createTextNode("\n                            "))

    def printXML(self):
        print self.__dom.toxml()

    def setVersion(self, version):
        self.__version = version

    def setUpdateLink(self, link):
        self.__updateLink = link

    def setUpdateHash(self, hash):
        self.__updateHash = hash

    def setUpdateInfoURL(self, url):
        self.__updateInfoURL = url

def main():
    try:
        opts, args = getopt.getopt(sys.argv[1:], "x:b:n:h",
                ["xpi=", "base-uri=", "hash=", "news-dir=", "help"])
    except getopt.GetoptError, err:
        print str(err)
        usage()
        sys.exit(2)

    if len(args) > 0:
        version = args[0]
    else:
        version = ""

    xpi = "gamefox-" + version + ".xpi"
    baseURI = "http://beyondboredom.net/gfox/"
    newsDir = "news/"
    hash = ""
    for o, a in opts:
       if o in ("-x", "--xpi"):
           xpi = a
       elif o in ("-b", "--base-uri"):
           baseURI = a
       elif o in ("-h", "--help"):
           usage()
           sys.exit(0)
       elif o == "--hash":
           hash = a
       elif o in ("-n", "--news-dir"):
           newsDir = a
       else:
            assert False, "unhandled option"

    if version == "":
        print "must provide version number"
        sys.exit(2)

    release = ReleaseGenerator()

    release.setVersion(version)
    release.setUpdateLink(baseURI + xpi)
    release.setUpdateHash(hash)
    release.setUpdateInfoURL(baseURI + newsDir + version + ".xhtml")

    release.changeDOM()
    release.printXML()

def usage():
    print "Usage: " + sys.argv[0] + " [options] VERSION"
    print "    -x, --xpi XPI         name of the XPI"
    print "    --hash HASH           hash of the XPI"
    print "    -b, --base-uri URI    base URI of resources"
    print "    -n, --news-dir DIR    directory for release news"
    print "    -h, --help            print this usage information"

if __name__ == "__main__":
    main()
