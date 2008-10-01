/* vim: set et sw=2 sts=2 ts=2: */

var GFcss =
{
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(
             Ci.nsIPrefService).getBranch('gamefox.theme.css.'),

  init: function()
  {
    var defaults = [
        ['gamefox', 'gamefox-ads.css', 'Ad blocking', '', true],
        ['gamefox', 'gamefox-sidebar.css', 'Classic Sidebar', 'MichaelJBuck', false],
        ['gamefox', 'gamefox-essentials.css', 'Essentials', '', true],
        ['gamefox', 'gfcode.css', 'GFCode', 'Ant P.', true],
        ['gamefox', 'gamefox-quickpost.css', 'QuickPost', '', true],
        ['gamefox', 'gamefox-quickwhois.css', 'QuickWhois', '', true],
        ['bundled', 'ascii-art-font.css', 'ASCII art font', '', false],
        ['bundled', 'ricapar.css', 'Classic', 'Ricapar', false],
        ['bundled', 'toad.css', 'Ten On A Diet', 'TakatoMatsuki', false],
        ['bundled', 'wide-layout.css', 'Wide default', '', false]
        ];
    for (var i = 0; i < defaults.length; i++)
    {
      var j = defaults[i];
      this.add(j[0], 'chrome://gamefox/content/css/' + j[1], j[1], j[2], j[3], j[4], true);
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

        // deal with user styles that are now bundled
        if (css['user'][j] != undefined && css[i][j] != undefined)
        {
          if (css['user'][j]['enabled'].toString() == 'true')
            css[i][j]['enabled'] = true;
          delete css['user'][j];
          this.prefs.setCharPref('serialized', css.toSource());
        }
      }
    }
  },

  userimport: function(uri)
  {
    if (!uri.length) return;
    if (!/\.(css|txt)$/.test(uri)) return;

    var filename = uri.substr(uri.lastIndexOf('/') + 1);

    if (!this.add('user', uri, filename, filename, '', true))
      return false;
    this.populate(document.getElementById('css-tree'));
    this.treeView.toggleOpenState(2);

    document.getElementById('css-import-file').value = '';
  },

  filepicker: function()
  {
    var filepicker = Cc['@mozilla.org/filepicker;1'].createInstance(
        Ci.nsIFilePicker);
    filepicker.init(window, 'Import Stylesheet', Ci.nsIFilePicker.modeOpen);
    filepicker.appendFilter('Stylesheets (*.css;*.txt)', '*.css; *.txt');

    if (filepicker.show() == Ci.nsIFilePicker.returnOK)
    {
      var uri = filepicker.fileURL.QueryInterface(Ci.nsIURI);
      document.getElementById('css-import-file').value = uri.spec;
    }
  },

  add: function(cat, uri, filename, title, author, enabled, overwrite)
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
    if (css[cat][filename]) // the stylesheet already exists, don't touch its enabled status
      enabled = css[cat][filename]['enabled'];

    css[cat][filename] = {
      'title': title, 'author': author, 'enabled': enabled
    }

    // changing categories
    for (i in css)
    {
      if (css[i][filename] && cat != i)
        delete css[i][filename];
    }

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
    for (var category in categories)
    {
      this.treeView.visibleData.push([[category], true, false]);
      for (var sheet in css[categories[category]])
      {
        var cat = categories[category];
        if (!this.treeView.childData[category])
          this.treeView.childData[category] = [[
            css[cat][sheet]['title'],
            css[cat][sheet]['author'],
            css[cat][sheet]['enabled'],
            sheet, // filename, stored in an invisible column. used to uniquely
                   // identify what stylesheet a particular row belongs to
            cat
          ]];
        else
          this.treeView.childData[category].push([
              css[cat][sheet]['title'],
              css[cat][sheet]['author'],
              css[cat][sheet]['enabled'],
              sheet,
              cat
          ]);
      }
    }

    this.treeView.isEditable = function(idx, column)
    {
      if (this.isContainer(idx)) return false;
      if (column.index == 2) return true;
      if (this.visibleData[idx][0][4] == 'user') return true;
    }
    this.treeView.setCellText = this.setCell;
    this.treeView.setCellValue = this.setCell;

    element.view = this.treeView;

    this.treeView.selection.clearSelection();
    this.treeView.selection.select(0);

    // this is sort of a hack, I couldn't be bothered with finding out how to push data
    // directly to treeView.visibleData when populating the tree
    this.treeView.toggleOpenState(0);
    this.treeView.toggleOpenState(this.treeView.childData['GameFOX'].length + 1);
    this.treeView.toggleOpenState(this.treeView.childData['GameFOX'].length +
        this.treeView.childData['GameFAQs'].length + 2);
  },

  onselect: function()
  {
    try
    {
      var category = GFcss.treeView.visibleData[GFcss.treeView.selection.currentIndex][0][4];
      document.getElementById('css-remove').setAttribute('disabled', category != 'user');
    }
    catch (e)
    {
      // nothing selected
      document.getElementById('css-remove').setAttribute('disabled', true);
    }
  },

  setCell: function(idx, column, value)
  {
    this.visibleData[idx][0][column.index] = value;

    var filename = this.visibleData[idx][0][3];
    var category = this.visibleData[idx][0][4];
    // Map column to associative array in pref
    var map = new Array('title', 'author', 'enabled');

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
    var filename = this.treeView.visibleData[this.treeView.selection.currentIndex][0][3];
    var category = this.treeView.visibleData[this.treeView.selection.currentIndex][0][4];

    if (category != 'user')
      return false;

    this.remove(category, filename);
    this.populate(document.getElementById('css-tree'));
  }
};
