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

/**
 * CSS manager handles adding, updating, deleting and toggling stylesheets
 * @namespace
 */
var gamefox_css =
{
  get list()
  {
    return gamefox_lib.parseJSON(gamefox_lib.getString('theme.css.serialized'))
      || {};
  },
  set list(data)
  {
    gamefox_lib.setString('theme.css.serialized', JSON.stringify(data));
  },

  /**
   * Determines what type a stylesheet should be registered as
   *
   * @param {String} cat
   *        Category of the stylesheet
   * @return {String} "AGENT_SHEET" or "USER_SHEET"
   */
  _getType: function(cat)
  {
    // AGENT_SHEET allows stylesheets to do more than USER_SHEET, but has the
    // potential to crash Firefox if used incorrectly, so it's only enabled for
    // the "GameFOX" CSS category
    // See <https://developer.mozilla.org/en/Using_the_Stylesheet_Service>
    return cat == 'gamefox' ? 'AGENT_SHEET' : 'USER_SHEET';
  },

  init: function()
  {
    var defaults = {
      gamefox: {
        'gamefox-character-map.css': ['Character map',
            'Makes the character map look pretty.', '', true],
        'gamefox-edit-viewer.css': ['Edit Viewer',
            'Make a visual distinction between current and past versions of '
              + 'posts (via the edit history menu).', '', true],
        'gamefox-essentials.css': ['Essentials',
            'Applies only to GameFOX features. Should always be enabled.', '', true],
        'gfcode.css': ['GFCode',
            'Adds quote and code elements to posts.', 'Ant P.', true],
        'gamefox-quickpost.css': ['QuickPost',
            'Makes QuickPost look pretty.', '', true],
        'gamefox-quickwhois.css': ['QuickWhois',
            'Makes QuickWhois look pretty.', '', true]},
      themes: {
        'ricapar.css': ['Classic',
            'Emulates the 2001-2004 style of GameFAQs. Disable main '
              + 'GameFAQs stylesheets to use.\n\n'
              + 'Use the following settings at '
              + 'http://www.gamefaqs.com/boards/settings.php:\n'
              + 'Topic List Display: Ad in topic list\n'
              + 'Message List Display: Ad in message list', 'Ricapar et al.',
            false],
        'gfpastel-2010.css': ['GFPastel 2010',
            'A modern stylesheet in pastel blues and purples. Disable main ' +
            'GameFAQs stylesheets to use.', 'spynae', false],
        'progfaqs.css': ['ProgFAQs',
            'A progressive, low contrast theme for GameFAQs. Disable main ' +
            'GameFAQs stylesheets to use.', 'spynae', false],
        'wide-layout.css': ['Wide default',
            'Increases the width of the page to fill the whole window. ' +
            'Works with the default GameFAQs skin.', '', false]},
      extras: {
        'gamefax-extras.css': ['GameFAX RetroClassic',
            'A companion for the GameFAX RetroClassic theme on GameFAQs (this '
              + 'must be enabled in your account settings). "Message Poster '
              + 'Display" should also be set to "Above Message" in your '
              + 'GameFAQs settings.\n\n'
              + 'This style only improves certain features with the GameFAX '
              + 'RetroClassic theme - it is not a full theme in itself.',
            'TakatoMatsuki', false],
        'ninestalgia-extras.css': ['Ninestalgia',
            'A companion for the Ninestalgia theme on GameFAQs (this must be '
              + 'enabled in your account settings). "Message Poster Display" '
              + 'should also be set to "Above Message" in your GameFAQs '
              + 'settings.\n\n'
              + 'This style only improves certain features with the '
              + 'Ninestalgia theme - it is not a full theme in itself.',
            'TakatoMatsuki', false],
        'ninestalgia-pink-extras.css': ['Ninestalgia Pink',
            'A companion for the Ninestalgia Pink theme on GameFAQs (this must'
              + ' be enabled in your account settings). "Message Poster '
              + 'Display" should also be set to "Above Message" in your '
              + 'GameFAQs settings.\n\n'
              + 'This style only improves certain features with the '
              + 'Ninestalgia Pink theme - it is not a full theme in itself.',
            'TakatoMatsuki', false],
        'retroclassic-extras.css': ['RetroClassic',
            'A companion for the RetroClassic theme on GameFAQs (this must be '
              + 'enabled in your account settings). "Message Poster Display" '
              + 'should also be set to "Above Message" in your GameFAQs '
              + 'settings.\n\n'
              + 'This style only improves certain features with the '
              + 'RetroClassic theme - it is not a full theme in itself.',
            'TakatoMatsuki', false],
        'spotfaqs-dark-extras.css': ['SpotFAQs Dark',
            'A companion for the SpotFAQs Dark theme on GameFAQs (this must be'
              + ' enabled in your account settings). "Message Poster Display" '
              + 'should also be set to "Left of Message" in your GameFAQs '
              + 'settings.\n\n'
              + 'This style only improves certain features with the '
              + 'SpotFAQs Dark theme - it is not a full theme in itself.',
            'TakatoMatsuki', false],
        'spotfaqs-light-extras.css': ['SpotFAQs Light',
            'A companion for the SpotFAQs Light theme on GameFAQs (this must '
              + 'be enabled in your account settings). "Message Poster '
              + 'Display" should also be set to "Left of Message" in your '
              + 'GameFAQs settings.\n\n'
              + 'This style only improves certain features with the '
              + 'SpotFAQs Light theme - it is not a full theme in itself.',
            'TakatoMatsuki', false]},
      bundled: {
        'gamefox-ads.css': ['Ad blocking',
            'Hides ads. Best used with "block ad servers" enabled.', '', true],
        'ascii-art-font.css': ['ASCII art font',
            'Increases the font size of messages to make ASCII art look better.',
            '', false],
        'capitalized-message-links.css': ['Capitalized message links',
            'Capitalizes the links in message headers.', '', false],
        'gamefox-sidebar.css': ['Classic GameFOX sidebar',
            'A classic theme for the GameFOX sidebar.', '', false],
        'FAQ-frames.css': ['FAQ frames', 'Styles the FAQ headers to look more like GameFAQs.',
            'selmiak', false],
        'hide-signatures.css': ['Hide signatures',
            'Hides signatures in posts and shows them again when hovered over.'
              , '', false],
        'new-pm.css': ['Highlight new PMs link', 'Highlights the "New '
              + 'Messages" link when there are new PMs.', '', true],
        'message-link-icons.css': ['Message link icons',
            'Converts links in the message header (message detail, delete, filter, quote)'
              + ' to icons.\n\nIcons courtesy of http://www.pinvoke.com/',
            'Poo Poo Butter', false],
        'remove-side-column.css': ['Remove side column',
            'Removes the side column containing your favorite boards from the '
              + 'User Info and Active Messages pages.', '', false],
        'remove-signatures.css': ['Remove signatures',
            'Removes signatures in posts.', '', false],
        'status-default.css': ['Status icons (normal)',
            'Only show topic status icons for closed/sticky topics. This CSS ' +
            'conflicts with "Status icons (classic)".', '', false],
        'status-classic.css': ['Status icons (classic)',
            'Only show topic status icons for closed/sticky topics - ' +
            'emulates the pre-2006 style of icons. This CSS ' +
            'conflicts with "Status icons (normal)".', '', false]}
    };

    // (Re-)add bundled
    var errors = {};
    var result, info;
    for (var cat in defaults)
    {
      for (var file in defaults[cat])
      {
        info = defaults[cat][file];
        result = this.add(cat, 'chrome://gamefox/content/css/' + file, file,
            info[0], info[1], info[2], info[3], true);

        // If there's an error, add it to the list
        if (typeof result == 'object')
        {
          // result[0] = error code (string)
          // result[1] = exception
          if (!(result[0] in errors))
            errors[result[0]] = [result[1], []];

          errors[result[0]][1].push(file);
        }
      }
    }

    // Give one alert per error type
    for (var error in errors)
    {
      var fileList = errors[error][1];
      gamefox_lib.alert('An error (' + error + ') was encountered for ' +
          fileList.length + ' stylesheets: ' + fileList.join(', ') + '\n\n' +
          errors[error][0]);
    }

    // Remove old bundled
    var css = gamefox_css.list;
    for (var cat in defaults)
    {
      for (var file in css[cat])
      {
        if (!(file in defaults[cat]))
        {
          gamefox_lib.log('Old bundled stylesheet "' + file + '" removed.');
          this.remove(cat, file);
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
      filename = filename.replace(/\.(css|txt)$/, Date.now() + '.$1');
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
      gamefox_lib.alert('There was an error importing the stylesheet:\n\n' +
          e);
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
      return ['E_WRITE_FAILED', e];
    }

    var css = gamefox_css.list;
    var showDesc;

    // this loop does a few things:
    //  -force re-ordering when overwriting
    //  -don't change enabled or showDesc
    //  -handle category changing
    for (var i in css)
    {
      if (css[i][filename])
      {
        showDesc = css[i][filename]['showDesc'];
        enabled = css[i][filename]['enabled'];
        delete css[i][filename];
      }
    }

    // 0 never show, 1 show once, 2 show always
    if (showDesc !== 0 && showDesc !== 1 && showDesc !== 2)
      showDesc = 1;

    css[cat][filename] = {
      'title': title, 'desc': desc, 'author': author, 'enabled': enabled,
      'showDesc': showDesc
    };

    gamefox_css.list = css;
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
    var css = gamefox_css.list;

    var type;
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
            .newFileURI(file);

          type = this._getType(category);

          if (sss.sheetRegistered(uri, sss[type]))
            sss.unregisterSheet(uri, sss[type]);

          if (css[category][filename]['enabled'].toString() == 'true')
            sss.loadAndRegisterSheet(uri, sss[type]);
        }
        catch (e if e.name == 'NS_ERROR_FILE_NOT_FOUND')
        {
          if (category == 'user') // user stylesheet, remove it
          {
            this.remove(category, filename);
            if (inOptions)
              gamefox_options_style.populate();
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
    var css = gamefox_css.list;

    file.initWithPath(this.getDirectoryPath());
    file.append(filename);

    var uri = Cc['@mozilla.org/network/io-service;1']
      .getService(Ci.nsIIOService)
      .newFileURI(file);
    try
    {
      sss.unregisterSheet(uri, sss[this._getType(category)]);
    }
    catch (e) {}

    try
    {
      file.remove(false);
    }
    catch (e) {}

    delete css[category][filename];
    gamefox_css.list = css;
  }
};
