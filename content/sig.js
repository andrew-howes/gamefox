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

var GFsig =
{
  getSigByCriteria: function(account, boardname, boardid)
  {
    account = account.toLowerCase();
    boardname = boardname.toLowerCase();
    var matches = new Array(new Array(), new Array(), new Array());
    var accounts, boards;
    var sigs = eval(GFutils.getString('signature.serialized'));

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
    var bestIndex = matches[0].length ? 0 : matches[1].length ? 1 : 2;
    if (GFlib.prefs.getIntPref('signature.selection') == 1) // random
      sig = matches[bestIndex][Math.floor(Math.random() * matches[bestIndex].length)];
    else // first
      sig = matches[bestIndex][0];

    // default is only sig and is empty
    if (sig == undefined)
      sig = sigs[0];

    return sig;
  },

  getSigById: function(id)
  {
    return eval(GFutils.getString('signature.serialized'))[id];
  },

  addSig: function()
  {
    var sigs = eval(GFutils.getString('signature.serialized'));
    sigs.push({'accounts':'', 'boards':'', 'body':''});
    GFutils.setString('signature.serialized', sigs.toSource());

    return sigs.length - 1;
  },

  deleteSigById: function(id)
  {
    var sigs = eval(GFutils.getString('signature.serialized'));
    sigs.splice(id, 1);
    GFutils.setString('signature.serialized', sigs.toSource());
  },

  getCriteriaString: function(accounts, boards)
  {
    switch ((/\S/.test(accounts) ? 1 : 0) + (/\S/.test(boards) ? 2 : 0))
    {
      case 0: return 'Signature';
      case 1: return 'Accounts: ' + accounts;
      case 2: return 'Boards: ' + boards;
      case 3: return 'Accounts: ' + accounts + ' + Boards: ' + boards;
    }
  },

  matchBoard: function(boards, boardid, boardname)
  {
    if ((boardid && boards.indexOf(boardid) != -1)
        || (boardname && boards.indexOf(boardname) != -1))
      return true;
    return false;
  },

  format: function(sig, newline, doc)
  {
    if (sig == null) // fetch sig
    {
      if (!doc) return false;
      var boardname = GFutils.getBoardName(doc);
      var boardid = GFutils.parseQueryString(doc.location.search)['board'];
      var account = GFutils.getAccountName(doc);
      var getSig = GFsig.getSigByCriteria(account, boardname, boardid);
      sig = getSig['body'];
    }
    if (!sig.length)
      return '';

    if (newline == null) // fetch newline
      newline = GFlib.prefs.getBoolPref('signature.newline');

    // truncate at 2 lines
    sig = sig.split('\n');
    if (sig.length >= 2)
      sig = sig[0] + '\n' + sig[1];
    else
      sig = sig[0];

    // remove p
    sig = sig.replace(/<\/?p>/g, '');

    // truncate at 160 characters
    sig = GFutils.specialCharsEncode(sig).substr(0, 160);

    // remove truncated entities
    var amp = sig.lastIndexOf('&');
    if (sig.lastIndexOf(';') < amp)
      sig = sig.substr(0, amp);

    sig = GFutils.specialCharsDecode(sig);

    return '\n' + (newline ? '\n' : '') + (sig != '' ? '---\n' + sig : '');
  },

  formatSigPreview: function(str)
  {
    if (!/\S/.test(str))
      return '';

    return ' / ' + str.GFtrim().replace(/\s+/g, ' ');
  },

  updateFromGameFAQs: function(event)
  {
    var doc = GFlib.getDocument(event);

    var sig = doc.getElementsByName('sig')[0].value;
    var sigPref = eval(GFutils.getString('signature.serialized'));

    sigPref[0].body = sig;

    GFutils.setString('signature.serialized', sigPref.toSource());

    GFlib.alert('Your GameFOX signature has been updated.');
  }
};
