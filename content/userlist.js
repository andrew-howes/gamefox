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
      textbox.setAttribute('flex', '1');
      hbox.appendChild(textbox);

      groupbox.appendChild(hbox);

      /** radiogroup **/
      radiogroup = document.createElement('radiogroup');
      radiogroup.setAttribute('align', 'start');
      radiogroup.setAttribute('orient', 'horizontal');
      radiogroup.setAttribute('pack', 'end');

      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Collapse messages');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Remove messages');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Highlight messages');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Nothing');
      radiogroup.appendChild(radio);

      groupbox.appendChild(radiogroup);

      /** radiogroup **/
      radiogroup = document.createElement('radiogroup');
      radiogroup.setAttribute('align', 'start');
      radiogroup.setAttribute('orient', 'horizontal');
      radiogroup.setAttribute('pack', 'end');

      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Remove topics');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Highlight topics');
      radiogroup.appendChild(radio);
      /*** radio ***/
      radio = document.createElement('radio');
      radio.setAttribute('label', 'Nothing');
      radiogroup.appendChild(radio);

      groupbox.appendChild(radiogroup);

      document.getElementById('usergroups').appendChild(groupbox);
    }
  }
};
