/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Brian Marshall, Michael Ryan
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

var GFcss =
{
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(
             Ci.nsIPrefService).getBranch('gamefox.theme.css.'),

  init: function()
  {
    var defaults = [
        ['gamefox', 'gamefox-ads.css', 'Ad blocking',
              'Hides ads. Best used with "block ad servers" enabled.', '', true],
        ['gamefox', 'gamefox-sidebar.css', 'Classic Sidebar',
              'A classic style for the GameFOX sidebar.', '', false],
        ['gamefox', 'gamefox-essentials.css', 'Essentials',
              'Works with some of GameFOX\'s features. Should always be enabled.', '', true],
        ['gamefox', 'gfcode.css', 'GFCode',
              'Makes quotes look pretty.', 'Ant P.', true],
        ['gamefox', 'gamefox-quickpost.css', 'QuickPost',
              'Makes QuickPost look pretty.', '', true],
        ['gamefox', 'gamefox-quickwhois.css', 'QuickWhois',
              'Makes QuickWhois look pretty.', '', true],
        ['bundled', 'ascii-art-font.css', 'ASCII art font',
              'Increases the font size of messages to make ASCII art look better.',
              '', false],
        ['bundled', 'ricapar.css', 'Classic',
              'Emulates the 2001-2004 style of GameFAQs. Disable main ' +
              'GameFAQs stylesheets to use.', 'Ricapar', false],
        ['bundled', 'status-default.css', 'Status icons (normal)',
              'Only show topic status icons for closed/sticky topics. This CSS ' +
              'conflicts with "Status icons (classic)".', '', false],
        ['bundled', 'status-classic.css', 'Status icons (classic)',
              'Only show topic status icons for closed/sticky topics - ' +
              'emulates the pre-2006 style of icons. This CSS ' +
              'conflicts with "Status icons (normal)".', '', false],
        ['bundled', 'toad.css', 'Ten On A Diet',
              'A wider, less padded style. ' +
              'Works with the default GameFAQs skin.', 'TakatoMatsuki', false],
        ['bundled', 'wide-layout.css', 'Wide default',
              'Increases the width of the page to fill the whole window. ' +
              'Works with the default GameFAQs skin.', '', false]
        ];
    for (var i = 0; i < defaults.length; i++)
    {
      var j = defaults[i];
      this.add(j[0], 'chrome://gamefox/content/css/' + j[1], j[1], j[2], j[3], j[4], j[5], true);
    }

    // Remove old stylesheets
    var css = eval(this.prefs.getCharPref('serialized'));
    for (i in {'gamefox':'', 'bundled':''})
    {
      for (j in css[i])
      {
        var req = new XMLHttpRequest();
        req.overrideMimeType('text/plain'); // otherwise we get "not well-formed" errors in the error console
        try
        {
          req.open('GET', 'chrome://gamefox/content/css/' + j, false);
          req.send(null);
        }
        catch (e)
        {
          this.remove(i, j);
        }
      }
    }
  },

  userimport: function(uri)
  {
    // TODO: make sure all errors result in alert
    // TODO: if name conflict, option to overwrite or rename
    if (!/\.(css|txt)$/.test(uri))
    {
      if (uri.length > 0)
        GFlib.alert('Filename must end in .css or .txt');
      return;
    }

    var filename = decodeURIComponent(uri.substr(uri.lastIndexOf('/') + 1));

    if (!this.add('user', uri, filename, filename, '', '', true)) return;

    this.populate(document.getElementById('css-tree'));
    this.reload();
  },

  filepicker: function()
  {
    var filepicker = Cc['@mozilla.org/filepicker;1'].createInstance(
        Ci.nsIFilePicker);
    filepicker.init(window, 'Import Stylesheet', Ci.nsIFilePicker.modeOpen);
    filepicker.appendFilter('Stylesheets (*.css; *.txt)', '*.css; *.txt');

    if (filepicker.show() == Ci.nsIFilePicker.returnOK)
      return filepicker.fileURL.spec;
    return '';
  },

  add: function(cat, uri, filename, title, desc, author, enabled, overwrite)
  {
    overwrite = (overwrite == null ? false : overwrite);
    var file = Cc['@mozilla.org/file/local;1'].getService(
        Ci.nsILocalFile);
    var foStream = Cc['@mozilla.org/network/file-output-stream;1'].getService(
        Ci.nsIFileOutputStream);
    var siStream = Cc['@mozilla.org/scriptableinputstream;1'].getService(
        Ci.nsIScriptableInputStream);

    file.initWithPath(this.getDirectory());
    file.append(filename);
    if (overwrite == false && file.exists()) {
      var d = new Date();
      filename = filename.replace(/\.(css|txt)$/, d.getTime() + '.$1');
      file.initWithPath(this.getDirectory());
      file.append(filename);
      delete d;
    }

    try
    {
      var channel = Cc['@mozilla.org/network/io-service;1'].getService(
          Ci.nsIIOService).newChannel(uri, null, null);
      var input = channel.open();
      siStream.init(input);
      var fileData = siStream.read(input.available());
      siStream.close();
      input.close();
    }
    catch (e)
    {
      GFlib.alert('There was an error importing the stylesheet:\n' + e);
      return false;
    }

    try
    {
      foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
      foStream.write(fileData, fileData.length);
      foStream.close();
    }
    catch (e)
    {
      GFlib.alert('There was an error writing the stylesheet to its destination:\n' + e);
      return false;
    }

    var css = eval(this.prefs.getCharPref('serialized'));

    // this loop does a few things:
    //  -force re-ordering when overwriting
    //  -don't change enabled status
    //  -handle category changing
    for (var i in css)
    {
      if (css[i][filename])
      {
        enabled = css[i][filename]['enabled'];
        delete css[i][filename];
      }
    }

    css[cat][filename] = {
      'title': title, 'desc': desc, 'author': author, 'enabled': enabled
    };

    this.prefs.setCharPref('serialized', css.toSource());
    return true;
  },

  getDirectory: function()
  {
    var directory = Cc['@mozilla.org/file/directory_service;1'].getService(
        Ci.nsIProperties).get('ProfD', Ci.nsIFile);

    try
    {
      directory.append('gamefox');
      directory.append('css');

      if (!directory.exists())
        directory.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);

      return directory.path;
    }
    catch (e)
    {
      GFlib.alert('There was an error creating the CSS directory:\n' + e);
      return false;
    }
  },

  reload: function()
  {
    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(
        Ci.nsIStyleSheetService);
    var file = Cc['@mozilla.org/file/local;1'].getService(
        Ci.nsILocalFile);
    var css = eval(this.prefs.getCharPref('serialized'));

    for (var category in css)
    {
      for (var filename in css[category])
      {
        try
        {
          file.initWithPath(this.getDirectory());
          file.append(filename);
          var uri = Cc['@mozilla.org/network/io-service;1'].getService(
              Ci.nsIIOService).newFileURI(file, null, null);

          if (sss.sheetRegistered(uri, sss.USER_SHEET))
            sss.unregisterSheet(uri, sss.USER_SHEET);

          if (css[category][filename]['enabled'].toString() == 'true')
            sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
        }
        catch (e if e.name == 'NS_ERROR_FILE_NOT_FOUND')
        {
          if (category == 'user') // user stylesheet, remove it
          {
            this.remove(category, filename);
            if (document.getElementById('css-tree'))
              this.populate(document.getElementById('css-tree'));
          }
          else // gamefox stylesheet, restore it
          {
            if (this.add(category, 'chrome://gamefox/content/css/' + filename, filename,
                css[category][filename]['title'], css[category][filename]['author'], true))
              this.reload(); // oh no, a recursive function call!
                             // it should be all right as this is only done if re-adding the sheet was successful
          }
        }
      }
    }
  },

  populate: function(element)
  {
    var css = eval(this.prefs.getCharPref('serialized'));

    this.treeView = GFtreeview;
    this.treeView.childData = {};
    this.treeView.visibleData = [];
    var categories = {'GameFOX':'gamefox', 'GameFAQs':'bundled', 'User':'user'};
    for (var treeCat in categories)
    {
      this.treeView.visibleData.push([[treeCat], true, false]);
      this.treeView.childData[treeCat] = [];
      var prefCat = categories[treeCat];
      for (var filename in css[categories[treeCat]])
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

    this.treeView.isEditable = function(idx, column)
    {
      if (this.isContainer(idx)) return false;
      if (column.index == 3) return true;
      if (this.visibleData[idx][0][5] == 'user') return true;

      // description
      if (column.index == 1 && this.visibleData[idx][0][1].length)
        GFlib.alert(this.visibleData[idx][0][0] + '\n\n' +
            this.visibleData[idx][0][1]);
    }
    this.treeView.setCellText = this.setCell;
    this.treeView.setCellValue = this.setCell;

    element.view = this.treeView;

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
    var category = GFcss.treeView.visibleData[GFcss.treeView.selection.currentIndex][0][5];
    document.getElementById('css-remove').setAttribute('disabled', category != 'user');
  },

  setCell: function(idx, column, value)
  {
    this.visibleData[idx][0][column.index] = value;

    var filename = this.visibleData[idx][0][4];
    var category = this.visibleData[idx][0][5];
    // Map column to associative array in pref
    var map = new Array('title', 'desc', 'author', 'enabled');

    var css = eval(GFcss.prefs.getCharPref('serialized'));
    css[category][filename][map[column.index]] = value;
    GFcss.prefs.setCharPref('serialized', css.toSource());

    this.selection.clearSelection();
    this.selection.select(idx);

    GFcss.reload();
  },

  remove: function(category, filename)
  {
    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(
        Ci.nsIStyleSheetService);
    var file = Cc['@mozilla.org/file/local;1'].getService(
        Ci.nsILocalFile);
    var css = eval(this.prefs.getCharPref('serialized'));

    file.initWithPath(this.getDirectory());
    file.append(filename);

    var uri = Cc['@mozilla.org/network/io-service;1'].getService(
        Ci.nsIIOService).newFileURI(file, null, null);
    try
    {
      sss.unregisterSheet(uri, sss.USER_SHEET);
    }
    catch (e) {}

    try
    {
      file.remove(false);
    }
    catch (e) {}

    delete css[category][filename];
    this.prefs.setCharPref('serialized', css.toSource());
  },

  removeWithTree: function()
  {
    var current = this.treeView.visibleData[this.treeView.selection.currentIndex][0];

    if (!GFlib.confirm('Really delete "' + current[0] + '"?'))
      return;

    var filename = current[4];
    var category = current[5];

    if (category != 'user')
      return;

    this.remove(category, filename);
    this.populate(document.getElementById('css-tree'));
  }
};
