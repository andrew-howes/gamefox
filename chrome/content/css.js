/* vim: set et sw=2 sts=2 ts=2: */
var GameFOXCSS =
{
  cssVersion: '0.5.5.10',

  load: function()
  {
    var prefs        = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var cssList      = eval(prefs.getCharPref('css.disabled'));
    var cssApplied   = eval(prefs.getCharPref('css.enabled'));
    var ndCssList    = document.getElementById('gamefox-css-list');
    var ndCssApplied = document.getElementById('gamefox-css-applied');

    ndCssList.removeAllItems()
    ndCssApplied.removeAllItems();

    var cssListCount    = 0;
    var cssAppliedCount = 0;

    for (var sheet in cssList)
    {
      ndCssList.appendItem(cssList[sheet], sheet);
      cssListCount++;
    }

    for (var sheet in cssApplied)
    {
      ndCssApplied.appendItem(cssApplied[sheet], sheet);
      cssAppliedCount++;
    }

    ndCssList.setAttribute('label', 'Disabled sheets (' + cssListCount + ')');
    ndCssApplied.setAttribute('label', 'Enabled sheets (' + cssAppliedCount + ')');
  },

  browse: function()
  {
    var filePicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);
    filePicker.init(window, 'Select a CSS File', Components.interfaces.nsIFilePicker.modeOpen)
    filePicker.appendFilter('CSS Files', '*.css; *.txt; *.xls');

    if (filePicker.show() == Components.interfaces.nsIFilePicker.returnOK)
    {
      var URI = filePicker.fileURL.QueryInterface(Components.interfaces.nsIURI);
      document.getElementById('gamefox-css-remote-file').value = URI.spec;
      document.getElementById('gamefox-css-filename').value = URI.fileName;
      document.getElementById('gamefox-css-title').value = URI.fileBaseName;
    }
  },

  add: function(fileURI, fileName, fileTitle, noAlert)
  {
    var file       = Components.classes['@mozilla.org/file/local;1'].getService(Components.interfaces.nsILocalFile);
    var foStream   = Components.classes['@mozilla.org/network/file-output-stream;1'].getService(Components.interfaces.nsIFileOutputStream);
    var siStream   = Components.classes['@mozilla.org/scriptableinputstream;1'].getService(Components.interfaces.nsIScriptableInputStream);
    var prefs      = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    
    if (!fileURI || !fileName || !fileTitle)
    {
      fileURI    = document.getElementById('gamefox-css-remote-file').value;
      fileName   = document.getElementById('gamefox-css-filename').value;
      fileTitle  = document.getElementById('gamefox-css-title').value;
    }

    if (fileURI == '' || fileName == '' || fileTitle == '')
    {
      alert('Please enter a URI, filename, and title for your CSS.');
      return;
    }

    try
    {
      file.initWithPath(this.getCSSDir()[0].path);
      file.append(fileName);

      if (file.exists())
      {
        if (!noAlert && !confirm(fileName + " exists\nOverwrite it?"))
        {
          return;
        }

        var overwrite = true;
      }
    }
    catch (e)
    {
      alert('There was an error checking filename for existence: ' + e);
      return;
    }

    try
    {
      var channel = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService).newChannel(fileURI, null, null);
      var input   = channel.open();
      siStream.init(input);
      var fileData = siStream.read(input.available());
      siStream.close();
      input.close();
    }
    catch (e)
    {
      alert('There was an error importing your CSS: ' + e);
      return;
    }

    try
    {
      foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
      foStream.write(fileData, fileData.length);
      foStream.close();
    }
    catch (e)
    {
      alert('There was an error writing the CSS to GameFOX in your profile folder: ' + e);
      return;
    }

    var cssApplied = eval(prefs.getCharPref('css.enabled'));

    if (overwrite && fileName in cssApplied)
    {
      cssApplied[fileName] = fileTitle;
      prefs.setCharPref('css.enabled', cssApplied.toSource());
      var animate = 'gamefox-css-applied';
    }
    else
    {
      var cssList = eval(prefs.getCharPref('css.disabled'));
      cssList[fileName] = fileTitle;
      prefs.setCharPref('css.disabled', cssList.toSource());
      var animate = 'gamefox-css-list';
    }

    this.load();

    if (!noAlert)
    {
      alert('Successfully added ' + fileTitle);
    }
    this.animate(document.getElementById(animate));
  },

  enable: function()
  {
    var prefs      = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var cssList    = eval(prefs.getCharPref('css.disabled'));
    var cssApplied = eval(prefs.getCharPref('css.enabled'));
    var ndCssList  = document.getElementById('gamefox-css-list');

    if (!ndCssList.selectedItem)
    {
      return;
    }

    delete cssList[ndCssList.selectedItem.value];
    cssApplied[ndCssList.selectedItem.value] = ndCssList.selectedItem.label;
    prefs.setCharPref('css.disabled', cssList.toSource());
    prefs.setCharPref('css.enabled', cssApplied.toSource());
    this.registerSheet(ndCssList.selectedItem.value, false);
    this.load();
    this.animate(document.getElementById('gamefox-css-applied'));
  },

  disable: function()
  {
    var prefs        = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var cssList      = eval(prefs.getCharPref('css.disabled'));
    var cssApplied   = eval(prefs.getCharPref('css.enabled'));
    var ndCssApplied = document.getElementById('gamefox-css-applied');

    if (!ndCssApplied.selectedItem)
    {
      return;
    }

    delete cssApplied[ndCssApplied.selectedItem.value];
    cssList[ndCssApplied.selectedItem.value] = ndCssApplied.selectedItem.label;
    prefs.setCharPref('css.disabled', cssList.toSource());
    prefs.setCharPref('css.enabled', cssApplied.toSource());
    this.registerSheet(ndCssApplied.selectedItem.value, true);
    this.load();
    this.animate(document.getElementById('gamefox-css-list'));
  },

  discard: function()
  {
    var ndCssList  = document.getElementById('gamefox-css-list');

    if (!ndCssList.selectedItem || !confirm('Really discard sheet?'))
    {
      return;
    }

    var prefs      = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var file       = Components.classes['@mozilla.org/file/local;1'].getService(Components.interfaces.nsILocalFile);
    var cssList    = eval(prefs.getCharPref('css.disabled'));

    file.initWithPath(this.getCSSDir()[0].path);
    file.append(ndCssList.selectedItem.value);
    file.remove(false);

    delete cssList[ndCssList.selectedItem.value];
    prefs.setCharPref('css.disabled', cssList.toSource());
    this.load();
    this.animate(ndCssList);
  },

  registerSheet: function(fileName, unregister)
  {
    var file = Components.classes['@mozilla.org/file/local;1'].getService(Components.interfaces.nsILocalFile);
    var sss  = Components.classes['@mozilla.org/content/style-sheet-service;1'].getService(Components.interfaces.nsIStyleSheetService);

    file.initWithPath(this.getCSSDir()[0].path);
    file.append(fileName);

    var cssURI = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService).newFileURI(file, null, null);

    if (sss.sheetRegistered(cssURI, sss.USER_SHEET))
    {
      if (unregister)
      {
        sss.unregisterSheet(cssURI, sss.USER_SHEET);
      }
    }
    else if (!unregister)
    {
      sss.loadAndRegisterSheet(cssURI, sss.USER_SHEET);
    }
  },

  reRegisterSheets: function()
  {
    var prefs      = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var cssDirPath = this.getCSSDir()[0].path;

    var sss        = Components.classes['@mozilla.org/content/style-sheet-service;1'].getService(Components.interfaces.nsIStyleSheetService);
    var file       = Components.classes['@mozilla.org/file/local;1'].getService(Components.interfaces.nsILocalFile);
    var cssApplied = eval(prefs.getCharPref('css.enabled'));
    var cssURI;

    for (var fileName in cssApplied)
    {
      file.initWithPath(cssDirPath);
      file.append(fileName);
      cssURI = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService).newFileURI(file, null, null);

      if (sss.sheetRegistered(cssURI, sss.USER_SHEET))
      {
        sss.unregisterSheet(cssURI, sss.USER_SHEET);
      }

      sss.loadAndRegisterSheet(cssURI, sss.USER_SHEET);
    }

    cssDirPath = sss = file = cssURI = null;
  },

  animate: function(node)
  {
    node.setAttribute('style', '-moz-opacity: 0.3');
    setTimeout(function () { node.setAttribute('style', '-moz-opacity: 0.4') }, 100);
    setTimeout(function () { node.setAttribute('style', '-moz-opacity: 0.5') }, 200);
    setTimeout(function () { node.setAttribute('style', '-moz-opacity: 0.6') }, 300);
    setTimeout(function () { node.setAttribute('style', '-moz-opacity: 0.7') }, 400);
    setTimeout(function () { node.setAttribute('style', '-moz-opacity: 0.8') }, 500);
    setTimeout(function () { node.setAttribute('style', '-moz-opacity: 0.9') }, 600);
    setTimeout(function () { node.setAttribute('style', '-moz-opacity: 1.0') }, 650);
  },

  getCSSDir: function()
  {
    var cssDir = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get('ProfD', Components.interfaces.nsIFile);
    try
    {
      cssDir.append('gamefox');
      cssDir.append('css');

      if (!cssDir.exists())
      {
        cssDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
        return [cssDir, true];
      }

      return [cssDir, false];
    }
    catch (e)
    {
      alert('Shit! Error creating your GameFOX CSS directory. Alert the creator: ' + e);
      return [false, false];
    }
  },

  initSystem: function()
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
    try
    {
      var lastVersion = prefs.getCharPref('gamefox.lastVersion');
      var compareResult = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator).compare(lastVersion, this.cssVersion);
      if (compareResult != 0)
      {
        if (lastVersion.match(/^0\.5\.[0-4]\d$/g)) // if old version numbering
        {
          throw Components.results.NS_ERROR_FAILURE;
        }
        else if (compareResult < 0) // if lastVersion is older than current
        {
          throw Components.results.NS_ERROR_FAILURE;
        }
        else if (compareResult > 0)
        {
          return;
        }
      }
    }
    catch (e)
    {
      if (this.getCSSDir()[0])
      {
        this.add('chrome://gamefox/content/css/gamefox-classic-default.css', 'gamefox-classic-default.css', 'GameFOX Default for Classic View', true);
        this.add('chrome://gamefox/content/css/gamefox-standard-default.css', 'gamefox-standard-default.css', 'GameFOX Default for Standard View*', true);
        this.add('chrome://gamefox/content/css/gamefox-standard-default-old.css', 'gamefox-standard-default-old.css',
            'GameFOX Default for Standard View (Old)*', true);
        this.add('chrome://gamefox/content/css/gamefox-no-sidebar.css', 'gamefox-no-sidebar.css', 'Sidebar Remover for Classic View', true);
        this.add('chrome://gamefox/content/css/classic-theme-by-jero.net.css', 'classic-theme-by-jero.net.css', 'Classic Theme By http://jero.net', true);
        this.add('chrome://gamefox/content/css/gamefox_sidebar.css', 'gamefox_sidebar.css', 'Michael J Buck\'s Sidebar*', true);
        this.add('chrome://gamefox/content/css/aquatakat.css', 'aquatakat.css', 'GameFAQs Alternate By Aquatakat', true);
        this.add('chrome://gamefox/content/css/gfaqs-smooth.css', 'gfaqs-smooth.css', 'GameFAQs Smooth By headbanger', true);
        this.add('chrome://gamefox/content/css/midnight-shade.css', 'midnight-shade.css', 'Midnight Shade By http://jero.net', true);
        this.add('chrome://gamefox/content/css/gamefox.0.4.x.css', 'gamefox.0.4.x.css', 'GameFOX 0.4.x By Toad King/Calvinjpwalker', true);
        this.add('chrome://gamefox/content/css/ricapar.css', 'ricapar.css', 'Ricapar\'s Classic Theme**', true);
        this.add('chrome://gamefox/content/css/wide-layout.css', 'wide-layout.css', 'Wide Default Layout*', true);
        this.reRegisterSheets();
      }
    }
    prefs.setCharPref('gamefox.lastVersion', this.cssVersion);
  }
};
