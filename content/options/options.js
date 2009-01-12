/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Brian Marshall, Michael Ryan, Andrianto Effendy
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

var GFoptions =
{
  importBoardSettings: function()
  {
    var strbundle = document.getElementById('options-strings');
    var boardSettingsMsg = document.getElementById('boardSettingsMsg');
    var button = document.getElementById('gamefox-css-grab-bs');
    button.disabled = true;

    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.gamefaqs.com/boards/settings.php');
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Display Settings') == -1)
        {
          GFlib.log('importBoardSettings: Bad things!');

          GFutils.showNotification(boardSettingsMsg,
              strbundle.getString('bsImportCheckIfLoggedIn'), 'warning');
          button.setAttribute('disabled', false);
          return;
        }

        var topicPage = GFutils.parseHTMLSelect(request.responseText, 'topicpage'),
            topicSort = GFutils.parseHTMLSelect(request.responseText, 'topicsort'),
            messagePage = GFutils.parseHTMLSelect(request.responseText, 'messagepage'),
            messageSort = GFutils.parseHTMLSelect(request.responseText, 'messagesort'),
            timezone = GFutils.parseHTMLSelect(request.responseText, 'timezone'),
            userDisplay = GFutils.parseHTMLSelect(request.responseText, 'userdisplay');
        if (topicPage == null || topicSort == null || messagePage == null
            || messageSort == null || timezone == null || userDisplay == null)
        {
          GFlib.log('importBoardSettings: Unable to retrieve all settings.');

          GFutils.showNotification(boardSettingsMsg,
              strbundle.getString('bsImportCheckIfLoggedIn'), 'warning');
          button.setAttribute('disabled', false);
          return;
        }

        // TODO: validate settings from GameFAQs
        document.getElementById('tpcsPerPage').value = topicPage;
        document.getElementById('tpcSortOrder').value = topicSort;
        document.getElementById('msgsPerPage').value = messagePage;
        document.getElementById('msgSortOrder').value = messageSort;
        document.getElementById('timeZone').value = timezone;
        document.getElementById('msgDisplay').value = userDisplay;

        GFutils.showNotification(boardSettingsMsg,
            strbundle.getString('bsImportSuccess'), 'info');
        button.setAttribute('disabled', false);
      }
    }

    request.send(null);
  },

  exportBoardSettings: function()
  {
    data = {topicPage: document.getElementById('topicpage').value,
            topicSort: document.getElementById('topicsort').value,
            messagePage: document.getElementById('messagepage').value,
            messageSort: document.getElementById('messagesort').value,
            timezone: document.getElementById('timezone').value,
           userDisplay: document.getElementById('userdisplay').value};

    var strbundle = document.getElementById('options-strings');
    var boardSettingsMsg = document.getElementById('boardSettingsMsg');
    var button = document.getElementById('gamefox-css-apply-bs');
    button.disabled = true;

    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.gamefaqs.com/boards/settings.php');
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Display Settings') == -1)
        {
          GFlib.log('exportBoardSettings: Bad things!');

          GFutils.showNotification(boardSettingsMsg,
              strbundle.getString('bsExportCheckIfLoggedIn'), 'warning');
          button.setAttribute('disabled', false);
          return;
        }

        var action = request.responseText.match(/<form\b[^>]+?\bid="add"[^>]+?\baction="([^"]*)">/);
        if (!action)
        {
          GFlib.log("exportBoardSettings: Couldn't get user id.");

          GFutils.showNotification(boardSettingsMsg,
              strbundle.getString('bsExportNoUserId'), 'warning');
          button.setAttribute('disabled', false);
          return;
        }
        action = action[1];

        var postRequest = new XMLHttpRequest();
        postRequest.open('POST', 'http://www.gamefaqs.com' + action);
        var ds = GFlib.thirdPartyCookieFix(postRequest);
        postRequest.onreadystatechange = function()
        {
          if (postRequest.readyState == 4)
          {
            if (postRequest.responseText.indexOf('Display settings updated') == -1)
            {
              GFlib.log("exportBoardSettings: Update didn't work!");

              GFutils.showNotification(boardSettingsMsg,
                  strbundle.getString('bsExportUnexpectedResponse'), 'warning');
            }
            else
            {
              GFutils.showNotification(boardSettingsMsg,
                  strbundle.getString('bsExportSuccess'), 'info');
            }
            button.setAttribute('disabled', false);
          }
        }
        var key = request.responseText.match(/<input\b[^>]+?\bname="key"[^>]+?\bvalue="([^"]*)"[^>]*>/i);
        key = key[1];

        postRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        postRequest.send(
            'topicpage=' + data.topicPage + '&' +
            'topicsort=' + data.topicSort + '&' +
            'messagepage=' + data.messagePage + '&' +
            'messagesort=' + data.messageSort + '&' +
            'timezone=' + data.timezone + '&' +
            'userdisplay=' + data.userDisplay + '&' +
            'key=' + key + '&' +
            'submit=1'
            );
      }
    };

    request.send(null);
  },

  importSignature: function()
  {
    var strbundle = document.getElementById('options-strings');
    var signatureMsg = document.getElementById('signatureMsg');
    var button = document.getElementById('gamefox-css-grab-sig');
    button.disabled = true;

    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.gamefaqs.com/boards/sigquote.php');
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Signature and Quote') == -1)
        {
          GFlib.log('importSignature: Bad things!');

          GFutils.showNotification(signatureMsg,
              strbundle.getString('sigImportCheckIfLoggedIn'), 'warning');
          button.setAttribute('disabled', false);
          return;
        }

        var sig = request.responseText.match(/<textarea\b[^>]+?\bname="sig"[^>]*>([^<]*)<\/textarea>/i);
        if (!sig)
        {
          GFlib.log("importSignature: Couldn't get sig");

          GFutils.showNotification(signatureMsg,
              strbundle.getString('sigImportOld'), 'warning');
          button.setAttribute('disabled', false);
          return;
        }
        sig = GFutils.convertNewlines(GFutils.specialCharsDecode(sig[1]));

        document.getElementById('sig-body').value = sig;
        // oninput isn't called
        GFsig.updatePref(document.getElementById('sig-body'));

        GFutils.showNotification(signatureMsg,
            strbundle.getString('sigImportSuccess'), 'info');
        button.setAttribute('disabled', false);
      }
    };

    request.send(null);
  },

  openCSSDirectory: function()
  {
    var directory = Cc['@mozilla.org/file/directory_service;1']
      .getService(Ci.nsIProperties)
      .get('ProfD', Ci.nsILocalFile);
    directory.append('gamefox');
    directory.append('css');

    try
    {
      directory.reveal();
    }
    catch (e)
    {
      GFlib.alert('This command does not work on your platform. You\'re probably using Firefox 2 and not using Windows.');
    }
  },

  saveSelectedTab: function(tab)
  {
    var prefs = Cc['@mozilla.org/preferences-service;1'].getService(
        Ci.nsIPrefService).getBranch('gamefox.options.');
    try
    {
      prefs.setIntPref(tab.getAttribute('tabGroup') + '.selectedtab', tab.selectedIndex);
    }
    catch (e)
    {
      prefs.setIntPref(tab.getAttribute('tabGroup') + '.selectedtab', 0);
    }
  },

  loadAllOverlays: function()
  {
    if (!this.overlayIdx)
      this.overlayIdx = 0;

    var prefpane = document.getElementsByTagName('prefpane')[this.overlayIdx];
    if (!prefpane)
    {
      // end of the line
      GFoptions.init();
      return;
    }

    ++this.overlayIdx;

    if (prefpane.loaded)
    {
      // this prefpane is already loaded, so skip it
      GFoptions.loadAllOverlays();
      return;
    }

    function OverlayLoadObserver(aPane)
    {
      this._pane = aPane;
    }
    OverlayLoadObserver.prototype = {
      observe: function(aSubject, aTopic, aData)
      {
        this._pane.loaded = true;
        document.getElementById('gamefox-prefwindow')
          ._fireEvent('paneload', this._pane);

        // This recursive call in the observer acts like a queue, since
        // overlays do not like being loaded if any other overlay isn't
        // finished loading.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=330458
        GFoptions.loadAllOverlays();
      }
    }

    var obs = new OverlayLoadObserver(prefpane);
    document.loadOverlay(prefpane.src, obs);
  },

  restoreLastPane: function()
  {
    if (navigator.platform.indexOf('Mac') == 0)
    {
      document.getElementById('gamefox-prefwindow').showPane(
          document.getElementById('paneMain'));
      return;
    }

    var prefWindow = document.getElementById('gamefox-prefwindow');
    try
    {
      var lastTab = prefWindow.lastSelected;
      prefWindow.showPane(document.getElementById('paneMain'));
      prefWindow.showPane(document.getElementById(lastTab));
    }
    catch (e)
    {
      prefWindow.showPane(document.getElementById('paneMain'));
    }

    GFoptions.restoreLastTabs();
  },

  restoreLastTabs: function()
  {
    var prefs = Cc['@mozilla.org/preferences-service;1'].getService(
        Ci.nsIPrefService).getBranch('gamefox.options.');
    var tabs = document.getElementsByTagName('tabs');
    var tabGroup;

    for (var i = 0; i < tabs.length; i++)
    {
      tabGroup = tabs[i].getAttribute('tabGroup');
      if (!tabGroup)
      {
        tabs[i].setAttribute('tabGroup', 'tabGroup' + i);
        tabGroup = tabs[i].setAttribute('tabGroup');
      }

      try
      {
        tabs[i].selectedIndex = prefs.getIntPref(tabGroup + '.selectedtab');
      }
      catch (e)
      {
        try
        {
          tabs[i].selectedIndex = 0;
        }
        catch (e) {}
      }

      tabs[i].setAttribute('onselect', 'GFoptions.saveSelectedTab(this)');
    }
  },

  init: function()
  {
    GFoptions.restoreLastPane();

    if (!window.arguments)
      // opened from Add-ons window
      return;

    var args = window.arguments[0].wrappedJSObject;

    if (args.firstRun)
    {
      GFuserlist.add();
      GFuserlist.populateLast();
      GFoptions.importBoardSettings();
      GFoptions.importSignature();
    }

    for (var i in args.notifications)
    {
      var notificationbox = document.getElementById(i);
      for (var j = 0; j < args.notifications[i].length; j++)
      {
        GFutils.showNotification(notificationbox,
            args.notifications[i][j].label, args.notifications[i][j].type);
      }
    }
  }
};
