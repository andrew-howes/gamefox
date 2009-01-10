/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Michael Ryan, Brian Marshall
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

var GFprefs =
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
    return userPrefs.toSource();
  },

  clearUserPrefs: function()
  {
    var userPrefNames = this.getUserPrefNames();
    for (var i = 0; i < userPrefNames.length; i++)
      this.prefs.clearUserPref(userPrefNames[i]);
  },

  importPrefs: function(button)
  {
    var manageMsg = document.getElementById('manageMsg');
    button.setAttribute('disabled', true);

    var strbundle = document.getElementById('options-strings');

    var filePicker = Cc['@mozilla.org/filepicker;1']
      .createInstance(Ci.nsIFilePicker);
    filePicker.init(window, strbundle.getString('prefsImportFilePicker'),
        Ci.nsIFilePicker.modeOpen);
    filePicker.appendFilters(filePicker.filterAll);
    if (filePicker.show() != Ci.nsIFilePicker.returnOK)
    {
      button.setAttribute('disabled', false);
      return;
    }

    var inputData = '';
    var fiStream = Cc['@mozilla.org/network/file-input-stream;1']
      .createInstance(Ci.nsIFileInputStream);
    var siStream = Cc['@mozilla.org/scriptableinputstream;1']
      .createInstance(Ci.nsIScriptableInputStream);
    fiStream.init(filePicker.file, 0x01, 0, 0);
    siStream.init(fiStream);
    var str;
    while ((str = siStream.read(4096)).length > 0)
      inputData += str;
    siStream.close();
    fiStream.close();

    try
    {
      var importedPrefs = eval(inputData);
    }
    catch (e)
    {
      GFutils.showNotification(manageMsg,
          strbundle.getString('prefsInvalidSyntax'), 'warning');
      button.setAttribute('disabled', false);
      return;
    }
    this.clearUserPrefs();
    for (var i in importedPrefs)
      this.setPrefValue(i, importedPrefs[i]);

    button.setAttribute('disabled', false);

    this.resetOptionsDialog(false,
        {'manageMsg':
          [{label: strbundle.getString('prefsImportSuccess'),
           type: 'info'}]
        });
  },

  exportPrefs: function(button)
  {
    var manageMsg = document.getElementById('manageMsg');
    button.setAttribute('disabled', true);

    var strbundle = document.getElementById('options-strings');

    var filePicker = Cc['@mozilla.org/filepicker;1']
      .createInstance(Ci.nsIFilePicker);
    filePicker.init(window, strbundle.getString('prefsExportFilePicker'),
        Ci.nsIFilePicker.modeSave);
    filePicker.appendFilters(filePicker.filterAll);
    filePicker.defaultString = 'gamefox-prefs.txt';
    var showValue = filePicker.show();
    if (showValue != Ci.nsIFilePicker.returnOK
        && showValue != Ci.nsIFilePicker.returnReplace)
    {
      button.setAttribute('disabled', false);
      return;
    }

    this.savePrefs();
    var outputData = this.getSerializedUserPrefs();
    var foStream = Cc['@mozilla.org/network/file-output-stream;1']
      .createInstance(Ci.nsIFileOutputStream);
    foStream.init(filePicker.file, 0x02 | 0x08 | 0x20, 0664, 0);
    foStream.write(outputData, outputData.length);
    foStream.close();

    GFutils.showNotification(manageMsg,
        strbundle.getString('prefsExportSuccess'), 'info');
    button.setAttribute('disabled', false);
  },

  resetPrefs: function(button)
  {
    var manageMsg = document.getElementById('manageMsg');
    button.setAttribute('disabled', true);

    var strbundle = document.getElementById('options-strings');

    if (!GFlib.confirm(strbundle.getString('prefsResetConfirm')))
    {
      button.setAttribute('disabled', false);
      return;
    }

    this.clearUserPrefs();
    this.prefs.setCharPref('version', GFlib.version);

    button.setAttribute('disabled', false);

    GFcss.init();
    GFcss.reload();
    this.resetOptionsDialog(true,
        {'manageMsg':
          [{label: strbundle.getString('prefsResetSuccess'),
            type: 'warning'}]
        });
  },

  resetOptionsDialog: function(firstRun, notifications)
  {
    window.close();
    GFlib.openOptionsDialog(firstRun, notifications, true);
  },

  savePrefs: function()
  {
    var panes = document.getElementById('gamefox-prefwindow').preferencePanes;
    for (var i = 0; i < panes.length; i++)
      panes[i].writePreferences();
  }
}
