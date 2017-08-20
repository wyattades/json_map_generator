import 'p5';
import 'p5/lib/addons/p5.dom';

import './style.scss';

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

// Constants
const DOM_ID = 'canvas';

// Variables
let snap = 15;
let zoom = 1.0;
let translate = {
  x: snap * 4,
  y: snap * 4,
};
let hover = {
  x: 0,
  y: 0,
  rx: 0,
  ry: 0,
};
let canvas;
let objects = [];
let dragging = {};
let hovering = null;
let selected = {
  nodes: [
    { dx: 0, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
  ],
};
let dom = {};
let keys = {
  left: 0,
  right: 0,
  up: 0,
  down: 0,
  minus: 0,
  plus: 0,
};

const roundSnap = val => Math.round(val / snap) * snap;

const render = () => {

  p.noStroke();
  p.fill(255, 0, 0);
  p.ellipse(hover.rx, hover.ry, 2, 2);

  p.stroke(0);
  
  for (let o of objects) {
    if (selected.obj === o) {
      p.strokeWeight(3);
    } else {
      p.strokeWeight(1);
    }
    
    if (dragging.obj === o) {
      p.fill(190, 0, 0);
    } else if (hovering === o) {
      p.fill(220, 0, 0);
    } else {
      p.fill(255, 0, 0);
    }
    
    p.rect(o.x, o.y, o.w, o.h);
  }
  
  if (selected.obj) {
    p.strokeWeight(1);
    
    const NODE = 6 / zoom;
    
    for (let n of selected.nodes) {
      if (dragging.obj === n) {
        p.fill(160);
      } else if (hovering === n) {
        p.fill(200);
      } else {
        p.fill(255);
      }
      
      p.ellipse(n.x, n.y, NODE, NODE);
    }
  }
};

const getHovering = () => {

  const NODE = 6 / zoom;
  
  if (dragging.obj) {
    return dragging.obj;
  }
  
  const mx = hover.x,
        my = hover.y,
        s = selected.obj;
  
  if (s) {
    for (let n of selected.nodes) {
      const x = s.x + n.dx * s.w,
            y = s.y + n.dy * s.h;
      if (((mx - x) * (mx - x) + (my - y) * (my - y)) < NODE * NODE) {
        return n;
      }
    }
  }
  
  // Reverse iterate because the last elements should be hovered first
  // because they are displayed first
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    
    if (mx > o.x && mx < o.x + o.w && my > o.y && my < o.y + o.h) {
      return o;
    }
  }
  
  return null;
};

const updateNodes = () => {
  const o = selected.obj;
  
  for (let n of selected.nodes) {
    n.x = o.x + n.dx * o.w;
    n.y = o.y + n.dy * o.h;
  }
};

const setSelected = obj => {
  selected.obj = obj;

  if (!obj) {
    dom.objectDialog.style.display = 'none';
  } else {
    dom.objectDialog.style.display = 'flex';
    updateNodes();
  }
};

const deleteSelected = () => {
  if (selected.obj) {
    objects = objects.filter(o => o !== selected.obj);
    setSelected(null);
  }
};

const setDragging = obj => {
  dragging = {
    obj,
    offsetX: hover.x - obj.x,
    offsetY: hover.y - obj.y,
    mOffsetX: p.mouseX - obj.x,
    mOffsetY: p.mouseY - obj.y,
  };
};

const dragObject = () => {
  const { obj: d, offsetX, offsetY, mOffsetX, mOffsetY } = dragging;

  // if dragging.obj is not transform
  if (d.w !== undefined || d.dx !== undefined) {
    d.x = roundSnap(hover.x - offsetX);
    d.y = roundSnap(hover.y - offsetY);
  } else {
    d.x = roundSnap(p.mouseX - mOffsetX);
    d.y = roundSnap(p.mouseY - mOffsetY);
  }
  
  // if dragging.obj is a node
  if (d.dx !== undefined) {
    
    // This was a pain to figure out
    const op = num => num === 0 ? 1 : 0;
    const sn = num => num === 0 ? -1 : 1;

    const o = selected.obj;
    
    o.w = o.x * sn(op(d.dx)) + d.x * sn(d.dx) + o.w * op(d.dx);
    o.h = o.y * sn(op(d.dy)) + d.y * sn(d.dy) + o.h * op(d.dy);
    o.x = d.x * op(d.dx) + o.x * d.dx;
    o.y = d.y * op(d.dy) + o.y * d.dy;
  }
  
};

