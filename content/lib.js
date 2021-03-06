/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011, 2012
 * Brian Marshall, Michael Ryan, Andrianto Effendy
 *
 * This file is part of GameFOX.
 *
 * GameFOX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * GameFOX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GameFOX.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Common low level, foundational items
 * @namespace
 */
var gamefox_lib =
{
  extensionID: '{6dd0bdba-0a02-429e-b595-87a7dfdca7a1}',
  get domain()
  {
    return this.useBeta ? 'http://beta.gamefaqs.com' :
      'http://www.gamefaqs.com';
  },
  path: '/boards/',
  cookieHost: '.gamefaqs.com',
  get useBeta() { return this.prefs.getBoolPref('useBeta'); },
  set useBeta(val) { this.prefs.setBoolPref('useBeta', val); },

  prefs: Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService)
    .getBranch('gamefox.'),

  timer: Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer),

  get version()
  {
    return this.prefs.getCharPref('version');
  },

  set version(v)
  {
    this.prefs.setCharPref('version', v);
  },

  isDev: function(v)
  {
    if (v == undefined)
      v = this.version;
    return v.indexOf('pre') != -1;
  },

  isNightly: function(v)
  {
    if (v == undefined)
      v = this.version;
    return this.isDev(v) && v.indexOf('pre') < v.length - 3;
  },

  getNightlyDate: function(v)
  {
    if (!this.isNightly()) return;
    if (v == undefined)
      v = this.version;
    return v.substr(v.indexOf('pre') + 3);
  },

  getNightlyFormattedDate: function()
  {
    var d = this.getNightlyDate();
    return new Date(d.substr(0, 4), (d.substr(4, 2) - 1), d.substr(6, 2))
      .toLocaleFormat('%Y %b %d');
  },

  getString: function(pref, prefService)
  {
    return (prefService || gamefox_lib.prefs)
      .getComplexValue(pref, Ci.nsISupportsString).data;
  },

  setString: function(pref, str, prefService)
  {
    var ustr = Cc['@mozilla.org/supports-string;1']
      .createInstance(Ci.nsISupportsString);
    ustr.data = str;
    (prefService || gamefox_lib.prefs)
      .setComplexValue(pref, Ci.nsISupportsString, ustr);
  },

  log: function(msg, verbosity)
  {
    if (!verbosity)
      verbosity = 1;

    var maxVerbosity = gamefox_lib.prefs.getIntPref('logging.verbosity');
    if (verbosity > maxVerbosity)
      return;

    Cc['@mozilla.org/consoleservice;1']
      .getService(Ci.nsIConsoleService)
      .logStringMessage('GameFOX [' + verbosity + ']: ' + msg);
  },

  alert: function(msg)
  {
    Cc['@mozilla.org/embedcomp/prompt-service;1']
      .getService(Ci.nsIPromptService)
      .alert(null, 'GameFOX', msg);
  },

  confirm: function(msg)
  {
    return Cc['@mozilla.org/embedcomp/prompt-service;1']
      .getService(Ci.nsIPromptService)
      .confirm(null, 'GameFOX', msg);
  },

  getDocument: function(obj)
  {
    return (obj.target && obj.target.ownerDocument) ? obj.target.ownerDocument
      : obj.originalTarget || obj.ownerDocument || obj;
  },

  /*
     Facts, based on Firefox 2:
     - Host name normally can be fetched from document.location.host,
       document.location.hostname, and document.domain properties, as string.
     - If the page uses system protocol (e.g. about:<something>), then it might
       not have document.location.host and document.location.hostname
       properties, but it still has document.domain property whose content is
       null.
     - chrome: pages throw an exception when accessing document.domain.
     - For normal page, if it is not loaded successfully and therefore Firefox
       displays its custom warning page (e.g. Server not found), then its
       document.location.host and document.location.hostname properties remain
       pointing to the original URI, but its document.domain property content
       will be null.
   */
  onGF: function(doc)
  {
    try
    {
      return /(^|\.)gamefaqs\.com$/.test(doc.domain);
    }
    catch (e)
    {
      return false;
    }
  },

  onBeta: function(doc)
  {
    try
    {
      return /^beta\.gamefaqs\.com$/.test(doc.domain);
    }
    catch (e)
    {
      return false;
    }
  },

  onBoards: function(doc)
  {
    return gamefox_lib.onGF(doc) && /^\/boards(\/|$|\?)/.test(doc.location.pathname);
  },

  onPage: function(doc, page)
  {
    if (doc.gamefox.pageType)
      return doc.gamefox.pageType.indexOf(page) != -1;

    var contentDiv = doc.getElementById('content');

    // pageType is an array because of overlapping pages, e.g. message detail and messages
    switch (page)
    {
      case 'index':
        var div = doc.getElementsByTagName('aside')[0]; 
        //doc.getElementById('side_col');
        if (div)
        {
          var bi = doc.evaluate('div[@class="pod"]/div[@class="head"]/h2', div,
              null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (bi && bi.textContent == 'Board Information'
              && !gamefox_lib.onPage(doc, 'tracked'))
          {
            doc.gamefox.pageType = gamefox_lib.onPage(doc, 'boardlist') ?
              ['index', 'boardlist'] : ['index'];
            return true;
          }
        }
        return false;

      case 'topics':
        if (gamefox_lib.onPage(doc, 'tracked'))
        {
          doc.gamefox.pageType = ['topics', 'tracked'];
          return true;
        }

        // Check if there is a topic search form, but make sure there's no
        // "Topic List" link (the user panel will contain a search form even on
        // message lists)
        if (contentDiv.querySelector('table.topics.board.tlist'))
        {
          doc.gamefox.pageType = ['topics'];
          return true;
        }

        return false;

      case 'messages':
        var leftMsg = gamefox_utils.getMsgDataDisplay(doc);
        if(leftMsg)
        {
        	var table = doc.evaluate('.//div[@class="body"]/' +
            'table[@class="board message msg"]', contentDiv, null,
             XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }else{
        	var table = doc.evaluate('.//div[@class="body"]/' +
            'table[@class="board message"]', contentDiv, null, 
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
        if (table && !gamefox_lib.onPage(doc, 'usernote'))
        {
          var boards = doc.evaluate('.//div[@class="board_nav"]//a[contains(.,'
            + '"Message List")]', contentDiv, null, XPathResult
              .ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (boards.snapshotLength == 1 || gamefox_lib.onPage(doc, 'moddetl'))
            doc.gamefox.pageType = ['messages', 'detail'];
          else
          {
            // TODO: maybe check for user profile links instead
            var userNav = doc.evaluate('//div[@class="board_nav"]'
                + '/div[@class="body"]/ul[@class="paginate user"]',
                doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE,
                null).singleNodeValue;
            var user = userNav;

            if (user && user.textContent.indexOf(userNav ?
                  'Topic archived' : 'Topic Archived') != -1)
              doc.gamefox.pageType = ['messages', 'archive'];
            else
              doc.gamefox.pageType = ['messages'];
          }
          return true;
        }
        return false;
			
			case 'tracked':
				return doc.location.pathname.indexOf('/boards/tracked') == 0;
			
			case 'user':
			  return doc.location.pathname.indexOf('/boards/' + page + '.php') == 0 ||
			  				doc.location.pathname.indexOf('/users/') == 0;
			
      default:
        return doc.location.pathname.indexOf('/boards/' + page + '.php') == 0;
    }
  },

  inDir: function(doc, dir)
  {
    return doc.location.pathname.indexOf('/' + dir + '/') == 0;
  },

  setTitle: function(doc, title, prefix, page)
  {
    if (!gamefox_lib.prefs.getBoolPref('elements.titlechange')) return;
    if (!gamefox_lib.prefs.getBoolPref('elements.titleprefix')) prefix = null;

    doc.title = 'GameFAQs'
      + (prefix == null ? '' : ':' + prefix)
      + (page == null ? '' : ':' + page)
      + ': ' + title;

    if (doc.defaultView.parent != doc.defaultView.self) // we're in a frame
      doc.defaultView.parent.document.title = doc.title;
  },

  open: function(tagID, openType)
  {
    var IDs = tagID.split(',');
    var tagURI = gamefox_lib.domain + gamefox_lib.path;

    tagURI += (IDs[1] ? 'genmessage.php' : 'gentopic.php')
              + '?board=' + IDs[0] + (IDs[1] ? '&topic=' + IDs[1]
              + (IDs[2] && parseInt(IDs[2]) ? '&page=' + IDs[2]
              + (IDs[3] ? IDs[3] : '') : '') : '');

    this.openPage(tagURI, openType);
  },

  openPage: function(url, openType)
  {
    // TODO: review this
    var win = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('navigator:browser');

    switch (openType)
    {
      case 0: // new tab
        try
        {
          win.getBrowser().addTab(url);
        }
        catch (e)
        {
          win.loadURI(url);
        }
        break;
      case 1: // new focused tab
        try
        {
          win.delayedOpenTab(url);
        }
        catch (e)
        {
          win.loadURI(url);
        }
        break;
      case 2: // focused tab
        win.loadURI(url);
        break;
      case 3: // new window
        win.open(url);
        break;
    }

    win.focus();
  },

  newTab: function(url, focus)
  {
    var browser = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('navigator:browser')
      .getBrowser();

    var tab = browser.addTab(url);
    if (focus == 0)
      browser.selectedTab = tab;

    browser.ownerDocument.defaultView.focus();
  },

  /**
   * Set the forceAllowThirdPartyCookie flag on XMLHttpRequest objects.
   *
   * @param {XMLHttpRequest} xhr
   * @return {void}
   */
  forceAllowThirdPartyCookie: function(xhr) {
    xhr.channel.QueryInterface(Ci.nsIHttpChannelInternal)
      .forceAllowThirdPartyCookie = true;
  },

  openOptionsDialog: function(firstRun, notifications, forceOpen, pane)
  {
    // Stolen from Adblock Plus
    var windowMediator = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator);
    var windowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
      .getService(Ci.nsIWindowWatcher);
    var prefs = Cc['@mozilla.org/preferences-service;1']
      .getService(Ci.nsIPrefService);

    var dlg = windowMediator.getMostRecentWindow('gamefox:options');

    if (dlg && !forceOpen)
    {
      try
      {
        dlg.focus();
      }
      catch (e) { } // a modal dialog is blocking us
    }
    else
    {
      var args = {
        firstRun: firstRun,
        notifications: notifications,
        pane: pane
      };
      args.wrappedJSObject = args;

      dlg = windowWatcher.openWindow(window,
          'chrome://gamefox/content/options/options.xul', '_blank',
          'chrome,titlebar,toolbar,centerscreen,resizable,dialog=no', args);
    }
  },

  isLoggedIn: function()
  {
    return !!gamefox_lib.getCookie('MDAAuth');
  },

  toggleSidebar: function()
  {
    if (typeof toggleSidebar == 'function')
    {
      toggleSidebar('viewGamefoxSidebar');
    }
    else
    {
      document.getElementById('gamefox-toggle-sidebar')
        .removeAttribute('checked');
      gamefox_lib.alert('This command does not work on your platform. If you '
          + 'are using SeaMonkey, try installing the xSidebar extension.');
    }
  },

  getCookie: function(name)
  {
    var cookieMgr = Cc['@mozilla.org/cookiemanager;1']
      .getService(Ci.nsICookieManager);

    for (var e = cookieMgr.enumerator; e.hasMoreElements();)
    {
      var cookie = e.getNext().QueryInterface(Ci.nsICookie);
      if (cookie.host == gamefox_lib.cookieHost && cookie.name == name)
        return cookie.value;
    }

    return false;
  },

  isTopBrowserWindow: function()
  {
    // Used to ensure that only one browser window handles an observer
    var win = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('navigator:browser');
    return (win == window);
  },

  /**
   * Wrapper for JSON.parse that catches syntax errors.
   *
   * @param {String} data
   *        JSON string
   * @return JSON value or null with syntax error
   */
  parseJSON: function(data)
  {
    try {
      return JSON.parse(data);
    } catch (e if e.name == 'SyntaxError') {
      return null;
    }
  }
};
