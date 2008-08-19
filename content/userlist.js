/* vim: set et sw=2 sts=2 ts=2: */

var GFUL =
{
  Cc: Components.classes,
  Ci: Components.interfaces,
  prefs: Components.classes['@mozilla.org/preferences-service;1'].getService(
      Components.interfaces.nsIPrefService).getBranch('gamefox.'),

  add: function()
  {
    var userlist = eval(this.prefs.getCharPref("userlist.serialized"));

    userlist.push({"name": "", "color": "", "users": "", "messages": "highlight", "topics": "highlight"});

    this.prefs.setCharPref("userlist.serialized", userlist.toSource());
  },

  populate: function()
  {
    var groupbox, caption, hbox, textbox, separator, colorpicker, label, radiogroup, radio;
    var radios;

    // This is pretty verbose
    var userlist = eval(this.prefs.getCharPref('userlist.serialized'));

    for (i in userlist)
    {
      /* groupbox */
      groupbox = document.createElement('groupbox');
      groupbox.id = 'ug-' + i;

      /** caption **/
      caption = document.createElement('caption');
      caption.setAttribute('label', 'User Group');
      groupbox.appendChild(caption);
      /** hbox **/
      hbox = document.createElement('hbox');
      hbox.setAttribute('align', 'center');

      /*** textbox ***/
      textbox = document.createElement('textbox');
      textbox.setAttribute('emptytext', 'Group Name');
      textbox.setAttribute('class', 'ug-name');
      textbox.setAttribute('value', userlist[i]['name']);
      textbox.addEventListener('input', this.updatePref, false);
      hbox.appendChild(textbox);
      /*** separator **/
      separator = document.createElement('separator');
      separator.setAttribute('flex', '1');
      hbox.appendChild(separator);
      /*** colorpicker ***/
      colorpicker = document.createElement('colorpicker');
      colorpicker.setAttribute('type', 'button');
      hbox.appendChild(colorpicker);
      /*** textbox ***/
      textbox = document.createElement('textbox');
      textbox.setAttribute('size', '6');
      hbox.appendChild(textbox);

      groupbox.appendChild(hbox);

      /** hbox **/
      hbox = document.createElement('hbox');
      hbox.setAttribute('align', 'center');

      /*** label ***/
      label = document.createElement('label');
      label.setAttribute('value', 'Users:');
      hbox.appendChild(label);
      /*** textbox ***/
      textbox = document.createElement('textbox');
      textbox.setAttribute('class', 'ug-users');
      textbox.setAttribute('value', userlist[i]['users']);
      textbox.setAttribute('flex', '1');
      textbox.addEventListener('input', this.updatePref, false);
      hbox.appendChild(textbox);

      groupbox.appendChild(hbox);

      /** radiogroup **/
      radiogroup = document.createElement('radiogroup');
      radiogroup.setAttribute('align', 'start');
      radiogroup.setAttribute('orient', 'horizontal');
      radiogroup.setAttribute('pack', 'end');
      radiogroup.setAttribute('class', 'ug-messages');
      radiogroup.addEventListener('click', this.updatePref, false);

      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Collapse messages');
      radio.setAttribute('value', 'collapse');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Remove messages');
      radio.setAttribute('value', 'remove');
      /* I couldn't find another easy way to do this: radiogroup.selectedIndex
         isn't set until this loop is over, which would require another loop to
         set all the radios. */
      if (userlist[i]['messages'] == 'remove')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Highlight messages');
      radio.setAttribute('value', 'highlight');
      if (userlist[i]['messages'] == 'highlight')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Nothing');
      radio.setAttribute('value', 'nothing');
      if (userlist[i]['messages'] == 'nothing')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);

      groupbox.appendChild(radiogroup);
      
      /** radiogroup **/
      radiogroup = document.createElement('radiogroup');
      radiogroup.setAttribute('align', 'start');
      radiogroup.setAttribute('orient', 'horizontal');
      radiogroup.setAttribute('pack', 'end');
      radiogroup.setAttribute('class', 'ug-topics');
      radiogroup.addEventListener('click', this.updatePref, false);

      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Remove topics');
      radio.setAttribute('value', 'remove');
      if (userlist[i]['topics'] == 'remove')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Highlight topics');
      radio.setAttribute('value', 'highlight');
      if (userlist[i]['topics'] == 'highlight')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Nothing');
      radio.setAttribute('value', 'nothing');
      if (userlist[i]['topics'] == 'nothing')
        radio.setAttribute('selected', 'true');
      radiogroup.appendChild(radio);

      groupbox.appendChild(radiogroup);

      document.getElementById('usergroups').appendChild(groupbox);
    }

  },

  updatePref: function(event)
  {
    // get user group index
    var node = parentNode = event.target;
    while (parentNode.id.indexOf('ug') == -1)
      parentNode = parentNode.parentNode;
    var idx = parentNode.id.substring(3);

    if (node.tagName == 'radio')
      node = node.parentNode;

    // get pref name
    var name = node.className.substring(3);

    // get and set pref
    var userlist = eval(GFUL.prefs.getCharPref('userlist.serialized'));
    userlist[idx][name] = node.value;
    GFUL.prefs.setCharPref('userlist.serialized', userlist.toSource());
  }
};
