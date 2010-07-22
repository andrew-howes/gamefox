/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010 Brian Marshall, Michael Ryan, Andrianto Effendy
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

var gamefox_lib =
{
  domain: 'http://www.gamefaqs.com',
  path: '/boards/',
  cookieHost: '.gamefaqs.com',

  prefs: Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService)
    .getBranch('gamefox.'),

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

  log: function(msg)
  {
    Cc['@mozilla.org/consoleservice;1']
      .getService(Ci.nsIConsoleService)
      .logStringMessage('GameFOX: ' + msg);
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

  getDocument: function(event)
  {
    if (event.target && event.target.ownerDocument)
      return event.target.ownerDocument;
    else if (event.originalTarget)
      return event.originalTarget;
    else
      return event;
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

  onBoards: function(doc)
  {
    return gamefox_lib.onGF(doc) && /^\/boards(\/|$|\?)/.test(doc.location.pathname);
  },

  onPage: function(doc, page)
  {
    if (doc.gamefox.pageType)
      return doc.gamefox.pageType.indexOf(page) != -1;

    // pageType is an array because of overlapping pages, e.g. message detail and messages
    switch (page)
    {
      case 'index':
        var div = doc.getElementById('side_col');
        if (div)
        {
          var bi = doc.evaluate('div[@class="pod"]/div[@class="head"]/h2', div,
              null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (bi && bi.textContent == 'Board Information')
          {
            doc.gamefox.pageType = ['index'];
            return true;
          }
        }
        return false;

      case 'topics':
        var div = doc.getElementById('board_wrap');
        if (div)
        {
          if (gamefox_lib.onPage(doc, 'tracked'))
          {
            doc.gamefox.pageType = ['topics', 'tracked'];
            return true;
          }
          var col = doc.evaluate('div[@class="body"]/table[@class="board topics"]/colgroup/col[@class="status"]',
              div, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (col)
          {
            doc.gamefox.pageType = ['topics'];
            return true;
          }
          // TODO: iterate over all <p> nodes (fails case when deleting only topic on board)
          var notopics = doc.evaluate('p', div, null,
              XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (notopics && notopics.textContent.indexOf('No topics are available') != -1)
          {
            doc.gamefox.pageType = ['topics'];
            return true;
          }
        }
        return false;

      case 'messages':
        var div = doc.getElementById('board_wrap');
        if (div)
        {
          var table = doc.evaluate('div[@class="body"]/table[@class="board message"]',
              div, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (table && !gamefox_lib.onPage(doc, 'usernote'))
          {
            var boards = doc.evaluate('div[@class="body"]', div, null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (boards.snapshotLength > 1)
              doc.gamefox.pageType = ['messages', 'detail'];
            else
            {
              // TODO: maybe check for user profile links instead
              var user = doc.evaluate('div[@class="board_nav"]/div[@class="body"]/div[@class="user"]',
                  div, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              if (user && user.textContent.indexOf('Topic Archived') != -1)
                doc.gamefox.pageType = ['messages', 'archive'];
              else
                doc.gamefox.pageType = ['messages'];
            }
            return true;
          }
        }
        return false;

      case 'boardlist':
        var div = doc.getElementById('board_wrap');
        if (div)
        {
          var table = doc.evaluate('div[@class="body"]/table[@class="board"]',
              div, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (table && !gamefox_lib.onPage(doc, 'index'))
          {
            doc.gamefox.pageType = ['boardlist'];
            return true;
          }
        }
        return false;

      default:
        return doc.location.pathname.indexOf('/boards/' + page + '.php') == 0;
    }
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
  },

  thirdPartyCookieFix: function(request)
  {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=437174
    if (!Ci.nsILoadContext)
    {
      var ds = Cc['@mozilla.org/webshell;1']
        .createInstance(Ci.nsIDocShellTreeItem)
        .QueryInterface(Ci.nsIInterfaceRequestor);
      request.channel.loadGroup = ds.getInterface(Ci.nsILoadGroup);
    }
    request.channel.loadFlags |= Ci.nsIChannel.LOAD_DOCUMENT_URI;
    // need to maintain a reference to this or it will get gc'd!
    return ds;
  },

  thirdPartyCookiePreCheck: function()
  {
    if (Ci.nsILoadContext
        && Cc['@mozilla.org/preferences-service;1']
          .getService(Ci.nsIPrefBranch)
          .getIntPref('network.cookie.cookieBehavior') == 1
        && window != window.top)
      return gamefox_lib.confirm('You have third-party cookies disabled and your browser is probably not going to send all the necessary cookies unless you have made an exception for gamefaqs.com. Do you want to continue the current action? (Do not click OK unless you know what you are doing)');
    return true;
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
      catch (e)
      {
        // There must be some modal dialog open
        dlg = windowMediator.getMostRecentWindow('gamefox:options');
        if (dlg)
          dlg.focus();
      }
    }
    else
    {
      var args = {
        firstRun: firstRun,
        notifications: notifications,
        pane: pane
      };
      args.wrappedJSObject = args;

      var features;
      try
      {
        var instantApply =
          prefs.getBoolPref('browser.preferences.instantApply');
        features = 'chrome,titlebar,toolbar,centerscreen' + (instantApply ?
            ',dialog=no' : ',modal');
      }
      catch (e)
      {
        features = 'chrome,titlebar,toolbar,centerscreen,modal';
      }
      dlg = windowWatcher.openWindow(null, 'chrome://gamefox/content/options/options.xul',
          '_blank', features, args);
    }
  },

  isLoggedIn: function()
  {
    var cookieMgr = Cc['@mozilla.org/cookiemanager;1']
      .getService(Ci.nsICookieManager);

    for (var e = cookieMgr.enumerator; e.hasMoreElements();)
    {
      var cookie = e.getNext().QueryInterface(Ci.nsICookie);
      if (cookie.host == gamefox_lib.cookieHost && cookie.name == 'MDAAuth')
        return true;
    }

    return false;
  },

  safeEval: function(pref, noJSON)
  {
    // Thanks Toad King

    if (!pref.length)
      return false;

    var parsedPref = null;

    try
    {
      if (!noJSON)
      {
        var nativeJSON = Cc['@mozilla.org/dom/json;1'].createInstance(Ci.nsIJSON);
        parsedPref = nativeJSON.decode(pref);
      }
      else
      {
        var sandbox = new Components.utils.Sandbox('about:blank');
        parsedPref = Components.utils.evalInSandbox('(' + pref + ')', sandbox);
      }
    }
    catch (e)
    {
      gamefox_lib.log('Failed to evaluate JSON: ' + e);
    }

    // Functions are bad
    function check_obj(obj)
    {
      var safe = true;

      for (var i in obj)
      {
        if (obj[i])
        {
          if (typeof obj[i] == 'object')
            safe = check_obj(obj[i]);
          else if (typeof obj[i] == 'function')
            return false;
        }
      }

      return safe;
    }

    if (!check_obj(parsedPref))
      return false;

    return parsedPref;
  },

  toJSON: function(obj)
  {
    var nativeJSON = Cc['@mozilla.org/dom/json;1'].createInstance(Ci.nsIJSON);
    return nativeJSON.encode(obj);
  }
};
