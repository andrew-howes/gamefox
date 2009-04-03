function gamefox_treeview()
{
  this.childData = {};
  this.visibleData = [];

  this.treeBox = null;
  this.selection = null;

  this.__defineGetter__('rowCount', function() { return this.visibleData.length; });
  this.setTree = function(treeBox)          { this.treeBox = treeBox; };
  this.getCellText = function(idx, column)  { return this.visibleData[idx][0][column.index]; };
  this.isContainer = function(idx)          { return this.visibleData[idx][1]; };
  this.isContainerOpen = function(idx)      { return this.visibleData[idx][2]; };
  this.isContainerEmpty = function(idx)     { return false; };
  this.isSeparator = function(idx)          { return false; };
  this.isSorted = function()                { return false; };
  this.isEditable = function(idx, column)   { return false; };

  this.getParentIndex = function(idx) {
    if (this.isContainer(idx)) return -1;
    for (var t = idx - 1; t >= 0; t--) {
      if (this.isContainer(t)) return t;
    }
  };
  this.getLevel = function(idx) {
    if (this.isContainer(idx)) return 0;
    return 1;
  };
  this.hasNextSibling = function(idx, after) {
    var thisLevel = this.getLevel(idx);
    for (var t = idx + 1; t < this.visibleData.length; t++) {
      var nextLevel = this.getLevel(t)
      if (nextLevel == thisLevel) return true;
      else if (nextLevel < thisLevel) return false;
    }
  };
  this.toggleOpenState = function(idx) {
    var item = this.visibleData[idx];
    if (!item[1]) return;

    if (item[2]) {
      item[2] = false;

      var thisLevel = this.getLevel(idx);
      var deletecount = 0;
      for (var t = idx + 1; t < this.visibleData.length; t++) {
        if (this.getLevel(t) > thisLevel) deletecount++;
        else break;
      }
      if (deletecount) {
        this.visibleData.splice(idx + 1, deletecount);
        this.treeBox.rowCountChanged(idx + 1, -deletecount);
      }
    }
    else {
      item[2] = true;

      var label = this.visibleData[idx][0][0];
      var toinsert = this.childData[label];
      if (toinsert) {
        for (var i = 0; i < toinsert.length; i++) {
            this.visibleData.splice(idx + i + 1, 0, [toinsert[i], false]);
        }
        this.treeBox.rowCountChanged(idx + 1, toinsert.length);
      }
    }
  };

  this.getImageSrc = function(idx, column) {};
  this.getProgressMode = function(idx,column) {};
  this.getCellValue = function(idx, column) { return this.visibleData[idx][0][column.index]; };
  this.cycleHeader = function(col, elem) {};
  this.selectionChanged = function() {};
  this.cycleCell = function(idx, column) {};
  this.performAction = function(action) {};
  this.performActionOnCell = function(action, index, column) {};
  this.getRowProperties = function(idx, column, prop) {};
  this.getCellProperties = function(idx, column, prop) {};
  this.getColumnProperties = function(column, element, prop) {};
  this.setCellText = function(idx, column, value) { this.visibleData[idx][0][column.index] = value; };
  this.setCellValue = function(idx, column, value) { this.visibleData[idx][0][column.index] = value; };
}
