/* vim: set et sw=2 sts=2 ts=2: */
const Cc = Components.classes, Ci = Components.interfaces;

var GameFOXCSS =
{
  init: function()
  {
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-standard-default.css', 'gamefox-standard-default.css',
        'Standard Default', 'GameFOX devs', 'gfaqs10,9', true, true);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-standard-default-old.css', 'gamefox-standard-default-old.css',
        'Standard Default (old quickpost)', 'GameFOX devs', 'gfaqs10,9', false, true);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-classic-default.css', 'gamefox-classic-default.css',
        'Classic Default', 'GameFOX devs', 'gfaqs9', false, true);
    
    this.add('bundled', 'chrome://gamefox/content/css/wide-layout.css', 'wide-layout.css',
        'Wide Default Layout', '', 'gfaqs10', false, true);
    this.add('bundled', 'chrome://gamefox/content/css/gamefox-no-sidebar.css', 'gamefox-no-sidebar.css',
        'Sidebar Remover for Classic', '', 'gfaqs9', false, true);
    this.add('bundled', 'chrome://gamefox/content/css/classic-theme-by-jero.net.css', 'classic-theme-by-jero.net.css',
        'Classic Theme', 'Jero', 'gfaqs9', false, true);
    this.add('bundled', 'chrome://gamefox/content/css/gamefox_sidebar.css', 'gamefox_sidebar.css',
        'Classic GameFOX Sidebar', 'Michael J Buck', 'gfaqs10,9', false, true);
    this.add('bundled', 'chrome://gamefox/content/css/aquatakat.css', 'aquatakat.css',
        'GameFAQs Alternate', 'Aquatakat', 'gfaqs9', false, true);
    this.add('bundled', 'chrome://gamefox/content/css/gfaqs-smooth.css', 'gfaqs-smooth.css',
        'GameFAQs Smooth', 'headbanger', 'gfaqs9', false, true);
    this.add('bundled', 'chrome://gamefox/content/css/midnight-shade.css', 'midnight-shade.css',
        'Midnight Shade', 'Jero', 'gfaqs9', false, true);
    this.add('bundled', 'chrome://gamefox/content/css/ricapar.css', 'ricapar.css',
        'Classic Theme', 'Ricapar', 'gfaqs9', false, true);
  },

  userimport: function(uri)
  {
    var filename = uri.split('/');
    filename = filename[filename.length - 1];
    
    this.add('user', uri, filename, filename, '', '', false);
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
    
    // css.serialized pref magic
   
    var css = eval(prefs.getCharPref('theme.css.serialized'));

    css[cat][filename] = {
      'title': title, 'author': author, 'compat': compat, 'enabled': enabled
    }

    prefs.setCharPref('theme.css.serialized', css.toSource());
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
        file.initWithPath(this.getDirectory());
        file.append(filename);
        var uri = Components.classes['@mozilla.org/network/io-service;1'].getService(
            Components.interfaces.nsIIOService).newFileURI(file, null, null);

        if (sss.sheetRegistered(uri, sss.USER_SHEET))
          sss.unregisterSheet(uri, sss.USER_SHEET);

        if (css[category][filename]['enabled'].toString() == "true")
          sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
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

    // treeView.selectionChanged doesn't seem to be called?
    element.addEventListener('click', function() {
      var category = GameFOXCSS.treeView.visibleData[GameFOXCSS.treeView.selection.currentIndex][0][5];
      if (category == 'user')
        document.getElementById('css-remove').setAttribute('disabled', 'false');
      else
        document.getElementById('css-remove').setAttribute('disabled', 'true');
    }, true);
    
    element.view = this.treeView;
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

    GameFOXCSS.reload();
  },

  removeWithTree: function()
  {
    var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).
      getBranch('gamefox.');
    var file = Cc['@mozilla.org/file/local;1'].getService(Ci.nsILocalFile);
    var css = eval(prefs.getCharPref('theme.css.serialized'));

    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(
        Ci.nsIStyleSheetService);
    var file = Cc['@mozilla.org/file/local;1'].getService(
        Ci.nsILocalFile);

    var filename = this.treeView.visibleData[this.treeView.selection.currentIndex][0][4];
    var category = this.treeView.visibleData[this.treeView.selection.currentIndex][0][5];

    if (category != 'user')
      return false;

    file.initWithPath(this.getDirectory());
    file.append(filename);
    file.remove(false);

    delete css[category][filename];
    prefs.setCharPref('theme.css.serialized', css.toSource());

    file.initWithPath(this.getDirectory());
    file.append(filename);
    var uri = Cc['@mozilla.org/network/io-service;1'].getService(
        Ci.nsIIOService).newFileURI(file, null, null);
    sss.unregisterSheet(uri, sss.USER_SHEET);

    this.populate(document.getElementById('css-tree'));
  }
}