const createOutput = () => {
  dom.output.value = JSON.stringify(
    objects.map(({ x, y, w, h }) => ({
      x, y, w, h,
    })),
  );
};

const createObject = () => {
  const obj = {
    x: -translate.x + roundSnap(p.width / 2),
    y: -translate.y + roundSnap(p.height / 2),
    w: snap * 5,
    h: snap * 3,
  };
  objects.push(obj);

  setSelected(obj);
};

const bindElement = (id, action) => {
  const el = document.getElementById(id);
  if (el) {
    action(el);
  } else {
    console.error(`Invalid element id: ${id}`);
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

const changeZoom = delta => {
  const old_zoom = zoom;
  zoom = p.constrain(zoom + delta, 0.3, 2.0);

  if (old_zoom !== zoom) {
    translate.x = p.mouseX - hover.x * zoom;
    translate.y = p.mouseY - hover.y * zoom;
  }
};

const update = () => {
  translate.x -= (keys.right - keys.left) * snap;
  translate.y -= (keys.down - keys.up) * snap;
  changeZoom((keys.plus - keys.minus) * 0.01);
  
  hover.x = (p.mouseX - translate.x) / zoom;
  hover.y = (p.mouseY - translate.y) / zoom;
  hover.rx = roundSnap(hover.x);
  hover.ry = roundSnap(hover.y);

  if (dragging.obj) {
    dragObject();
    if (selected.obj) {
      updateNodes();
    }
  }
  
  hovering = getHovering();
};


const mousePressed = () => {
  if (selected.obj) {
    for (let n of selected.nodes) {
      if (hovering === n) {
        setDragging(n);
        return;
      }
    }
  }
  
  for (let i = objects.length - 1; i >= 0; i--) {
    let o = objects[i];
    
    if (hovering === o) {
      objects.move(i, objects.length);
      
      setSelected(o);
      setDragging(o);
      return;
    }
  }
  
  setDragging(translate);
  setSelected(null);
};

const mouseReleased = () => {
  dragging.obj = null;
};

const mouseWheel = ({ deltaY }) => changeZoom(deltaY * -0.002);

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

  dom = {
    grid: document.getElementById('grid'),
    output: document.getElementById('json-rep'),
    objectDialog: document.getElementById('object-dialog'),
  };

  bindInput('input-snap', snap, val => {
    snap = parseInt(val, 10);
  });
  
  bindButton('btn-delete', deleteSelected);
  bindButton('btn-create', createObject);
  bindButton('btn-export', createOutput);
  bindButton('btn-import', () => {
    setSelected(null);
    
    const correctJSON = dom.output.value.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2":');
    try {
      objects = JSON.parse(correctJSON);
      if (!Array.isArray(objects)) {
        alert('JSON must be an array');
        objects = [];
        dom.output.value = correctJSON;
      }
    } catch (e) {
      alert('Invalid JSON provided');
    }
  });
  bindButton('btn-duplicate', () => {
    const copy = Object.assign({}, selected.obj);
    copy.x += snap;
    copy.y += snap;
    objects.push(copy);
    setSelected(copy);
  });
    
  p.ellipseMode(p.RADIUS);
  p.textSize(20);
  p.textAlign(p.RIGHT, p.BOTTOM);

  setSelected(null);
};

p.draw = () => {
  
  // UPDATE
  update();

  const size = 1000 * zoom * snap;
  dom.grid.setAttribute('style', `
    width: ${size}px;
    height: ${size}px;
    left: ${-size * 0.5 + translate.x}px;
    top: ${-size * 0.5 + translate.y}px;
  `);
  
  // RENDER
  p.clear();
  
  p.push();
  // p.translate(-translate.x / 2, -translate.y / 2);
  p.translate(translate.x, translate.y);
  p.scale(zoom);

  render();
  p.pop();

  p.fill(0);
  p.text(`(x: ${hover.rx}, y: ${hover.ry})`, p.width - 5, p.height - 5);

};

window.onresize = () => {
  canvas.size(p.innerWidth, p.innerHeight);
};
