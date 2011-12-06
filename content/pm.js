/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2011 Brian Marshall
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

var gamefox_pm =
{
  /**
   * Creates a private message sending form
   *
   * @param doc
   *        Page's HTMLDocument
   * @param key
   *        Hidden "key" string for the form
   * @param [optional] to
   *        Recipient of the message (prefilled)
   * @param [optional] subject
   *        Subject of the message (prefilled)
   *
   * @return HTMLFormElement
   */
  createForm: function(doc, key, to, subject)
  {
    var form = doc.createElement('form');
    form.id = 'gamefox-pm-quick-reply';
    form.action = '/pm/new';
    form.method = 'post';

    form.innerHTML =
      '<input type="hidden" name="key">\n\n' +

      '<div class="pod">\n' +
      '  <div class="head">\n' +
      '    <h2 class="title">Reply</h2>\n' +
      '  </div>\n' +
      '  <div class="body"></div>\n' +
      '</div>\n';

    var body = form.querySelector('div.body');
    body.innerHTML =
      '  <p><label>\n' +
      '    <span>To:</span>\n' +
      '    <input type="text" maxlength="20" size="20" name="to">\n' +
      '  </label></p>\n\n' +

      '  <p><label>\n' +
      '    <span>Subject:</span>\n' +
      '    <input type="text" maxlength="100" size="60" name="subject">\n' +
      '  </label></p>\n\n' +

      '  <p><textarea name="message" rows="15" cols="60"></textarea></p>\n\n' +

      '  <p><input type="submit" value="Send Message" name="submit"></p>\n';

    form.elements.namedItem('key').value = key;

    if (to)
      form.elements.namedItem('to').value = to;
    if (subject)
      form.elements.namedItem('subject').value = subject;

    return form;
  }
};
