#!/usr/bin/python

from xml.dom import minidom
import getopt, sys
import time

class NewsGenerator:
    def __init__(self, release, news):
        self.__dom = minidom.getDOMImplementation().createDocument(None, "html", None)
        doc = self.__dom

        doc.documentElement.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")

        doc.documentElement.appendChild(doc.createTextNode("\n    "))
        head = doc.createElement("head")
        head.appendChild(doc.createTextNode("\n        "))
        title = doc.createElement("title")
        title.appendChild(doc.createTextNode(release))
        head.appendChild(title)
        head.appendChild(doc.createTextNode("\n    "))
        doc.documentElement.appendChild(head)
        doc.documentElement.appendChild(doc.createTextNode("\n    "))

        body = doc.createElement("body")

        h2 = doc.createElement("h2")
        now = time.localtime()
        h2.appendChild(doc.createTextNode("%d-%02d-%02d" %
            (now[0], now[1], now[2])))
        body.appendChild(doc.createTextNode("\n        "))
        body.appendChild(h2)

        body.appendChild(doc.createTextNode("\n\n        "))
        for i in news:
            p = doc.createElement("p")
            p.appendChild(doc.createTextNode(i))
            body.appendChild(p)
            body.appendChild(doc.createTextNode("\n        "))

        body.appendChild(doc.createTextNode("\n    "))
        doc.documentElement.appendChild(body)
        doc.documentElement.appendChild(doc.createTextNode("\n"))

    def printXML(self):
        print self.__dom.toxml()

def main():
    try:
        opts, args = getopt.getopt(sys.argv[1:], "f:h", ["file=", "help"])
    except getopt.GetoptError, err:
        print str(err)
        usage()
        sys.exit(2)

    # opts
    file = "../content/NEWS"
    for o, a in opts:
        if o in ("-f", "--file"):
            file = a
        elif o in ("-h", "--help"):
            usage()
            sys.exit(0)
        else:
            assert False, "unhandled option"

    # args
    if len(args) == 0:
        print "must provide version number"
        sys.exit(2)
    else:
        version = args[0]

    f = open(file)
    items = []
    section = 0
    for i in f:
        i = i.strip()

        if len(i) > 2 and i[-1] == ":":
            if section == 0:
                section = 1
                continue
            else:
                break
        
        if len(i) and i[0:9] != "* version":
            if i[0] == "*":
                items.append(i[2:])
            else:
                items[-1] = items[-1] + " " + i

    news = NewsGenerator("GameFOX " + version, items)
    news.printXML()

def usage():
    print "Usage: " + sys.argv[0] + " [options] VERSION"
    print "    -f, --file FILE    file containing news"
    print "    -h, --help         print this usage information"

if __name__ == "__main__":
    main()
