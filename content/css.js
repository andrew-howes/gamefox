/* vim: set et sw=2 sts=2 ts=2: */

var GameFOXCSS =
{
  init: function()
  {
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-essentials.css', 'gamefox-essentials.css',
        'Essentials', 'GameFOX devs', '', true, true);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-ads.css', 'gamefox-ads.css',
        'Ad blocking', 'GameFOX devs', '', true, true);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-quickpost.css', 'gamefox-quickpost.css',
        'QuickPost', 'GameFOX devs', '', true, true);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-quickpost-old.css', 'gamefox-quickpost-old.css',
        'QuickPost (0.5)', 'GameFOX devs', '', false, true);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-quickwhois.css', 'gamefox-quickwhois.css',
        'QuickWhois', 'GameFOX devs', '', true, true);
    this.add('gamefox', 'chrome://gamefox/content/css/gfcode.css', 'gfcode.css',
        'GFCode', 'Ant P.', '', true, true);

    this.add('bundled', 'chrome://gamefox/content/css/wide-layout.css', 'wide-layout.css',
        'Wide Default Layout', '', '', false, true);

    // Remove old stylesheets
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
        Components.interfaces.nsIPrefService).getBranch('gamefox.');

    var css = eval(prefs.getCharPref('theme.css.serialized'));
    for (i in {"gamefox":"", "bundled":""})
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
    if (!uri.length) return;
    if (!uri.match(/\.(css|txt)$/)) return;

    var filename = uri.split('/');
    filename = filename[filename.length - 1];
    
    if (!this.add('user', uri, filename, filename, '', '', false))
      return false;
    this.populate(document.getElementById('css-tree'));
    this.treeView.toggleOpenState(2);

    document.getElementById('css-import-file').value = '';
  },

  filepicker: function()
  {
    var filepicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(
        Components.interfaces.nsIFilePicker);
    filepicker.init(window, 'Import Stylesheet', Components.interfaces.nsIFilePicker.modeOpen);
    filepicker.appendFilter('Stylesheets', '*.css; *.txt');

    if (filepicker.show() == Components.interfaces.nsIFilePicker.returnOK)
    {
      var uri = filepicker.fileURL.QueryInterface(Components.interfaces.nsIURI);
      document.getElementById('css-import-file').value = uri.spec;
    }
  },

  add: function(cat, uri, filename, title, author, compat, enabled, overwrite)
  {
    overwrite = (overwrite == null ? false : overwrite);
    var file = Components.classes['@mozilla.org/file/local;1'].getService(
        Components.interfaces.nsILocalFile);
    var foStream = Components.classes['@mozilla.org/network/file-output-stream;1'].getService(
        Components.interfaces.nsIFileOutputStream);
    var siStream = Components.classes['@mozilla.org/scriptableinputstream;1'].getService(
        Components.interfaces.nsIScriptableInputStream);
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
        Components.interfaces.nsIPrefService).getBranch('gamefox.');

    file.initWithPath(this.getDirectory());
    file.append(filename);
    if (overwrite == false && file.exists()) {
      var d = new Date();
      filename = filename.replace(/\.(css|txt)$/, d.getTime() + ".$1");
      file.initWithPath(this.getDirectory());
      file.append(filename);
      delete d;
    }

    try
    {
      var channel = Components.classes['@mozilla.org/network/io-service;1'].getService(
          Components.interfaces.nsIIOService).newChannel(uri, null, null);
      var input = channel.open();
      siStream.init(input);
      var fileData = siStream.read(input.available());
      siStream.close();
      input.close();
    }
    catch (e)
    {
      alert('There was an error importing the stylesheet:\n' + e);
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
      alert('There was an error writing the stylesheet to its destination:\n' + e);
      return false;
    }
    
    var css = eval(prefs.getCharPref('theme.css.serialized'));
    if (css[cat][filename]) // the stylesheet already exists, don't touch its enabled status
      enabled = css[cat][filename]['enabled'];

    css[cat][filename] = {
      'title': title, 'author': author, 'compat': compat, 'enabled': enabled
    }

    prefs.setCharPref('theme.css.serialized', css.toSource());
    return true;
  },

  getDirectory: function()
  {
    var directory = Components.classes['@mozilla.org/file/directory_service;1'].getService(
        Components.interfaces.nsIProperties).get('ProfD', Components.interfaces.nsIFile);
    
    try
    {
      directory.append('gamefox');
      directory.append('css');

      if (!directory.exists())
        directory.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

      return directory.path;
    }
    catch (e)
    {
      alert('Caught exception while creating the CSS directory:\n' + e);
      return false;
    }
  },

  reload: function()
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
        Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var sss = Components.classes['@mozilla.org/content/style-sheet-service;1'].getService(
        Components.interfaces.nsIStyleSheetService);
    var file = Components.classes['@mozilla.org/file/local;1'].getService(
        Components.interfaces.nsILocalFile);
    var css = eval(prefs.getCharPref('theme.css.serialized'));

    for (var category in css)
    {
      for (var filename in css[category])
      {
        try
        {
          file.initWithPath(this.getDirectory());
          file.append(filename);
          var uri = Components.classes['@mozilla.org/network/io-service;1'].getService(
              Components.interfaces.nsIIOService).newFileURI(file, null, null);

          if (sss.sheetRegistered(uri, sss.USER_SHEET))
            sss.unregisterSheet(uri, sss.USER_SHEET);

          if (css[category][filename]['enabled'].toString() == "true")
            sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
        }
        catch (e if e.name == "NS_ERROR_FILE_NOT_FOUND")
        {
          if (category == "user") // user stylesheet, remove it
          {
            this.remove(category, filename);
            if (document.getElementById('css-tree'))
              this.populate(document.getElementById('css-tree'));
          }
          else // gamefox stylesheet, restore it
          {
            if (this.add(category, "chrome://gamefox/content/css/" + filename, filename,
                css[category][filename]["title"], css[category][filename]["author"],
                null, true))
              this.reload(); // oh no, a recursive function call!
                             // it should be all right as this is only done if re-adding the sheet was successful
          }
        }
      }
    }
  },

  populate: function(element)
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
        Components.interfaces.nsIPrefService).getBranch('gamefox.');

    var css = eval(prefs.getCharPref('theme.css.serialized'));

    this.treeView = treeView; // we don't want to mess with treeView directly as it's supposed
                              // to be a generic class
    this.treeView.childData = {};
    this.treeView.visibleData = [];
    for (var category in {"GameFOX":"", "Bundled":"", "User":""})
    {
      this.treeView.visibleData.push([[category], true, false]);
      for (var sheet in css[category.toLowerCase()])
      {
        var cat = category.toLowerCase();
        if (!this.treeView.childData[category])
          this.treeView.childData[category] = [[
            css[cat][sheet]["title"],
            css[cat][sheet]["author"],
            css[cat][sheet]["compat"],
            css[cat][sheet]["enabled"],
            sheet, // filename, stored in an invisible column. used to uniquely
                   // identify what stylesheet a particular row belongs to
            cat
          ]];
        else
          this.treeView.childData[category].push([
              css[cat][sheet]["title"],
              css[cat][sheet]["author"],
              css[cat][sheet]["compat"],
              css[cat][sheet]["enabled"],
              sheet,
              cat
          ]);
      }
    }

    this.treeView.isEditable = function(idx, column)
    {
      if (this.isContainer(idx)) return false;
      if (column.index == 3) return true;
      if (this.visibleData[idx][0][5] == "user") return true;
    }
    this.treeView.setCellText = this.setCell;
    this.treeView.setCellValue = this.setCell;

    element.view = this.treeView;

    document.getElementById('css-remove').disabled = true;

    // this is sort of a hack, I couldn't be bothered with finding out how to push data
    // directly to treeView.visibleData when populating the tree
    this.treeView.toggleOpenState(0);
    this.treeView.toggleOpenState(this.treeView.childData["GameFOX"].length + 1);
    this.treeView.toggleOpenState(this.treeView.childData["GameFOX"].length +
        this.treeView.childData["Bundled"].length + 2);
  },

  onselect: function()
  {
    var category = GameFOXCSS.treeView.visibleData[GameFOXCSS.treeView.selection.currentIndex][0][5];
    if (category == 'user')
      document.getElementById('css-remove').setAttribute('disabled', 'false');
    else
      document.getElementById('css-remove').setAttribute('disabled', 'true');
  },

  setCell: function(idx, column, value)
  {
    this.visibleData[idx][0][column.index] = value;

    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
        Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var filename = this.visibleData[idx][0][4];
    var category = this.visibleData[idx][0][5];
    // Map column to associative array in pref
    var map = new Array('title', 'author', 'compat', 'enabled');

    var css = eval(prefs.getCharPref('theme.css.serialized'));
    css[category][filename][map[column.index]] = value;
    prefs.setCharPref('theme.css.serialized', css.toSource());

    this.selection.clearSelection();
    this.selection.select(idx);

    GameFOXCSS.reload();
  },

  remove: function(category, filename)
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
        Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var file = Components.classes['@mozilla.org/file/local;1'].getService(
        Components.interfaces.nsILocalFile);
    var css = eval(prefs.getCharPref('theme.css.serialized'));

    var sss = Components.classes['@mozilla.org/content/style-sheet-service;1'].getService(
        Components.interfaces.nsIStyleSheetService);
    var file = Components.classes['@mozilla.org/file/local;1'].getService(
        Components.interfaces.nsILocalFile);

    file.initWithPath(this.getDirectory());
    file.append(filename);

    var uri = Components.classes['@mozilla.org/network/io-service;1'].getService(
        Components.interfaces.nsIIOService).newFileURI(file, null, null);
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
    prefs.setCharPref('theme.css.serialized', css.toSource());
  },

  removeWithTree: function()
  {
    var filename = this.treeView.visibleData[this.treeView.selection.currentIndex][0][4];
    var category = this.treeView.visibleData[this.treeView.selection.currentIndex][0][5];

    if (category != 'user')
      return false;

    this.remove(category, filename);
    this.populate(document.getElementById('css-tree'));
  }
}
