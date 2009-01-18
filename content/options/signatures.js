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

var GFsigOptions =
{
  init: function()
  {
    var menu = document.getElementById('sig-menu');
    var sigs = eval(GFutils.getString('signature.serialized'));

    // default sig is initially selected
    this.hideCriteriaForm();
    document.getElementById('sig-body').value = sigs[0].body;

    // loop through sigs and add them to menulist
    for (var i = 1; i < sigs.length; i++)
      menu.insertItemAt(i,
          GFsig.getCriteriaString(sigs[i].accounts, sigs[i].boards)
          + GFsig.formatSigPreview(sigs[i].body));
    
    this.updateCharCounts();
  },

  hideCriteriaForm: function()
  {
    document.getElementById('sig-criteria-label').style
      .setProperty('visibility', 'hidden', null);
    document.getElementById('sig-criteria').style
      .setProperty('visibility', 'hidden', null);
  },
  showCriteriaForm: function()
  {
    document.getElementById('sig-criteria-label').style
      .setProperty('visibility', '', null);
    document.getElementById('sig-criteria').style
      .setProperty('visibility', '', null);
  },

  updateCharCounts: function()
  {
    var sigLength =
      GFutils.specialCharsEncode(document.getElementById('sig-body').value)
      .length;
    var sigChars = document.getElementById('sig-chars');

    sigChars.value = sigLength + ' characters';
    if (sigLength > 160)
    {
      sigChars.value += '(!!)';
      sigChars.style.setProperty('font-weight', 'bold', null);
    }
    else
      sigChars.style.setProperty('font-weight', '', null);
  },

  addSig: function()
  {
    var menu = document.getElementById('sig-menu');

    var index = GFsig.add();
    menu.insertItemAt(index, 'Signature', '');
    menu.selectedIndex = index;
    this.changeSig();
  },

  changeSig: function()
  {
    var menu = document.getElementById('sig-menu');
    var accounts = document.getElementById('sig-criteria-accounts');
    var boards = document.getElementById('sig-criteria-boards');
    var sig = document.getElementById('sig-body');

    if (menu.selectedIndex == 0)
    {
      // default sig has no accounts/boards and can't be deleted
      this.hideCriteriaForm();
      document.getElementById('sig-delete').disabled = true;

      accounts.value = '';
      boards.value = '';
      sig.value = GFsig.getSigById(0).body;
    }
    else
    {
      // other sigs have accounts/boards and can be deleted
      this.showCriteriaForm();
      document.getElementById('sig-delete').disabled = false;

      var sigData = GFsig.getSigById(menu.selectedIndex);
      accounts.value = sigData.accounts;
      boards.value = sigData.boards;
      sig.value = sigData.body;
    }

    this.updateCharCounts();
  },

  deleteSig: function()
  {
    var menu = document.getElementById('sig-menu');
    var index = menu.selectedIndex;

    // the default sig should never be deleted
    if (menu.selectedIndex == 0)
      return;

    // switch to closest signature
    var lastIndex = menu.getElementsByTagName('menupopup')[0]
      .childNodes.length - 1;
    if (index == lastIndex)
      menu.selectedIndex = index - 1;
    else
      menu.selectedIndex = index + 1;
    this.changeSig();

    // remove it
    var sigs = eval(GFutils.getString('signature.serialized'));
    sigs.splice(index, 1);
    GFutils.setString('signature.serialized', sigs.toSource());
    menu.removeItemAt(index);
  },

  updatePref: function(event)
  {
    var menu = document.getElementById('sig-menu');
    var sigs = eval(GFutils.getString('signature.serialized'));
    var idx = menu.selectedIndex;

    switch (event.id)
    {
      case 'sig-criteria-accounts': sigs[idx].accounts = event.value; break;
      case 'sig-criteria-boards': sigs[idx].boards = event.value; break;
      case 'sig-body': sigs[idx].body = event.value; break;
    }
    GFutils.setString('signature.serialized', sigs.toSource());

    if (idx != 0) // don't set default
      menu.selectedItem.label =
        GFsig.getCriteriaString(sigs[idx].accounts, sigs[idx].boards)
        + GFsig.formatSigPreview(sigs[idx].body);

    this.updateCharCounts();
  },

  importSig: function()
  {
    var strbundle = document.getElementById('signatures-strings');
    var signatureMsg = document.getElementById('signatureMsg');
    var button = document.getElementById('gamefox-css-grab-sig');
    button.disabled = true;

    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.gamefaqs.com/boards/sigquote.php');
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Signature and Quote') == -1)
        {
          GFlib.log('importSignature: Bad things!');

          GFutils.showNotification(signatureMsg,
              strbundle.getString('importNotLoggedIn'), 'warning');
          button.disabled = false;
          return;
        }

        var sig = request.responseText.match(/<textarea\b[^>]+?\bname="sig"[^>]*>([^<]*)<\/textarea>/i);
        if (!sig)
        {
          GFlib.log("importSignature: Couldn't get sig");

          GFutils.showNotification(signatureMsg,
              strbundle.getString('importOld'), 'warning');
          button.disabled = false;
          return;
        }
        sig = GFutils.convertNewlines(GFutils.specialCharsDecode(sig[1]));

        document.getElementById('sig-body').value = sig;
        // oninput isn't called
        GFsigOptions.updatePref(document.getElementById('sig-body'));

        GFutils.showNotification(signatureMsg,
            strbundle.getString('importSuccess'), 'info');
        button.disabled = false;
      }
    };

    request.send(null);
  }
};
