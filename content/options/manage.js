/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Brian Marshall, Michael Ryan
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

var gamefox_options_manage =
{
  savePrefs: function()
  {
    var panes = document.getElementById('gamefox-prefwindow').preferencePanes;
    for (var i = 0; i < panes.length; i++)
      panes[i].writePreferences();
  },

  resetOptionsDialog: function(firstRun, notifications)
  {
    window.close();
    gamefox_lib.openOptionsDialog(firstRun, notifications, true);
  },

  importPrefs: function(button)
  {
    var manageMsg = document.getElementById('manageMsg');
    button.disabled = true;

    var strbundle = document.getElementById('manage-strings');

    var filePicker = Cc['@mozilla.org/filepicker;1']
      .createInstance(Ci.nsIFilePicker);
    filePicker.init(window, strbundle.getString('importFilePicker'),
        Ci.nsIFilePicker.modeOpen);
    filePicker.appendFilters(filePicker.filterAll);
    if (filePicker.show() != Ci.nsIFilePicker.returnOK)
    {
      button.disabled = false;
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

    if (!gamefox_json.isMostlyHarmless(inputData))
      // Compat: Not JSON, probably prefs from an older version
      var importedPrefs = gamefox_lib.safeEval(inputData, true);
    else
      var importedPrefs = gamefox_lib.safeEval(inputData);

    if (!importedPrefs)
    {
      gamefox_utils.showNotification(manageMsg,
          strbundle.getString('invalidSyntax'), 'warning');
      button.disabled = false;
      return;
    }
    gamefox_prefs.clearUserPrefs();
    for (var i in importedPrefs)
    {
      // Compat: Not JSON
      if (/^(\(|\[)\{.*\}(\)|\])$/.test(importedPrefs[i])
          && !gamefox_json.isMostlyHarmless(importedPrefs[i]))
        importedPrefs[i] = gamefox_lib.toJSON(gamefox_lib.safeEval(importedPrefs[i], true));

      gamefox_prefs.setPrefValue(i, importedPrefs[i]);
    }

    button.disabled = false;

    this.resetOptionsDialog(false,
        {'manageMsg':
          [{label: strbundle.getString('importSuccess'),
           type: 'info'}]
        });
  },

  exportPrefs: function(button)
  {
    var manageMsg = document.getElementById('manageMsg');
    button.disabled = true;

    var strbundle = document.getElementById('manage-strings');

    var filePicker = Cc['@mozilla.org/filepicker;1']
      .createInstance(Ci.nsIFilePicker);
    filePicker.init(window, strbundle.getString('exportFilePicker'),
        Ci.nsIFilePicker.modeSave);
    filePicker.appendFilters(filePicker.filterAll);
    filePicker.defaultString = 'gamefox-prefs.json';
    var showValue = filePicker.show();
    if (showValue != Ci.nsIFilePicker.returnOK
        && showValue != Ci.nsIFilePicker.returnReplace)
    {
      button.disabled = false;
      return;
    }

    this.savePrefs();
    var outputData = gamefox_prefs.getSerializedUserPrefs();
    var foStream = Cc['@mozilla.org/network/file-output-stream;1']
      .createInstance(Ci.nsIFileOutputStream);
    foStream.init(filePicker.file, 0x02 | 0x08 | 0x20, 0664, 0);
    foStream.write(outputData, outputData.length);
    foStream.close();

    gamefox_utils.showNotification(manageMsg,
        strbundle.getString('exportSuccess'), 'info');
    button.disabled = false;
  },

  resetPrefs: function(button)
  {
    var manageMsg = document.getElementById('manageMsg');
    button.disabled = true;

    var strbundle = document.getElementById('manage-strings');

    if (!gamefox_lib.confirm(strbundle.getString('resetConfirm')))
    {
      button.disabled = false;
      return;
    }

    gamefox_prefs.clearUserPrefs();
    gamefox_lib.prefs.setCharPref('version', gamefox_lib.version);

    button.disabled = false;

    gamefox_css.init();
    gamefox_css.reload();
    this.resetOptionsDialog(true,
        {'manageMsg':
          [{label: strbundle.getString('resetSuccess'),
            type: 'warning'}]
        });
  }
};
