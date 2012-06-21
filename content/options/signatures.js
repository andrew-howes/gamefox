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

var gamefox_options_sig =
{
  _menu    : null,
  _textbox : null,
  _sigs    : null,

  init: function()
  {
    this._menu = document.getElementById('sig-menu');
    this._textbox = document.getElementById('sig-body');
    this._read();

    // default sig is initially selected
    this._hideCriteriaForm();
    this._textbox.value = this._sigs[0].body;

    // loop through sigs and add them to menulist
    for (var i = 1; i < this._sigs.length; i++)
      this._menu.insertItemAt(i, this._criteriaToString(this._sigs[i].accounts,
            this._sigs[i].boards) + this._sigToPreview(this._sigs[i].body));

    this._updateCharCounts();

    // watch for external changes to sigs
    new gamefox_pref_observer('signature.serialized', this);
  },

  observe: function()
  {
    this._read();
    var sig = this._sigs[this._menu.selectedIndex].body;

    if (this._textbox.value != sig)
    {
      this._textbox.value = sig;
      this._updateCharCounts();
    }
  },

  _read: function()
  {
    var strbundle = document.getElementById('strings');
    var signatureMsg = document.getElementById('signatureMsg');
    this._sigs = gamefox_lib.parseJSON(gamefox_lib.getString(
          'signature.serialized')) || [];

    // check if sigs array is valid
    if (!this._sigs || !this._sigs[0])
      gamefox_options.showNotification(signatureMsg,
          strbundle.getString('loadError'), 'critical');
  },

  _save: function()
  {
    gamefox_lib.setString('signature.serialized', JSON.stringify(this._sigs));
  },

  _hideCriteriaForm: function()
  {
    document.getElementById('sig-criteria').style
      .setProperty('visibility', 'hidden', null);
  },
  _showCriteriaForm: function()
  {
    document.getElementById('sig-criteria').style
      .setProperty('visibility', '', null);
  },

  _updateCharCounts: function()
  {
    var sigLength = gamefox_utils.specialCharsEncode(this._textbox.value).length;
    var sigChars = document.getElementById('sig-chars');

    if (sigLength == 0)
    {
      sigChars.value = '';
      return;
    }

    sigChars.value = sigLength + ' character' + (sigLength == 1 ? '' : 's');
    if (sigLength > 160)
    {
      sigChars.value += '(!!)';
      sigChars.style.setProperty('font-weight', 'bold', null);
    }
    else
      sigChars.style.setProperty('font-weight', '', null);
  },

  _criteriaToString: function(accounts, boards)
  {
    var strbundle = document.getElementById('strings');
    var str = {
      'signature': strbundle.getString('signature'),
      'accounts': strbundle.getString('accounts') + ' ',
      'boards': strbundle.getString('boards') + ' '
    };

    switch ((/\S/.test(accounts) ? 1 : 0) + (/\S/.test(boards) ? 2 : 0))
    {
      case 0: return str.signature;
      case 1: return str.accounts + accounts;
      case 2: return str.boards + boards;
      case 3: return str.accounts + accounts + ' + ' + str.boards + boards;
    }
  },

  _sigToPreview: function(str)
  {
    if (!/\S/.test(str))
      return '';

    return ' / ' + str.trim().replace(/\s+/g, ' ');
  },

  addSig: function()
  {
    var idx = gamefox_sigs.newSig();
    this._menu.insertItemAt(idx, 'Signature', '');
    this._menu.selectedIndex = idx;
    this.changeSig();
  },

  changeSig: function()
  {
    var accounts = document.getElementById('sig-criteria-accounts');
    var boards = document.getElementById('sig-criteria-boards');

    if (this._menu.selectedIndex == 0)
    {
      // default sig has no accounts/boards and can't be deleted
      this._hideCriteriaForm();
      document.getElementById('sig-delete').disabled = true;

      accounts.value = '';
      boards.value = '';
      this._textbox.value = this._sigs[0].body;
    }
    else
    {
      // other sigs have accounts/boards and can be deleted
      this._showCriteriaForm();
      document.getElementById('sig-delete').disabled = false;

      var sigData = this._sigs[this._menu.selectedIndex];
      accounts.value = sigData.accounts;
      boards.value = sigData.boards;
      this._textbox.value = sigData.body;
    }

    this._updateCharCounts();
  },

  deleteSig: function()
  {
    var idx = this._menu.selectedIndex;

    // the default sig should never be deleted
    if (this._menu.selectedIndex == 0)
      return;

    // switch to closest signature
    var lastIndex = this._menu.getElementsByTagName('menupopup')[0]
      .childNodes.length - 1;
    if (idx == lastIndex)
      this._menu.selectedIndex = idx - 1;
    else
      this._menu.selectedIndex = idx + 1;
    this.changeSig();

    // remove it
    gamefox_sigs.deleteSig(idx);
    this._menu.removeItemAt(idx);
  },

  updatePref: function(event)
  {
    this._read();
    var idx = this._menu.selectedIndex;

    switch (event.id)
    {
      case 'sig-criteria-accounts': this._sigs[idx].accounts = event.value; break;
      case 'sig-criteria-boards': this._sigs[idx].boards = event.value; break;
      case 'sig-body': this._sigs[idx].body = event.value; break;
    }
    this._save();

    if (idx != 0) // don't set default
      this._menu.selectedItem.label = this._criteriaToString(this._sigs[idx]
          .accounts, this._sigs[idx].boards) +
        this._sigToPreview(this._sigs[idx].body);

    this._updateCharCounts();
  },

  importSig: function()
  {
    var strbundle = document.getElementById('strings');
    var signatureMsg = document.getElementById('signatureMsg');

    if (!gamefox_lib.isLoggedIn())
    {
      gamefox_options.showNotification(signatureMsg,
          strbundle.getString('importNotLoggedIn'), 'warning');
      return;
    }

    var button = document.getElementById('gamefox-css-grab-sig');
    button.disabled = true;

    var request = new XMLHttpRequest();
    request.open('GET', gamefox_lib.domain + gamefox_lib.path + 'sigquote.php');
    var ds = gamefox_lib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText
            .indexOf('>Signature and Quote</h2>') == -1)
        {
          gamefox_options.showNotification(signatureMsg,
              strbundle.getString('importNotLoggedIn'), 'warning');
          button.disabled = false;
          return;
        }

        var sig = request.responseText
          .match(/<textarea\b[^>]+?\bname="sig"[^>]*>([^<]*)<\/textarea>/i);
        if (!sig)
        {
          gamefox_options.showNotification(signatureMsg,
              strbundle.getString('importOld'), 'warning');
          button.disabled = false;
          return;
        }
        sig = gamefox_utils.convertNewlines(gamefox_utils.specialCharsDecode(sig[1]));

        document.getElementById('sig-body').value = sig;
        // oninput isn't called
        gamefox_options_sig.updatePref(document.getElementById('sig-body'));

        gamefox_options.showNotification(signatureMsg,
            strbundle.getString('importSuccess'), 'info');
        button.disabled = false;
      }
    };

    request.send(null);
  },

  exportSig: function()
  {
    var strbundle = document.getElementById('strings');
    var signatureMsg = document.getElementById('signatureMsg');
    var button = document.getElementById('gamefox-css-save-sig');
    button.disabled = true;

    var request = new XMLHttpRequest();
    request.open('GET', gamefox_lib.domain + gamefox_lib.path + 'sigquote.php');
    var ds = gamefox_lib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText
            .indexOf('>Signature and Quote</h2>') == -1)
        {
          gamefox_options.showNotification(signatureMsg,
              strbundle.getString('exportNotLoggedIn'), 'warning');
          button.disabled = false;
          return;
        }

        var action = request.responseText
          .match(/<form\b[^>]+?\bid="add"[^>]+?\baction="([^"]*)">/);
        if (!action)
        {
          gamefox_options.showNotification(signatureMsg,
              strbundle.getString('exportnoUserId'), 'warning');
          button.disabled = false;
          return;
        }
        action = action[1];

        var postRequest = new XMLHttpRequest();
        postRequest.open('POST', gamefox_lib.domain + action);
        var ds = gamefox_lib.thirdPartyCookieFix(postRequest);
        postRequest.onreadystatechange = function()
        {
          if (postRequest.readyState == 4)
          {
            if (postRequest.responseText
                .indexOf('<p>Signature/quote updated</p>') == -1)
            {
              if (postRequest.responseText
                  .indexOf('<p>Your signature contains') != -1)
                gamefox_options.showNotification(signatureMsg,
                    strbundle.getString('exportTooLong'), 'warning');
              else
                gamefox_options.showNotification(signatureMsg,
                    strbundle.getString('exportUnexpectedResponse'), 'warning');
            }
            else
              gamefox_options.showNotification(signatureMsg,
                  strbundle.getString('exportSuccess'), 'info');

            button.disabled = false;
          }
        };

        var sigText = document.getElementById('sig-body').value;
        var quoteText = request.responseText
          .match(/<textarea\b[^>]+?\bname="quote"[^>]*>([^<]*)<\/textarea>/i)[1];
        quoteText = gamefox_utils.specialCharsDecode(quoteText);
        var key = request.responseText
          .match(/<input\b[^>]+?\bname="key"[^>]+?\bvalue="([^"]*)"[^>]*>/i)[1];

        postRequest.setRequestHeader('Content-Type',
            'application/x-www-form-urlencoded');
        postRequest.send(
            'sig=' + gamefox_utils.URLEncode(sigText) + '&' +
            'quote=' + gamefox_utils.URLEncode(quoteText) + '&' +
            'key=' + key + '&' +
            'submit=1'
            );
      }
    };

    request.send(null);
  }
};
