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

var gamefox_options_style =
{
  showDesc: function(event)
  {
    var tree = document.getElementById('css-tree');
    var tbo = tree.treeBoxObject;

    // get the row, col and child element at the point
    var row = {}, col = {}, child = {};
    tbo.getCellAt(event.clientX, event.clientY, row, col, child);

    var cat = tree.view.getCellText(row.value, {index: 5});
    if (tree.view.isContainer(row.value) || col.value.index != 1
        || cat == 'user')
      return;

    var name = tree.view.getCellText(row.value, {index: 0});
    var desc = tree.view.getCellText(row.value, col.value);
    gamefox_lib.alert(name + ':\n' + desc);
  },

  populate: function()
  {
    var css = gamefox_lib.safeEval(gamefox_css.prefs.getCharPref('serialized'));

    this.treeView = new gamefox_treeview();
    this.treeView.childData = {};
    this.treeView.visibleData = [];
    var categories = {'GameFOX':'gamefox', 'GameFAQs':'bundled', 'User':'user'};
    for (var treeCat in categories)
    {
      this.treeView.visibleData.push([[treeCat], true, false]);
      this.treeView.childData[treeCat] = [];
      var prefCat = categories[treeCat];
      for (var filename in css[prefCat])
      {
        this.treeView.childData[treeCat].push([
          css[prefCat][filename]['title'],
          css[prefCat][filename]['desc'],
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

    // this is sort of a hack, I couldn't be bothered with finding out how to push data
    // directly to treeView.visibleData when populating the tree
    this.treeView.toggleOpenState(2);
    this.treeView.toggleOpenState(1);
    this.treeView.toggleOpenState(0);
  },

  onpopupshowing: function()
  {
    var disabled = gamefox_options_style.treeView
      .visibleData[gamefox_options_style.treeView.selection.currentIndex]
      [0][5] != 'user';
    document.getElementById('css-remove').setAttribute('disabled', disabled);
    document.getElementById('css-edit').setAttribute('disabled', disabled);
  },

  isEditable: function(idx, column)
  {
    if (this.isContainer(idx)) return false;
    if (column.index == 3) return true;
    if (this.visibleData[idx][0][5] == 'user') return true;
  },

  setCell: function(idx, column, value)
  {
    this.visibleData[idx][0][column.index] = value;

    var filename = this.visibleData[idx][0][4];
    var category = this.visibleData[idx][0][5];
    // Map column to associative array in pref
    var map = new Array('title', 'desc', 'author', 'enabled');

    var css = gamefox_lib.safeEval(gamefox_css.prefs.getCharPref('serialized'));
    css[category][filename][map[column.index]] = value;
    gamefox_css.prefs.setCharPref('serialized', css.toSource());

    this.selection.clearSelection();
    this.selection.select(idx);

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

    var filename = current[4];
    var category = current[5];

    if (category != 'user')
      return;

    gamefox_css.remove(category, filename);
    this.populate();
  },

  editWithTree: function()
  {
    var current = this.treeView.visibleData[this.treeView.selection.currentIndex][0];
    var filename = current[4];

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

  launchError: function()
  {
    gamefox_lib.alert('This command does not work on your platform. '
        + 'Try updating to the latest version of your browser.');
  }
};
