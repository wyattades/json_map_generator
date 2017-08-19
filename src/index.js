import 'p5';
import 'p5/lib/addons/p5.dom';

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
const NODE = 6; // node radius
const MAX_SIZE = 300;

// Variables
let snap = 15;
let canvas;
// let zoom = 1.0;
let translate = {
  x: snap * 4,
  y: snap * 4,
};
let hover = {
  x: 0,
  y: 0,
};
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
let output;
let left = 0,
    right = 0,
    up = 0,
    down = 0;

const drawGrid = () => {
  p.strokeWeight(1);
  p.stroke(80);
  for (let x = 0; x <= p.width; x += snap) {
    p.line(x, 0, x, p.height);
  }
  for (let y = 0; y <= p.height; y += snap) {
    p.line(0, y, p.width, y);
  }
};

const drawAxis = () => {
  
  const m = MAX_SIZE * snap;
  
  // p.strokeWeight(1);
  // p.stroke(80);
  // for (let x = -m; x <= m; x += snap) {
  //   p.line(x, -m, x, m);
  // }
  // for (let y = -m; y <= m; y += snap) {
  //   p.line(-m, y, m, y);
  // }
  
  p.strokeWeight(2);
  p.stroke(255);
  p.line(-m, 0, m, 0);
  p.line(0, -m, 0, m);
};

const render = () => {
  p.stroke(255);
  
  for (let o of objects) {
    if (selected.obj === o) {
      p.strokeWeight(3);
    } else {
      p.strokeWeight(1);
    }
    
    if (dragging.obj === o) {
      p.fill(180);
    } else if (hovering === o) {
      p.fill(128);
    } else {
      p.fill(255, 0, 0);
    }
    
    p.rect(o.x, o.y, o.w, o.h);
  }
  
  if (selected.obj) {
    p.strokeWeight(1);
    
    for (let n of selected.nodes) {
      if (dragging.obj === n) {
        p.fill(160);
      } else if (hovering === n) {
        p.fill(128);
      } else {
        p.fill(0);
      }
      
      p.ellipse(n.x, n.y, NODE, NODE);
    }
  }
};

const getHovering = () => {
  
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

const deleteSelected = () => {
  if (selected.obj) {
    objects = objects.filter(o => o !== selected.obj);
    selected.obj = null;
  }
};

const dragObject = () => {
  const { obj: d, offsetX, offsetY } = dragging;
  
  d.x = p.round((p.mouseX - offsetX) / snap) * snap;
  d.y = p.round((p.mouseY - offsetY) / snap) * snap;
  
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

const setDragging = obj => {
  dragging = {
    obj,
    offsetX: p.mouseX - obj.x,
    offsetY: p.mouseY - obj.y,
  };
};

const createOutput = () => {
  output.value(JSON.stringify(objects.map(o => ({
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h,
  }))));
};

const createObject = () => {
  objects.push({
    x: -translate.x + Math.round(p.width / 2 / snap) * snap,
    y: -translate.y + Math.round(p.height / 2 / snap) * snap,
    w: snap * 5,
    h: snap * 3,
  });
};

const createInput = (label, value, onSave, x, y, type = 'text') => {
  const _input = p.createInput(value, type);

  _input.elt.onkeypress = e => {
    if (e.keyCode === p.ENTER) {
      _input.elt.blur();
    }
  };

  _input.elt.onblur = () => {
    onSave(_input.value());
  };

  if (label) {
    const _parent = p.createDiv();
    const _label = p.createP(label);
    _label.style('padding', 0);
    _label.style('margin', 0);
    _label.style('color', '#FFF');
    _label.style('float', 'left');
    _input.style('float', 'left');
    // _input.style('margin-left', '-50');
    _parent.child(_label);
    _parent.child(_input);
    _parent.position(x, y);
    // _parent.style('flex-direction', 'row');    
  } else {
    _input.position(x, y);
  }

  return _input;
};

const createButton = (label, onPress, x, y) => {
  const _button = p.createButton(label);
  _button.position(x, y);
  _button.mousePressed(onPress);

  return _button;
};

const update = () => {
  translate.x -= (right - left) * snap;
  translate.y -= (down - up) * snap;
  
  hover.x = p.mouseX - translate.x;
  hover.y = p.mouseY - translate.y;

  if (dragging.obj) {
    dragObject();
    if (selected.obj) {
      updateNodes();
    }
  }
  
  hovering = getHovering();
};

p.setup = () => {
    
  canvas = p.createCanvas(p.innerWidth, p.innerHeight);
  canvas.parent(DOM_ID);
  
  output = createInput(null, '[]', json => {
    try {
      objects = JSON.parse(json);
    } catch (e) {
      createOutput();
    }
  }, 0, p.height - 21);

  createInput('SNAP', snap, val => {
    snap = parseInt(val, 10);
  }, p.width / 2, 0, 'number');
  
  createButton('New Object', createObject, 0, 0);
  
  createButton('Generate JSON', createOutput, 180, p.height - 21);

  createButton('Delete', deleteSelected, p.width - 60, 0);
    
  p.ellipseMode(p.RADIUS);
  p.textSize(20);
  p.textAlign(p.RIGHT, p.BOTTOM);
};

p.draw = () => {
  
  // UPDATE
  update();
  
  // RENDER
  p.background(0);
  
  drawGrid();

  p.push();
  p.translate(translate.x, translate.y);
  // p.scale(zoom);
  drawAxis();
  render();
  p.pop();

  p.fill(255);
  p.text(`(${Math.round(hover.x)}, ${Math.round(hover.y)})`, p.width - 5, p.height - 5);
};

p.mousePressed = () => {
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
      
      // o = objects[objects.length - 1];
      selected.obj = o;
      setDragging(o);
      updateNodes();
      return;
    }
  }
  
  setDragging(translate);
  selected.obj = null;
};

p.mouseReleased = () => {
  dragging.obj = null;
};

p.keyPressed = () => {
  switch (p.keyCode) {
    case p.LEFT_ARROW: left = 1; break;
    case p.RIGHT_ARROW: right = 1; break;
    case p.UP_ARROW: up = 1; break;
    case p.DOWN_ARROW: down = 1; break;
    case p.DELETE: deleteSelected(); break;
    default:
  }
};

p.keyReleased = () => {
  switch (p.keyCode) {
    case p.LEFT_ARROW: left = 0; break;
    case p.RIGHT_ARROW: right = 0; break;
    case p.UP_ARROW: up = 0; break;
    case p.DOWN_ARROW: down = 0; break;
    default:
  }
};

window.onresize = () => {
  canvas.size(p.innerWidth, p.innerHeight);
};
