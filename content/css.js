/* vim: set et sw=2 sts=2 ts=2: */
var GameFOXCSS =
{
  init: function()
  {
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-standard-default.css', 'gamefox-standard-default.css',
        'Standard Default', 'GameFOX devs', 'gfaqs10,9', true);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-standard-default-old.css', 'gamefox-standard-default-old.css',
        'Standard Default (old quickpost)', 'GameFOX devs', 'gfaqs10,9', false);
    this.add('gamefox', 'chrome://gamefox/content/css/gamefox-classic-default.css', 'gamefox-classic-default.css',
        'Classic Default', 'GameFOX devs', 'gfaqs9', false);
    
    this.add('bundled', 'chrome://gamefox/content/css/wide-layout.css', 'wide-layout.css',
        'Wide Default Layout', '', 'gfaqs10', false);
    this.add('bundled', 'chrome://gamefox/content/css/gamefox-no-sidebar.css', 'gamefox-no-sidebar.css',
        'Sidebar Remover for Classic', '', 'gfaqs9', false);
    this.add('bundled', 'chrome://gamefox/content/css/classic-theme-by-jero.net.css', 'classic-theme-by-jero.net.css',
        'Classic Theme', 'Jero', 'gfaqs9', false);
    this.add('bundled', 'chrome://gamefox/content/css/gamefox_sidebar.css', 'gamefox_sidebar.css',
        'Classic GameFOX Sidebar', 'Michael J Buck', 'gfaqs10,9', false);
    this.add('bundled', 'chrome://gamefox/content/css/aquatakat.css', 'aquatakat.css',
        'GameFAQs Alternate', 'Aquatakat', 'gfaqs9', false);
    this.add('bundled', 'chrome://gamefox/content/css/gfaqs-smooth.css', 'gfaqs-smooth.css',
        'GameFAQs Smooth', 'headbanger', 'gfaqs9', false);
    this.add('bundled', 'chrome://gamefox/content/css/midnight-shade.css', 'midnight-shade.css',
        'Midnight Shade', 'Jero', 'gfaqs9', false);
    this.add('bundled', 'chrome://gamefox/content/css/ricapar.css', 'ricapar.css',
        'Classic Theme', 'Ricapar', 'gfaqs9', false);
  },

  add: function(cat, uri, filename, title, author, compat, enabled)
  {
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
    if (file.exists()) {
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

  populate: function(element)
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
        Components.interfaces.nsIPrefService).getBranch('gamefox.');

    var css = eval(prefs.getCharPref('theme.css.serialized'));

    for (var category in {"GameFOX":"", "Bundled":"", "User":""})
    {
      treeView.visibleData.push([[category], true, false]);
      for (var sheet in css[category.toLowerCase()])
      {
        var cat = category.toLowerCase();
        if (!treeView.childData[category])
          treeView.childData[category] = [[
            css[cat][sheet]["title"],
            css[cat][sheet]["author"],
            css[cat][sheet]["compat"],
            css[cat][sheet]["enabled"]
          ]];
        else
          treeView.childData[category].push([
              css[cat][sheet]["title"],
              css[cat][sheet]["author"],
              css[cat][sheet]["compat"],
              css[cat][sheet]["enabled"]
          ]);
      }
    }

    element.view = treeView;
  }
}
