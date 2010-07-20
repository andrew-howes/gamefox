/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009, 2010 Michael Ryan, Brian Marshall
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

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const host = 'www.gamefaqs.com';
const prefs = Components.classes['@mozilla.org/preferences-service;1']
  .getService(Components.interfaces.nsIPrefService)
  .getBranch('gamefox.');

function GFdateGetter() { }

GFdateGetter.prototype =
{
  classDescription: 'GameFOX date getter',
  classID: Components.ID('{c1f33b60-3c10-11de-8a39-0800200c9a66}'),
  contractID: '@gamefox/dategetter;1',
  _xpcom_categories: [{ category: 'profile-after-change' }],
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIObserver,
      Components.interfaces.nsISupports]),

  observe: function(aSubject, aTopic, aData)
  {
    if (aTopic == 'http-on-examine-response')
    {
      aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
      try
      {
        if (aSubject.getRequestHeader('Host') == host)
          prefs.setIntPref('dateOffset',
              new Date(aSubject.getResponseHeader('Date')).getTime()
              + 500 - Date.now());
      }
      catch (e) {}
    }
    else if (aTopic == 'profile-after-change')
    {
      Components.classes['@mozilla.org/observer-service;1']
        .getService(Components.interfaces.nsIObserverService)
        .addObserver(this, 'http-on-examine-response', false);
    }
  },
};

// Backwards compatibility with Fx3
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([GFdateGetter]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([GFdateGetter]);
