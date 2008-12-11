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

var GFsig =
{
  prefs: Cc['@mozilla.org/preferences-service;1'].getService(
             Ci.nsIPrefService).getBranch('gamefox.signature.'),

  getSigByCriteria: function(account, boardname, boardid)
  {
    account = account.toLowerCase();
    boardname = boardname.toLowerCase();
    var matches = new Array(new Array(), new Array(), new Array());
    var accounts, boards;
    var sigs = eval(GFutils.getString('serialized', this.prefs));

    // find matching sigs
    for (var i = 1; i < sigs.length; i++)
    {
      // skip empty sigs
      if (!sigs[i]['body'].length) continue;

      accounts = sigs[i]['accounts'].toLowerCase().GFtrim().split(/\s*,\s*/);
      boards = sigs[i]['boards'].toLowerCase().GFtrim().split(/\s*,\s*/);

      // force the array length to 0
      if (accounts.join() == '') accounts = new Array();
      if (boards.join() == '') boards = new Array();

      if (!accounts.length && boards.length)
      {
        if (this.matchBoard(boards, boardid, boardname))
          matches[1].push(sigs[i]);
      }
      else if (accounts.length && !boards.length)
      {
        if (accounts.indexOf(account) != -1)
          matches[1].push(sigs[i]);
      }
      else if (accounts.length && boards.length)
      {
        if (accounts.indexOf(account) != -1
            && this.matchBoard(boards, boardid, boardname))
          matches[0].push(sigs[i]); // account and board-specific sig, highest priority
      }
      else
      {
        matches[2].push(sigs[i]); // global sig, lowest priority
      }
    }
    // default is the last of the lowest priority
    if (sigs[0]['body'].length)
      matches[2].push(sigs[0]);

    var sig;
    var selectionPref = this.prefs.getIntPref('selection');
    if (selectionPref == 1 || selectionPref == 3)
    {
      // highest specificity
      var bestIndex;
      if (matches[0].length)
        bestIndex = 0;
      else if (matches[1].length)
        bestIndex = 1;
      else
        bestIndex = 2;
      if (selectionPref == 1)
        sig = matches[bestIndex][0];
      else // selectionPref == 3
        sig = matches[bestIndex][Math.round(Math.random() * (matches[bestIndex].length - 1))];
    }
    else // selectionPref == 2
    {
      // no specificity
      var allMatches = new Array();
      for (i = 0; i < matches.length; i++)
        for (var j = 0; j < matches[i].length; j++)
          allMatches.push(matches[i][j]);
      sig = allMatches[Math.round(Math.random() * (allMatches.length - 1))];
    }
    // default is only sig and is empty
    if (sig == undefined)
      sig = sigs[0];

    return sig;
  },

  getSigById: function(id)
  {
    return eval(GFutils.getString('serialized', this.prefs))[id];
  },

  prepareOptionsPane: function()
  {
    var menu = document.getElementById('sig-menu');
    var sigs = eval(GFutils.getString('serialized', this.prefs));

    // default sig is initially selected
    this.hideCriteriaForm();
    document.getElementById('sig-body').value = sigs[0]['body'];

    // loop through sigs and add them to menulist
    for (var i = 1; i < sigs.length; i++)
    {
      menu.insertItemAt(i, this.getCriteriaString(sigs[i]['accounts'],
            sigs[i]['boards']) + ' / ' + sigs[i]['body'], '');
    }

    this.updateCharCounts();
  },

  // update forms
  menuCommand: function()
  {
    var menu = document.getElementById('sig-menu');
    var accounts = document.getElementById('sig-criteria-accounts');
    var boards = document.getElementById('sig-criteria-boards');
    var sig = document.getElementById('sig-body');

    if (menu.selectedItem.value == 'new')
    {
      // create blank sig and select it
      var index = this.add();
      menu.insertItemAt(index, 'Global signature', '');
      menu.selectedIndex = index;
    }

    if (menu.selectedIndex == 0)
    {
      // default sig has no accounts/boards and can't be deleted
      this.hideCriteriaForm();
      document.getElementById('sig-delete').disabled = true;

      accounts.value = '';
      boards.value = '';
      sig.value = this.getSigById(0)['body'];
    }
    else
    {
      // other sigs have accounts/boards and can be deleted
      this.showCriteriaForm();
      document.getElementById('sig-delete').disabled = false;

      var sigData = this.getSigById(menu.selectedIndex);
      accounts.value = sigData['accounts'];
      boards.value = sigData['boards'];
      sig.value = sigData['body'];
    }

    this.updateCharCounts();
  },

  add: function()
  {
    var sigs = eval(GFutils.getString('serialized', this.prefs));
    sigs.push({'accounts':'', 'boards':'', 'body':''});
    GFutils.setString('serialized', sigs.toSource(), this.prefs);

    return sigs.length - 1;
  },

  // update sig while typing
  updatePref: function(event)
  {
    var menu = document.getElementById('sig-menu');
    var sigs = eval(GFutils.getString('serialized', this.prefs));
    var idx = menu.selectedIndex;

    switch (event.id)
    {
      case 'sig-criteria-accounts': sigs[idx]['accounts'] = event.value; break;
      case 'sig-criteria-boards': sigs[idx]['boards'] = event.value; break;
      case 'sig-body': sigs[idx]['body'] = event.value; break;
    }
    GFutils.setString('serialized', sigs.toSource(), this.prefs);

    if (idx != 0) // don't set default
      menu.selectedItem.label = this.getCriteriaString(sigs[idx]['accounts'],
          sigs[idx]['boards']) + ' / ' + sigs[idx]['body'];

    this.updateCharCounts();
  },

  getCriteriaString: function(accounts, boards)
  {
    switch ((/\S/.test(accounts) ? 1 : 0) + (/\S/.test(boards) ? 2 : 0))
    {
      case 0: return 'Global signature';
      case 1: return 'Accounts: ' + accounts;
      case 2: return 'Boards: ' + boards;
      case 3: return 'Accounts: ' + accounts + ' + Boards: ' + boards;
    }
  },

  hideCriteriaForm: function()
  {
    document.getElementById('sig-criteria').style.setProperty('visibility',
        'hidden', null);
  },

  showCriteriaForm: function()
  {
    document.getElementById('sig-criteria').style.setProperty('visibility',
        '', null);
  },

  deleteSig: function()
  {
    var menu = document.getElementById('sig-menu');

    // this should never happen
    if (menu.selectedIndex == 0 || menu.selectedItem.value == 'new')
      return;

    // remove it
    var sigs = eval(GFutils.getString('serialized', this.prefs));
    sigs.splice(menu.selectedIndex, 1);
    GFutils.setString('serialized', sigs.toSource(), this.prefs);
    menu.removeItemAt(menu.selectedIndex);

    // return to default signature
    menu.selectedIndex = 0;
    this.menuCommand();
  },

  matchBoard: function(boards, boardid, boardname)
  {
    if ((boardid && boards.indexOf(boardid) != -1)
        || (boardname && boards.indexOf(boardname) != -1))
      return true;
    return false;
  },

  updateCharCounts: function()
  {
    var sigLength =
      GFutils.specialCharsEncode(document.getElementById('sig-body').value).length;
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
  
  format: function(sig, newline, doc)
  {
    if (sig == null) // fetch sig
    {
      if (!doc) return false;
      var boardname = doc.evaluate('//h1', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
        textContent.GFtrim();
      var boardid = doc.location.search.match(/board=([0-9-]+)/)[1];
      var account = doc.evaluate('//div[@class="msg"]', doc, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
          textContent.GFtrim().replace('Welcome, ', '');
      var getSig = GFsig.getSigByCriteria(account, boardname, boardid);
      sig = getSig['body'];
    }
    if (newline == null) // fetch newline
      newline = GameFOX.prefs.getBoolPref('signature.newline');

    if (!sig.length)
      return '';

    // truncate at 2 lines
    sig = sig.split('\n');
    if (sig.length >= 2)
      sig = sig[0] + '\n' + sig[1];
    else
      sig = sig[0];

    // truncate at 160 characters
    sig = GFutils.specialCharsEncode(sig).substr(0, 160);

    // remove truncated entities
    var amp = sig.lastIndexOf('&');
    if (sig.lastIndexOf(';') < amp)
      sig = sig.substr(0, amp);

    sig = GFutils.specialCharsDecode(sig);
    
    return '\n' + (newline ? '\n' : '') + (sig != '' ? '---\n' + sig : '');
  }
};
