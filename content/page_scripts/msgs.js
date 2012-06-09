/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009 Michael Ryan, 2012 Brian Marshall
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
 * Message list page script
 * @namespace
 */
var gamefox_page_msgs =
{
  /**
   * Wrap signatures in spans to separate them from the rest of the message.
   *
   * @param {HTMLElement} msgNode
   *        Node containing the message
   * @return {void} msgNode is modified directly
   */
  wrapSigs: function(msgNode)
  {
    // Walk backwards from the end of the message to find the signature
    var doc = gamefox_lib.getDocument(msgNode), dividerIndex = -1, brCount = 0;
    for (var j = msgNode.childNodes.length - 1; j >= 0; j--)
    {
      var childNode = msgNode.childNodes[j];
      if (childNode.nodeName == '#text')
      {
        if (childNode.data.trim() == '---')
          dividerIndex = j;
      }
      else if (childNode.nodeName == 'BR')
        ++brCount;
      else if (childNode.nodeName == 'DIV')
      { // Beginning of node (usually msg_body) reached
        msgNode = childNode;
        j = msgNode.childNodes.length - 1;
        dividerIndex = -1;
        brCount = 0;
      }
      else if (childNode.nodeType == Node.ELEMENT_NODE)
        brCount += childNode.getElementsByTagName('br').length;

      if (brCount > 2)
        break;
    }

    if (dividerIndex != -1)
    {
      var span = doc.createElement('span');
      span.className = 'gamefox-signature';
      while (dividerIndex < msgNode.childNodes.length)
        span.appendChild(msgNode.childNodes[dividerIndex]);
      msgNode.appendChild(span);
    }
  }
};
