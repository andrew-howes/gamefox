/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2011 Michael Ryan, Brian Marshall
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

function gamefox_pref_observer(domain, observer)
{
  // the event listener makes everything we need stay in memory, so it is not
  // necessary to maintain an explicit reference to this object
  var branch = Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService)
    .getBranch('gamefox.');
  branch.QueryInterface(Ci.nsIPrefBranch2);

  if (typeof observer == 'function')
  {
    this.observe = observer;
    branch.addObserver(domain, this, false);
    var obj = this;
  }
  else // typeof observer == 'object'
  {
    branch.addObserver(domain, observer, false);
    var obj = observer;
  }

  window.addEventListener('unload', function()
      {
        branch.removeObserver(domain, obj);
      }, false);
}

function gamefox_cookie_observer(observer)
{
  var os = Cc['@mozilla.org/observer-service;1'].getService(Ci
      .nsIObserverService);

  this.register = function()
  {
    os.addObserver(this, 'cookie-changed', false);
  };
  this.unregster = function()
  {
    if (os) os.removeObserver(this, 'cookie-changed');
  };
  this.observe = function(subject, topic, data)
  {
    if (topic == 'cookie-changed')
      observer(subject);
  };
}
