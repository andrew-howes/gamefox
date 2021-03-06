/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011, 2012 Brian Marshall, Michael Ryan
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

var gamefox_options_style =
{
  getDesc: function(cat, filename, about)
  {
    var css = gamefox_css.list;

    if (!about && css[cat][filename]['showDesc'] == 0)
      return false;

    return css[cat][filename]['desc'];
  },

  populate: function()
  {
    var css = gamefox_css.list;

    this.treeView = new gamefox_treeview();
    this.treeView.childData = {};
    this.treeView.visibleData = [];
    var categories = { Themes: 'themes', 'GameFAQs Theme Extras': 'extras',
      Other: 'bundled', GameFOX: 'gamefox', Imported: 'user' };
    for (var treeCat in categories)
    {
      this.treeView.visibleData.push([[treeCat], true, false]);
      this.treeView.childData[treeCat] = [];
      var prefCat = categories[treeCat];
      for (var filename in css[prefCat])
      {
        this.treeView.childData[treeCat].push([
          css[prefCat][filename]['title'],
          css[prefCat][filename]['author'],
          css[prefCat][filename]['enabled'],
          filename, // stored in invisible column; uniquely identifies stylesheet
          prefCat
        ]);
      }
    }

    this.treeView.isEditable = this.isEditable;
    this.treeView.setCellText = this.setCell;
    this.treeView.setCellValue = this.setCell;

    document.getElementById('css-tree').view = this.treeView;

    this.treeView.selection.clearSelection();
    this.treeView.selection.select(0);

    // expand all categories except GameFOX
    for (var i = 4; i >= 0; i--)
      if (i != 3) this.treeView.toggleOpenState(i);
  },

  onpopupshowing: function()
  {
    var row = gamefox_options_style.treeView
      .visibleData[gamefox_options_style.treeView.selection.currentIndex][0];
    document.getElementById('css-about').setAttribute('disabled',
        row[4] == 'user' || row.length == 1); // tree category
    document.getElementById('css-remove').setAttribute('disabled', row[4] != 'user');
    document.getElementById('css-edit').setAttribute('disabled', row[4] != 'user');
  },

  isEditable: function(idx, column)
  {
    if (this.isContainer(idx)) return false;
    if (column.index == 2) return true;
    if (this.visibleData[idx][0][4] == 'user') return true;
  },

  setCell: function(idx, column, value)
  {
    var strbundle = document.getElementById('style-strings');
    this.selection.select(idx);

    var name = this.visibleData[idx][0][0];
    var filename = this.visibleData[idx][0][3];
    var category = this.visibleData[idx][0][4];
    var desc = gamefox_options_style.getDesc(category, filename);
    // Map column to associative array in pref
    var map = new Array('title', 'author', 'enabled');
    var css = gamefox_css.list;

    // Show description before enabling
    if (desc && map[column.index] == 'enabled' && value == 'true')
    {
      // TODO: move to gamefox_lib.confirmEx()?
      var promptService = Cc['@mozilla.org/embedcomp/prompt-service;1']
        .getService(Ci.nsIPromptService);

      var showDesc = {value:css[category][filename]['showDesc']};
      if (showDesc.value == 1)
        showDesc.value = false;
      else
        showDesc.value = true;

      var flags = promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_IS_STRING +
        promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_CANCEL;
      var button = promptService.confirmEx(null, 'GameFOX',
          strbundle.getFormattedString('desc', [name, desc]), flags,
          strbundle.getString('enable'), '', '',
          strbundle.getString('showDesc'), showDesc);

      if (button == 1)
        return;
    }

    // Update tree
    this.visibleData[idx][0][column.index] = value;

    // Update pref
    css[category][filename][map[column.index]] = value;
    if (showDesc)
      css[category][filename]['showDesc'] = showDesc.value == false ? 0 : 2;
    gamefox_css.list = css;

    gamefox_css.reload(true);
  },

  userimport: function(uri)
  {
    // TODO: make sure all errors result in alert
    // TODO: if name conflict, option to overwrite or rename
    if (!/\.(css|txt)$/.test(uri))
    {
      if (uri.length > 0)
        gamefox_lib.alert('Filename must end in .css or .txt');
      return;
    }

    var filename = decodeURIComponent(uri.substr(uri.lastIndexOf('/') + 1));

    if (!gamefox_css.add('user', uri, filename, filename, '', '', true)) return;

    this.populate();
    gamefox_css.reload(true);
  },

  filepicker: function()
  {
    var filepicker = Cc['@mozilla.org/filepicker;1']
      .createInstance(Ci.nsIFilePicker);
    filepicker.init(window, 'Import Stylesheet', Ci.nsIFilePicker.modeOpen);
    filepicker.appendFilter('Stylesheets (*.css; *.txt)', '*.css; *.txt');

    if (filepicker.show() == Ci.nsIFilePicker.returnOK)
      return filepicker.fileURL.spec;
    return '';
  },

  openDirectory: function()
  {
    var directory = gamefox_css.getDirectory();

    try
    {
      directory.reveal();
    }
    catch (e)
    {
      this.launchError();
    }
  },

  removeWithTree: function()
  {
    var current = this.treeView.visibleData[this.treeView.selection.currentIndex][0];

    if (!gamefox_lib.confirm('Really delete "' + current[0] + '"?'))
      return;

    var filename = current[3];
    var category = current[4];

    if (category != 'user')
      return;

    gamefox_css.remove(category, filename);
    this.populate();
  },

  editWithTree: function()
  {
    var current = this.treeView.visibleData[this.treeView.selection.currentIndex][0];
    var filename = current[3];

    var file = Cc['@mozilla.org/file/local;1']
      .getService(Ci.nsILocalFile);

    file.initWithPath(gamefox_css.getDirectoryPath());
    file.append(filename);

    try
    {
      file.launch();
    }
    catch (e)
    {
      this.launchError();
    }
  },

  about: function()
  {
    var current = this.treeView.visibleData[this.treeView.selection.currentIndex][0];

    var name = current[0];
    var filename = current[3];
    var category = current[4];
    var desc = this.getDesc(category, filename, true);

    gamefox_lib.alert(name + ':\n' + desc);
  },

  launchError: function()
  {
    gamefox_lib.alert('This command does not work on your platform. '
        + 'Try updating to the latest version of your browser.');
  }
};
