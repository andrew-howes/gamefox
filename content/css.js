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

var gamefox_css =
{
  init: function()
  {
    var defaults = [
        ['gamefox', 'gamefox-character-map.css', 'Character map',
              'Makes the character map look pretty.', '', true],
        ['gamefox', 'gamefox-sidebar.css', 'Classic sidebar',
              'A classic style for the GameFOX sidebar.', '', false],
        ['gamefox', 'gamefox-essentials.css', 'Essentials',
              'Works with some of GameFOX\'s features. Should always be enabled.', '', true],
        ['gamefox', 'gfcode.css', 'GFCode',
              'Makes quotes look pretty.', 'Ant P.', true],
        ['gamefox', 'gamefox-quickpost.css', 'QuickPost',
              'Makes QuickPost look pretty.', '', true],
        ['gamefox', 'gamefox-quickwhois.css', 'QuickWhois',
              'Makes QuickWhois look pretty.', '', true],
        ['bundled', 'gamefox-ads.css', 'Ad blocking',
              'Hides ads. Best used with "block ad servers" enabled.', '', true],
        ['bundled', 'ascii-art-font.css', 'ASCII art font',
              'Increases the font size of messages to make ASCII art look better.',
              '', false],
        ['bundled', 'capitalized-message-links.css', 'Capitalized message links',
              'Capitalizes the links in message headers.', '', false],
        ['bundled', 'ricapar.css', 'Classic',
              'Emulates the 2001-2004 style of GameFAQs. Disable main ' +
              'GameFAQs stylesheets to use.', 'Ricapar', false],
        ['bundled', 'hide-signatures.css', 'Hide signatures',
              'Hides signatures in posts and shows them again when hovered over.', '', false],
        ['bundled', 'message-link-icons.css', 'Message link icons',
              'Converts links in the message header (message detail, delete, filter, quote)'
                + ' to icons.\n\nIcons courtesy of http://www.pinvoke.com/',
              'Poo Poo Butter', false],
        ['bundled', 'status-default.css', 'Status icons (normal)',
              'Only show topic status icons for closed/sticky topics. This CSS ' +
              'conflicts with "Status icons (classic)".', '', false],
        ['bundled', 'status-classic.css', 'Status icons (classic)',
              'Only show topic status icons for closed/sticky topics - ' +
              'emulates the pre-2006 style of icons. This CSS ' +
              'conflicts with "Status icons (normal)".', '', false],
        ['bundled', 'tweaks.css', 'Tweaks', 'Tweaks for GameFAQs\' stylesheet.', '', true],
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
    var css = gamefox_lib.safeEval(gamefox_utils.getString('theme.css.serialized'));
    for (i in {'gamefox':'', 'bundled':''})
    {
      for (j in css[i])
      {
        try
        {
          var input = Cc['@mozilla.org/network/io-service;1']
            .getService(Ci.nsIIOService)
            .newChannel('chrome://gamefox/content/css/' + j, null, null)
            .open(); // throws when not in jar
          input.available(); // throws when in jar
          input.close();
        }
        catch (e)
        {
          gamefox_lib.log('Old bundled stylesheet "' + j + '" removed.');
          this.remove(i, j);
        }
      }
    }
  },

  add: function(cat, uri, filename, title, desc, author, enabled, overwrite)
  {
    overwrite = (overwrite == null ? false : overwrite);
    var file = Cc['@mozilla.org/file/local;1']
      .getService(Ci.nsILocalFile);
    var foStream = Cc['@mozilla.org/network/file-output-stream;1']
      .getService(Ci.nsIFileOutputStream);
    var siStream = Cc['@mozilla.org/scriptableinputstream;1']
      .getService(Ci.nsIScriptableInputStream);

    file.initWithPath(this.getDirectoryPath());
    file.append(filename);
    if (overwrite == false && file.exists()) {
      filename = filename.replace(/\.(css|txt)$/, new Date().getTime() + '.$1');
      file.initWithPath(this.getDirectoryPath());
      file.append(filename);
    }

    try
    {
      var channel = Cc['@mozilla.org/network/io-service;1']
        .getService(Ci.nsIIOService)
        .newChannel(uri, null, null);
      var input = channel.open();
      siStream.init(input);
      var fileData = siStream.read(input.available());
      siStream.close();
      input.close();
    }
    catch (e)
    {
      gamefox_lib.alert('There was an error importing the stylesheet:\n' + e);
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
      gamefox_lib.alert('There was an error writing the stylesheet to its destination:\n' + e);
      return false;
    }

    var css = gamefox_lib.safeEval(gamefox_utils.getString('theme.css.serialized'));

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

    gamefox_utils.setString('theme.css.serialized', gamefox_lib.toJSON(css));
    return true;
  },

  getDirectory: function()
  {
    var directory = Cc['@mozilla.org/file/directory_service;1']
      .getService(Ci.nsIProperties)
      .get('ProfD', Ci.nsILocalFile);

    directory.append('gamefox');
    directory.append('css');

    return directory;
  },

  getDirectoryPath: function()
  {
    var directory = this.getDirectory();

    if (!directory.exists())
    {
      try
      {
        directory.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
      }
      catch (e) // TODO: what are we catching here?
      {
        gamefox_lib.alert('There was an error creating the CSS directory:\n' + e);
        return false;
      }
    }

    return directory.path;
  },

  reload: function(inOptions)
  {
    var sss = Cc['@mozilla.org/content/style-sheet-service;1']
      .getService(Ci.nsIStyleSheetService);
    var file = Cc['@mozilla.org/file/local;1']
      .getService(Ci.nsILocalFile);
    var css = gamefox_lib.safeEval(gamefox_utils.getString('theme.css.serialized'));

    for (var category in css)
    {
      for (var filename in css[category])
      {
        try
        {
          file.initWithPath(this.getDirectoryPath());
          file.append(filename);
          var uri = Cc['@mozilla.org/network/io-service;1']
            .getService(Ci.nsIIOService)
            .newFileURI(file, null, null);

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
            if (inOptions)
              GFstyleOptions.populate();
          }
          else // gamefox stylesheet, restore it
          {
            if (this.add(category, 'chrome://gamefox/content/css/' + filename, filename,
                css[category][filename]['title'], css[category][filename]['author'], true))
              // recursive call - ok as this is only done if re-adding the sheet was successful
              this.reload(inOptions);
          }
        }
      }
    }
  },

  remove: function(category, filename)
  {
    var sss = Cc['@mozilla.org/content/style-sheet-service;1']
      .getService(Ci.nsIStyleSheetService);
    var file = Cc['@mozilla.org/file/local;1']
      .getService(Ci.nsILocalFile);
    var css = gamefox_lib.safeEval(gamefox_utils.getString('theme.css.serialized'));

    file.initWithPath(this.getDirectoryPath());
    file.append(filename);

    var uri = Cc['@mozilla.org/network/io-service;1']
      .getService(Ci.nsIIOService)
      .newFileURI(file, null, null);
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
    gamefox_utils.setString('theme.css.serialized', gamefox_lib.toJSON(css));
  }
};
