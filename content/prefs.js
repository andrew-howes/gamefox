/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Michael Ryan, Brian Marshall
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

// TODO:
//   - Handle stylesheet files
//   - getCharPref and setCharPref are used for all string prefs. This seems
//     to work alright, but I'm not sure if it is the correct thing to do.

var gamefox_prefs =
{
  prefs: Cc['@mozilla.org/preferences-service;1']
           .getService(Ci.nsIPrefService).getBranch('gamefox.'),

  getAllPrefNames: function()
  {
    return this.prefs.getChildList('', {}).sort();
  },

  getUserPrefNames: function()
  {
    var allPrefNames = this.getAllPrefNames();
    var userPrefNames = [];
    for (var i = 0; i < allPrefNames.length; i++)
    {
      if (allPrefNames[i] != 'theme.css.serialized' &&
          this.prefs.prefHasUserValue(allPrefNames[i]))
        userPrefNames.push(allPrefNames[i]);
    }
    return userPrefNames;
  },

  getPrefValue: function(name)
  {
    var value;
    switch (this.prefs.getPrefType(name))
    {
      case this.prefs.PREF_STRING:
        value = this.prefs.getCharPref(name);
        break;
      case this.prefs.PREF_INT:
        value = this.prefs.getIntPref(name);
        break;
      case this.prefs.PREF_BOOL:
        value = this.prefs.getBoolPref(name);
        break;
      case this.prefs.PREF_INVALID:
        value = '';
        break;
    }
    return value;
  },

  setPrefValue: function(name, value)
  {
    switch (this.prefs.getPrefType(name))
    {
      case this.prefs.PREF_STRING:
        this.prefs.setCharPref(name, value);
        break;
      case this.prefs.PREF_INT:
        this.prefs.setIntPref(name, value);
        break;
      case this.prefs.PREF_BOOL:
        this.prefs.setBoolPref(name, value);
        break;
    }
  },

  getSerializedUserPrefs: function()
  {
    var userPrefNames = this.getUserPrefNames();
    var userPrefs = {};
    for (var i = 0; i < userPrefNames.length; i++)
      userPrefs[userPrefNames[i]] = this.getPrefValue(userPrefNames[i]);
    return JSON.stringify(userPrefs);
  },

  clearUserPrefs: function()
  {
    var userPrefNames = this.getUserPrefNames();
    for (var i = 0; i < userPrefNames.length; i++)
      this.prefs.clearUserPref(userPrefNames[i]);
  }
}
