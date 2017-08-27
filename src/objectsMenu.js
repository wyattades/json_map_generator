import React, { Component } from 'react';

import './objectsMenu.scss';

class ObjectsMenu extends Component {

  _ChildItem = ({ obj }) => (
    <button
      onClick={this._pressChild(obj)}
      className={`child-item menu-item menu-button ${obj === this.props.selected.obj ? 'selected' : ''}`}
    >
      <div className="color-box" style={obj.color ? { backgroundColor: obj.color, backgroundImage: 'none' } : {}}/>
      <span>{`x:${obj.x}, y:${obj.y}, w:${obj.w}, h:${obj.h}`}</span>
    </button>
  );

  _ParentItem = ({ type, color }) => {

    const { selected, result } = this.props;

    const secondarySelected = selected.obj ? 'secondary' : 'selected';

    return (
      <div className={`parent-item menu-item ${type === this.props.selected.type ? secondarySelected : ''}`}>
        <button
          onClick={this._pressParent(type)}
          className="menu-button"
        >
          <div className="color-box" style={{ backgroundColor: color, backgroundImage: 'none' }}/>
          <span>{type}</span>
        </button>
        <input
          type="color"
          value={result[type].color}
          onChange={this._saveColor(type)}
          title="Color"
        />
        <button className="edit" title="Rename" onClick={this._rename(type)}>✎</button>
        <button className="edit" title="Delete" onClick={this._delete(type)}>␡</button>
      </div>
    );
  };

  _rename = type => () => {
    const result = this.props.result;

    const newName = prompt(`Rename object type: "${type}"`);

    if (typeof newName === 'string' && newName.length > 0) {
      const value = result[type];

      result[newName] = value;
      for (let obj of result[newName].objects) {
        obj.type = newName;
      }
      this.props.setSelected(null, newName);

      delete result[type];
    }
  }

  _delete = type => () => {
    const result = this.props.result;
    const keys = Object.keys(result);

    if (keys.length <= 1) {
      alert('Cannot delete: You must have atleast one type of object');
    } else {
      if (this.props.selected.type === type) {
        this.props.setSelected(null, result[Object.keys(result)[0]]);
      }

      delete result[type];
    }
  }

  _pressParent = type => () => {
    this.props.setSelected(null, type);
  }

  _pressChild = obj => () => {
    this.props.setSelected(obj);
  }

  _saveColor = type => e => {
    this.props.result[type].color = e.target.value;
  }

  render() {

    const { result } = this.props;

    const keys = Object.keys(result);

    return (
      <div className="objects-menu">
        {keys.map(key => {
          const parent = result[key];

          return (
            <div key={key}>
              <this._ParentItem
                color={parent.color}
                type={key}
              />
              <div>
                {parent.objects.map((obj, index) => (
                  <this._ChildItem
                    key={index}
                    obj={obj}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

}

export default ObjectsMenu;
