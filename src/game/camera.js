(function(C){
  'use strict';
  const {clamp}=C.util;

  class IsoCamera{
    constructor(canvas,cameraState,{tileW=92,tileH=46}={}){
      this.canvas=canvas;this.state=cameraState;this.tileW=tileW;this.tileH=tileH;
      this.pointers=new Map();this.dragStart=null;this.lastPinch=null;this.tapCandidate=null;this.onTap=null;this.onHover=null;
      this.bind();
    }

    cssSize(){const r=this.canvas.getBoundingClientRect();return{width:r.width||900,height:r.height||390}}
    center(){const s=this.cssSize();return{x:s.width/2+this.state.panX,y:70+this.state.panY}}
    tileToScreen(x,y){const c=this.center(),z=this.state.zoom;return{x:c.x+(x-y)*this.tileW*.5*z,y:c.y+(x+y)*this.tileH*.5*z}}
    screenToTile(sx,sy){
      const c=this.center(),z=this.state.zoom||1;
      const wx=(sx-c.x)/z,wy=(sy-c.y)/z;
      const x=wy/this.tileH+wx/this.tileW;
      const y=wy/this.tileH-wx/this.tileW;
      return{x:Math.floor(x+.5),y:Math.floor(y+.5),fx:x,fy:y};
    }

    setZoom(value,anchor=null){
      const before=anchor?this.screenToTile(anchor.x,anchor.y):null;
      this.state.zoom=clamp(value,.62,1.85);
      if(anchor&&before){
        const after=this.tileToScreen(before.fx,before.fy);
        this.state.panX+=anchor.x-after.x;this.state.panY+=anchor.y-after.y;
      }
      C.events.emit('camera:changed',this.state);
    }

    zoomBy(delta,anchor){this.setZoom(this.state.zoom*delta,anchor)}
    pan(dx,dy){this.state.panX+=dx;this.state.panY+=dy;C.events.emit('camera:changed',this.state)}

    point(e){const r=this.canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}

    bind(){
      this.canvas.style.touchAction='none';
      this.canvas.addEventListener('wheel',e=>{e.preventDefault();const p=this.point(e);this.zoomBy(e.deltaY<0?1.1:.9,p)},{passive:false});
      this.canvas.addEventListener('pointerdown',e=>{
        this.canvas.setPointerCapture?.(e.pointerId);const p=this.point(e);this.pointers.set(e.pointerId,p);
        if(this.pointers.size===1){this.dragStart={p,startPanX:this.state.panX,startPanY:this.state.panY};this.tapCandidate={p,time:performance.now()}}
        else if(this.pointers.size===2){this.dragStart=null;const pts=[...this.pointers.values()];this.lastPinch={distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),center:{x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2}}}
      });
      this.canvas.addEventListener('pointermove',e=>{
        const p=this.point(e);if(this.pointers.has(e.pointerId))this.pointers.set(e.pointerId,p);
        if(this.pointers.size===1&&this.dragStart){
          const dx=p.x-this.dragStart.p.x,dy=p.y-this.dragStart.p.y;
          if(Math.hypot(dx,dy)>5)this.tapCandidate=null;
          this.state.panX=this.dragStart.startPanX+dx;this.state.panY=this.dragStart.startPanY+dy;C.events.emit('camera:changed',this.state);
        }else if(this.pointers.size===2&&this.lastPinch){
          const pts=[...this.pointers.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),center={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
          if(this.lastPinch.distance>0)this.zoomBy(dist/this.lastPinch.distance,center);
          this.pan(center.x-this.lastPinch.center.x,center.y-this.lastPinch.center.y);this.lastPinch={distance:dist,center};
        }else if(this.pointers.size===0&&this.onHover){this.onHover(this.screenToTile(p.x,p.y),p)}
      });
      const end=e=>{
        const p=this.point(e);this.pointers.delete(e.pointerId);
        if(this.tapCandidate&&performance.now()-this.tapCandidate.time<550&&Math.hypot(p.x-this.tapCandidate.p.x,p.y-this.tapCandidate.p.y)<8){const tile=this.screenToTile(p.x,p.y);this.onTap?.(tile,p)}
        this.tapCandidate=null;this.dragStart=null;if(this.pointers.size<2)this.lastPinch=null;
      };
      this.canvas.addEventListener('pointerup',end);this.canvas.addEventListener('pointercancel',end);
      this.canvas.addEventListener('mousemove',e=>{if(this.pointers.size||!this.onHover)return;const p=this.point(e);this.onHover(this.screenToTile(p.x,p.y),p)});
    }
  }

  C.register('IsoCamera',IsoCamera);
})(window.Codeopolis);
