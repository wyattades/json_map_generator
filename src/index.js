import 'p5';
import 'p5/lib/addons/p5.dom';
import Joi from 'joi-browser';
import React from 'react';
import ReactDOM from 'react-dom';

import './style.scss';
import InteractiveMap from './interactiveMap';
import ObjectsMenu from './objectsMenu';

const p = window;

Array.prototype.move = function move(old_index, new_index) {
  if (old_index === new_index) {
    return;
  }
  if (this[old_index] === undefined) {
    console.error('Invalid element to move');
    return;
  }
  
  const val = this.splice(old_index, 1)[0];
  
  if (new_index <= 0) {
    this.unshift(val);
  } else if (new_index >= this.length) {
    this.push(val);
  } else {
    this.splice(new_index, 0, val);
  }
};

const hexColorSchema = Joi.string().regex(/^#([a-f0-9]{6})$/, 'Hex Color');

const objectSchema = Joi.object().keys({
  x: Joi.number().required(),
  y: Joi.number().required(),
  w: Joi.number().required(),
  h: Joi.number().required(),
  color: hexColorSchema,
  type: Joi.string(),
}).required();

const arraySchema = Joi.array().items(objectSchema).required();

const resultSchema = Joi.object().pattern(/.*/, Joi.object().keys({
  color: hexColorSchema.default('#ffffff'),
  objects: arraySchema.required(),
})).required();

// Constants
const DOM_ID = 'canvas';

// Variables
let map;
let canvas;
let objects = [];
let result = {};
let dom = {};
let keys = {
  left: 0,
  right: 0,
  up: 0,
  down: 0,
  minus: 0,
  plus: 0,
};

const getDefaultResult = () => {
  const _keys = Object.keys(result);
  if (_keys.length > 0) {
    return _keys[0];
  } else {
    const defaultKey = 'default';

    result[defaultKey] = {
      color: '#ffffff',
      objects: [],
    };
    return defaultKey;
  }
};

const createOutput = () => {
  try {
    dom.output.value = JSON.stringify(result);
  } catch (err) {
    alert(err);
  }
};

const setSelected = (obj, type) => {
  map.selected.obj = obj;
  map.selected.type = type || (obj && obj.type) || map.selected.type;

  if (obj) {
    map.updateNodes();
  }
};

const deleteSelected = () => {
  
  if (map.selected.obj) {
    result[map.selected.obj.type].objects = result[map.selected.obj.type].objects.filter(o => o !== map.selected.obj);
    objects = objects.filter(o => o !== map.selected.obj);

    setSelected(null);
  }
  // else if (map.selected.type) {
  //   objects = objects.filter(o => o.type !== map.selected.type);
  //   delete result[map.selected.type];
  // }
};

const createObject = obj => {
  obj = obj || map.getNewObject();
  obj.type = obj.type || map.selected.type;

  objects.push(obj);
  result[obj.type].objects.push(obj);
  
  setSelected(obj);
};

const createType = () => {

  const type = prompt('Enter a new object type:');

  if (type) {
    if (result[type]) {
      alert('This object type already exists!');
    } else {
      result[type] = {
        color: '#ffffff',
        objects: [],
      };

      setSelected(null, type);
    }
  }
};

const bindElement = (elOrId, action) => {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (el) {
    action(el);
  } else {
    console.error(`Invalid element: ${elOrId}`);
  }
};

const bindButton = (id, onPress) => bindElement(id, el => {
  el.onclick = onPress;
});

const bindInput = (id, value, onSave) => bindElement(id, el => {
  el.value = value;
  
  el.onkeydown = e => {
    if (e.keyCode === 13) { // 'enter' key
      el.blur();
    }
  };
  el.blur = () => onSave(el.value);
});

const mousePressed = () => {
  if (map.selected.obj) {
    for (let n of map.selected.nodes) {
      if (map.hovering === n) {
        map.setDragging(n);
        return;
      }
    }
  }
  
  for (let i = objects.length - 1; i >= 0; i--) {
    let o = objects[i];
    
    if (map.hovering === o) {
      objects.move(i, objects.length);
      
      setSelected(o);
      map.setDragging(o);
      return;
    }
  }
  
  map.setDragging(map.translate);
  setSelected(null);
};

const mouseReleased = () => {
  map.setDragging(null);
};

const mouseWheel = ({ deltaY }) => map.zoom(deltaY * -0.002);

p.keyPressed = () => {
  switch (p.keyCode) {
    case p.LEFT_ARROW: keys.left = 1; break;
    case p.RIGHT_ARROW: keys.right = 1; break;
    case p.UP_ARROW: keys.up = 1; break;
    case p.DOWN_ARROW: keys.down = 1; break;
    case 187: keys.plus = 1; break;
    case 189: keys.minus = 1; break;
    case p.DELETE: deleteSelected(); break;
    default:
  }
};

p.keyReleased = () => {
  switch (p.keyCode) {
    case p.LEFT_ARROW: keys.left = 0; break;
    case p.RIGHT_ARROW: keys.right = 0; break;
    case p.UP_ARROW: keys.up = 0; break;
    case p.DOWN_ARROW: keys.down = 0; break;
    case 187: keys.plus = 0; break;
    case 189: keys.minus = 0; break;
    default:
  }
};

p.setup = () => {
    
  canvas = p.createCanvas(p.innerWidth, p.innerHeight);
  canvas.parent(DOM_ID);

  canvas.mousePressed(mousePressed);
  canvas.mouseReleased(mouseReleased);
  canvas.mouseWheel(mouseWheel);

  map = new InteractiveMap(p.width, p.height);

  dom = {
    grid: document.getElementById('grid'),
    output: document.getElementById('json-rep'),
    objectDialog: document.getElementById('object-dialog'),
    objectsMenu: document.getElementById('objects-menu'),
    colorPicker: document.getElementById('color-object'),
  };

  bindInput('input-snap', map.snap, val => {
    map.snap = parseInt(val, 10);
  });
  
  bindButton('btn-delete', deleteSelected);
  bindButton('btn-create-object', () => createObject());
  bindButton('btn-export', createOutput);
  bindButton('btn-create-type', createType);
  bindButton('btn-revert-color', () => {
    delete map.selected.obj.color;
  });
  bindButton('btn-import', () => {
    setSelected(null);
    
    let newResult;

    try {
      newResult = JSON.parse(dom.output.value.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2":'));
    } catch (e) {
      alert('Invalid JSON provided');
      return;
    }

    if (Array.isArray(newResult)) {
      newResult = {
        default: {
          objects: newResult,
        },
      };
    }

    resultSchema.validate(newResult, (err, _result) => {
      if (err) {
        alert('Invalid object structure provided');
      } else {
        result = _result;
        setSelected(null, getDefaultResult());
        dom.output.value = JSON.stringify(result);
      }
    });
  });
  bindButton('btn-duplicate', () => {
    const copy = Object.assign({}, map.selected.obj);
    copy.x += map.snap;
    copy.y += map.snap;

    createObject(copy);
  });
    
  dom.colorPicker.value = null;
  dom.colorPicker.oninput = e => {
    const obj = map.selected.obj;
    if (obj) {
      obj.color = e.target.value;
    }
  };

  p.ellipseMode(p.RADIUS);
  p.textSize(20);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.colorMode(p.HSB, 255);

  setSelected(null, getDefaultResult());
};

p.draw = () => {

  // TEMP
  dom.objectDialog.style.display = map.selected.obj ? 'flex' : 'none';
  
  // UPDATE
  map.updateCursor(p.mouseX, p.mouseY, objects);
  map.pan(keys.right - keys.left, keys.down - keys.up);
  map.zoom((keys.plus - keys.minus) * 0.02);

  const size = 1000 * map.translate.z * map.snap;
  dom.grid.setAttribute('style', `
    width: ${size}px;
    height: ${size}px;
    left: ${-size * 0.5 + map.translate.x}px;
    top: ${-size * 0.5 + map.translate.y}px;
  `);
  
  // RENDER
  p.clear();
  
  p.push();
  // p.translate(-translate.x / 2, -translate.y / 2);
  p.translate(map.translate.x, map.translate.y);
  p.scale(map.translate.z);

  map.render(p, objects, result);
  p.pop();

  p.fill(0);
  p.text(`(x: ${map.hover.rx}, y: ${map.hover.ry})`, p.width - 5, p.height - 5);

  ReactDOM.render(
    <ObjectsMenu
      result={result}
      selected={map.selected}
      setSelected={setSelected}
    />,
    dom.objectsMenu,
  );

};

window.onresize = () => {
  canvas.size(p.innerWidth, p.innerHeight);
  map.size(canvas.width, canvas.height);
};
