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

var gamefox_page_pm =
{
  /**
   * Processes the PM pages
   *
   * @param doc
   *        Page's HTMLDocument
   */
  process: function(doc)
  {
    // Add a quick reply for PMs
    var replyButton = doc.querySelector('input[type="submit"][name="reply"]');
    if (gamefox_lib.prefs.getBoolPref('pm.quickReply') && replyButton)
    {
      var form = replyButton.form;
      var pod = doc.querySelector('#main_col > .pod');
      var to = (pod.querySelector('.foot').textContent.match(
          /Sent by (.*)? to/) || [])[1];
      var subject = pod.querySelector('.head > h2').textContent.trim();
      if (subject.indexOf('Re: ') != 0)
        subject = 'Re: ' + subject;

      form.parentNode.insertBefore(gamefox_pm.createForm(doc, form.elements
            .namedItem('key').value, to, subject), form.nextSibling);
    }
  }
};
