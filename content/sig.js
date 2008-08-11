/* vim: set et sw=2 ts=2 sts=2 tw=79: */
var GFSig =
{
  prefs: Components.classes['@mozilla.org/preferences-service;1'].getService(
             Components.interfaces.nsIPrefService).getBranch('gamefox.'),

  getSigByCriteria: function(account, board)
  {
    var sigs = eval(GameFOXUtils.getString('signature.serialized', this.prefs));
    if (account == null && board == null) // get default
      return sigs[0];
    else // get based on current account and board
    {
      account = account.toLowerCase();
      board = board.toLowerCase();
      var matches = new Array();
      var accounts, boards;
      for (i in sigs)
      {
        // skip empty sigs
        // this allows for the default sig (which can't be deleted) to be
        // ignored by leaving it blank
        if (!sigs[i]['body'].length && !sigs[i]['presig'].length) continue;

        accounts = sigs[i]['accounts'].toLowerCase().split(/\s*;\s*/g);
        boards = sigs[i]['boards'].toLowerCase().split(/\s*;\s*/g);

        // force the array length to 0
        if (accounts.join() == '') accounts = new Array();
        if (boards.join() == '') boards = new Array();

        if (!accounts.length && boards.length && boards.indexOf(board) != -1)
          matches.push(sigs[i]);
        else if (accounts.length && !boards.length && accounts.indexOf(account) != -1)
          matches.push(sigs[i]);
        else if (accounts.length && boards.length && accounts.indexOf(account) != -1
            && boards.indexOf(board) != -1)
          matches.push(sigs[i]);
        else if (!accounts.length && !boards.length)
          matches.push(sigs[i]);
      }

      if (!matches.length) // no sigs matched, return default
        return this.getSigByCriteria();

      if (GameFOX.prefs.getIntPref('signature.selection') == 1)
        return matches[0];
      else
        return matches[Math.round(Math.random() * (matches.length - 1))];
    }
  },

  getSigById: function(id)
  {
    return eval(GameFOXUtils.getString('signature.serialized', this.prefs))[id];
  },

  prepareOptionsPane: function()
  {
    var presig = document.getElementById('sig-presig');
    var sig = document.getElementById('sig-body');
    var menu = document.getElementById('sig-menu');

    // default sig must be global
    this.hideCriteriaForm();

    // fill in fields
    var defaultSig = this.getSigByCriteria();
    presig.value = defaultSig['presig'];
    sig.value = defaultSig['body'];

    // loop through sigs and add them to menulist
    var sigs = eval(GameFOXUtils.getString('signature.serialized', this.prefs));
    for (i in sigs)
    {
      if (i == 0) continue;
      menu.insertItemAt(i, this.getCriteriaString(sigs[i]['accounts'],
            sigs[i]['boards']), i);
    }

    // function to watch pref for change and update signature
    window.setInterval(this.watchPref, 1000);
  },

  menuCommand: function()
  {
    // update forms based on the newly-selected signature
    // default sig must not have the accounts and boards form
    // new sig must create a new blank signature and select it
    // any other signature must show the accounts and boards form
    //
    var menu = document.getElementById('sig-menu');
    var accounts = document.getElementById('sig-criteria-accounts');
    var boards = document.getElementById('sig-criteria-boards');
    var presig = document.getElementById('sig-presig');
    var sig = document.getElementById('sig-body');

    if (menu.selectedItem.value == 'new')
    {
      this.showCriteriaForm();
      this.resetForm();
      document.getElementById('sig-delete').disabled = true;

      var index = this.add();
      menu.insertItemAt(index, "Global signature", index);
      menu.selectedIndex = index;
    }
    if (menu.selectedItem.value != 'default')
    {
      this.showCriteriaForm();
      document.getElementById('sig-delete').disabled = false; // immutable

      var sigData = this.getSigById(menu.selectedItem.value);
      accounts.value = sigData['accounts'];
      boards.value = sigData['boards'];
      presig.value = sigData['presig'];
      sig.value = sigData['body'];
    }
    else if (menu.selectedItem.value == 'default')
    {
      this.hideCriteriaForm();
      document.getElementById('sig-delete').disabled = true;

      accounts.value = '';
      boards.value = '';
      var defaultSig = this.getSigByCriteria();
      presig.value = defaultSig['presig'];
      sig.value = defaultSig['body'];
    }
  },

  add: function()
  {
    var sigs = eval(GameFOXUtils.getString('signature.serialized', this.prefs));
    sigs.push({"accounts":"", "boards":"", "body":"", "presig":""});
    GameFOXUtils.setString('signature.serialized', sigs.toSource(), this.prefs);

    return sigs.length - 1;
  },

  /*
   * return values:
   * 1: global
   * 2: boards and accounts
   * 3: boards
   * 4: accounts
   */
  getSigType: function(accounts, boards)
  {
    boards = boards.replace(/\s+/, '');
    accounts = accounts.replace(/\s+/, '');

    if (boards.match(/[^\s]/) || accounts.match(/[^\s]/))
    {
      if (boards.match(/[^\s]/) && accounts.match(/[^\s]/))
        return 2;
      else if (boards.match(/[^\s]/))
        return 3;
      else if (accounts.match(/[^\s]/))
        return 4;
    }
    else
      return 1;
  },

  // update sig while typing
  updatePref: function(event)
  {
    var menu = document.getElementById('sig-menu');
    var sigs = eval(GameFOXUtils.getString('signature.serialized', this.prefs));
    var idx = menu.selectedItem.value;
        idx = (idx == 'default') ? 0 : idx;
    
    switch (event.id)
    {
      case 'sig-criteria-accounts': sigs[idx]['accounts'] = event.value; break;
      case 'sig-criteria-boards': sigs[idx]['boards'] = event.value; break;
      case 'sig-presig': sigs[idx]['presig'] = event.value; break;
      case 'sig-body': sigs[idx]['body'] = event.value; break;
    }

    GameFOXUtils.setString('signature.serialized', sigs.toSource(), this.prefs);
    menu.selectedItem.label = this.getCriteriaString(sigs[idx]['accounts'],
        sigs[idx]['boards'], idx == 0);
  },

  getCriteriaString: function(accounts, boards, isDefault)
  {
    if (isDefault) return 'Default signature';

    var type = this.getSigType(accounts, boards);
    switch (type)
    {
      case 1: return 'Global signature';
      case 2: return 'Accounts: ' + accounts + ' + Boards: ' + boards;
      case 3: return 'Boards: ' + boards;
      case 4: return 'Accounts: ' + accounts;
    }
  },

  hideCriteriaForm: function()
  {
    document.getElementById('sig-criteria').style.setProperty('display', 'none',
        null);
  },

  showCriteriaForm: function()
  {
    document.getElementById('sig-criteria').style.setProperty('display', '',
        null);
  },

  resetForm: function()
  {
    document.getElementById('sig-criteria-accounts').value = '';
    document.getElementById('sig-criteria-boards').value = '';
    document.getElementById('sig-presig').value = '';
    document.getElementById('sig-body').value = '';
  },

  deleteSig: function()
  {
    var menu = document.getElementById('sig-menu');
    var sigs = eval(GameFOXUtils.getString('signature.serialized', this.prefs));

    if (menu.selectedItem.value == 'default') return false;

    // remove it
    sigs.splice(menu.selectedItem.value, 1);
    GameFOXUtils.setString('signature.serialized', sigs.toSource(), this.prefs);
    menu.removeItemAt(menu.selectedIndex);

    // return to default signature
    menu.selectedIndex = 0;
    this.menuCommand();

    // re-index menuitems
    var j = 1;
    var menuitems = menu.getElementsByTagName('menuitem');
    for (i in menuitems)
      if (menuitems[i] && menuitems[i].value != 'new' && menuitems[i].value != 'default'
          && menuitems[i].value)
        menuitems[i].value = j++;
  },

  watchPref: function()
  {
    var sigs = eval(GameFOXUtils.getString('signature.serialized', GFSig.prefs));
    var menu = document.getElementById('sig-menu');
    var idx = menu.selectedItem.value;

    if (idx == 'default') idx = 0;

    document.getElementById('sig-presig').value = sigs[idx]['presig'];
    document.getElementById('sig-body').value = sigs[idx]['body'];
  }
};
