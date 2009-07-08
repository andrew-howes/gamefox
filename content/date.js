/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009 Brian Marshall
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

var gamefox_date =
{
  // http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html
  formats: {
    topic:   ['%n/%e %i:%M%p',
              '%m/%d %I:%M%p',
              '%m/%d %H:%M',
              '%d/%m %I:%M%p',
              '%d/%m %H:%M'],
    message: ['%n/%e/%Y %i:%M:%S %p',
              '%m/%d/%Y %I:%M:%S %p',
              '%m/%d/%Y %H:%M:%S',
              '%d/%m/%Y %I:%M:%S %p',
              '%d/%m/%Y %H:%M:%S',
              '%Y-%m-%d %I:%M:%S %p',
              '%Y-%m-%d %H:%M:%S'],
    clock:   ['%n/%e/%Y %i:%M:%S %p',
              '%m/%d/%Y %I:%M:%S %p',
              '%m/%d/%Y %H:%M:%S',
              '%d/%m/%Y %I:%M:%S %p',
              '%d/%m/%Y %H:%M:%S',
              '%Y-%m-%d %I:%M:%S %p',
              '%Y-%m-%d %H:%M:%S']
  },

  getFormat: function(type, id)
  {
    if (id == -1)
      return gamefox_lib.getString('date.' + type + 'Custom');

    return this.formats[type][id];
  },

  listFormats: function(type)
  {
    return this.formats[type];
  },

  strtotime: function(str, year)
  {
    // see if Date() will take this date string
    var d = new Date(str);
    if (d != 'Invalid Date')
      return d;
    else // try to parse a topic date
    {
      year = year || new Date().getFullYear();
      var time = str.split(/(\/| |:|AM|PM)/);
      // Convert to 24-hour scale
      if (time[7] == 'PM' && time[4] < 12)
        time[4] = parseInt(time[4]) + 12;
      if (time[7] == 'AM' && time[4] == 12)
        time[4] = 0;

      return new Date(year, time[0] - 1, time[2], time[4], time[6]);
    }
  },

  convertTo12H: function(hours)
  {
    return hours > 12 ? hours - 12 : (hours == 0 ? 12 : hours);
  },

  parseFormat: function(dateStr, format)
  {
    var date = dateStr ? new Date(dateStr) : new Date();
    if (date == 'Invalid Date')
      date = gamefox_date.strtotime(dateStr);

    // Custom conversions, since strftime isn't adequate
    format = format.replace(/%e/g, date.getDate())
                   .replace(/%n/g, date.getMonth() + 1)
                   .replace(/%i/g, this.convertTo12H(date.getHours()));

    return date.toLocaleFormat(format);
  }
};
