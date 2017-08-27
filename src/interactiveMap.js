class InteractiveMap {

  static SNAP = 15;

  constructor(width, height) {
    this.size(width, height);

    this.dragging = {};
    this.hovering = null;
    this.selected = {
      nodes: [
        { dx: 0, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 0 },
        { dx: 1, dy: 1 },
      ],
    };
    this.hover = {
      x: 0,
      y: 0,
      rx: 0,
      ry: 0,
      mx: 0,
      my: 0,
    };
    this.snap = InteractiveMap.SNAP;
    this.translate = {
      x: this.snap * 4,
      y: this.snap * 4,
      z: 1.0,
    };
  }

  size = (width, height) => {
    this.width = width;
    this.height = height;
  }

  setDragging = obj => {
    if (obj) {
      this.dragging = {
        obj,
        offsetX: this.hover.x - obj.x,
        offsetY: this.hover.y - obj.y,
        mOffsetX: this.hover.mx - obj.x,
        mOffsetY: this.hover.my - obj.y,
      };
    } else {
      this.dragging = {};
    }
  };

  getNewObject = () => ({
    x: -this.translate.x + this.roundSnap(this.width / 2),
    y: -this.translate.y + this.roundSnap(this.height / 2),
    w: this.snap * 5,
    h: this.snap * 3,
  });

  roundSnap = val => Math.round(val / this.snap) * this.snap;

  updateCursor = (mouseX, mouseY, objects) => {

    this.hover.mx = mouseX;
    this.hover.my = mouseY;
    this.hover.x = (this.hover.mx - this.translate.x) / this.translate.z;
    this.hover.y = (this.hover.my - this.translate.y) / this.translate.z;
    this.hover.rx = this.roundSnap(this.hover.x);
    this.hover.ry = this.roundSnap(this.hover.y);

    if (this.dragging.obj) {
      this.dragObject();

      if (this.selected.obj) {
        this.updateNodes();
      }

      this.hovering = this.dragging.obj;
      return;
    }
    
    const hx = this.hover.x,
          hy = this.hover.y,
          s = this.selected.obj,
          node = 6 * 6 / (this.translate.z * this.translate.z);
    
    if (s) {
      for (let n of this.selected.nodes) {
        const x = s.x + n.dx * s.w,
              y = s.y + n.dy * s.h;
        if (((hx - x) * (hx - x) + (hy - y) * (hy - y)) < node) {
          this.hovering = n;
          return;
        }
      }
    }
    
    // Reverse iterate because the last elements should be hovered first
    // because they are displayed first
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      
      if (hx > o.x && hx < o.x + o.w && hy > o.y && hy < o.y + o.h) {
        this.hovering = o;
        return;
      }
    }
    
    this.hovering = null;
  };

  updateNodes = () => {
    const o = this.selected.obj;
    
    for (let n of this.selected.nodes) {
      n.x = o.x + n.dx * o.w;
      n.y = o.y + n.dy * o.h;
    }
  };

  pan = (dx, dy) => {
    this.translate.x -= dx * this.snap;
    this.translate.y -= dy * this.snap;
  };

  zoom = delta => {
    const old_zoom = this.translate.z;
    this.translate.z = Math.min(Math.max(this.translate.z + delta, 0.3), 2.0);
  
    if (old_zoom !== this.translate.z) {
      this.translate.x = this.hover.mx - this.hover.x * this.translate.z;
      this.translate.y = this.hover.my - this.hover.y * this.translate.z;
    }
  };

  dragObject = () => {
    const { obj: d, offsetX, offsetY, mOffsetX, mOffsetY } = this.dragging;
  
    // if dragging.obj is not transform
    if (d.w !== undefined || d.dx !== undefined) {
      d.x = this.roundSnap(this.hover.x - offsetX);
      d.y = this.roundSnap(this.hover.y - offsetY);
    } else {
      d.x = this.roundSnap(this.hover.mx - mOffsetX);
      d.y = this.roundSnap(this.hover.my - mOffsetY);
    }
    
    // if dragging.obj is a node
    if (d.dx !== undefined) {
      
      // This was a pain to figure out
      const op = num => num === 0 ? 1 : 0;
      const sn = num => num === 0 ? -1 : 1;
  
      const o = this.selected.obj;
      
      o.w = o.x * sn(op(d.dx)) + d.x * sn(d.dx) + o.w * op(d.dx);
      o.h = o.y * sn(op(d.dy)) + d.y * sn(d.dy) + o.h * op(d.dy);
      o.x = d.x * op(d.dx) + o.x * d.dx;
      o.y = d.y * op(d.dy) + o.y * d.dy;
    }
    
  };

  render = (p, objects, result) => {
    
    p.noStroke();
    p.fill(255, 0, 0);
    p.ellipse(this.hover.rx, this.hover.ry, 2, 2);
  
    p.stroke(0);
    
    for (let o of objects) {
      if (this.selected.obj === o) {
        p.strokeWeight(3);
      } else {
        p.strokeWeight(1);
      }
      
      const color = p.color(o.color || result[o.type].color);
      if (this.dragging.obj === o) {
        p.fill(p.hue(color), Math.abs(p.saturation(color) - 100), p.brightness(color));
      } else if (this.hovering === o) {
        p.fill(p.hue(color), Math.abs(p.saturation(color) - 50), p.brightness(color));
      } else {
        p.fill(color);
      }
      
      p.rect(o.x, o.y, o.w, o.h);
    }
    
    if (this.selected.obj) {
      p.strokeWeight(1);
      
      const NODE = 6 / this.translate.z;
      
      for (let n of this.selected.nodes) {
        if (this.dragging.obj === n) {
          p.fill(160);
        } else if (this.hovering === n) {
          p.fill(200);
        } else {
          p.fill(255);
        }
        
        p.ellipse(n.x, n.y, NODE, NODE);
      }
    }
  };

}

export default InteractiveMap;
