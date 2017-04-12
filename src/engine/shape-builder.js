"use strict"

import * as InteractUtils from "../interactions/interact-utils"
import * as Point2d from "../core/point2d"
import BasicStyle from "../style/basic-style"
import DrawEngine from "./draw-engine"
import Mat2d from "../core/mat2d"
import PolyLine from "../shapes/poly-line"
import StrokeStyle from "../style/stroke-style"
import VertEditableShape from "../interactions/vert-editable-shape"
import XformShape from "../interactions/xform-shape"

const scaleSvg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\">\
<g transform=\"rotate(<degrees>,24,24)\">\
<polygon style=\"fill:%23ffffff;\" points=\"16,20 16,12 4,24 16,36 16,28 32,28 32,36 44,24 32,12 32,20 \"/>\
<polygon points=\"14,22 14,17 7,24 14,31 14,26 34,26 34,31 41,24 34,17 34,22 \"/>\
</g>\
</svg>')"

const rotateSvg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\">\
<g transform=\"rotate(<degrees>,24,24)\">\
<path style=\"fill:%23ffffff;\" d=\"M25.9,4C16.6,4,8.8,11.2,7.4,20.8H6.7H3.3l1.6,2.9l3.8,7.1l1.8,3.3l1.8-3.3l3.8-7.1l1.6-2.9h-3.3h-0.1 c1.3-5.7,6.1-9.9,11.7-9.9c8,0,12.1,4.4,12.1,13.1c0,7.2-5.4,13.1-12.1,13.1h-2v2V42v2h2c10.4,0,18.8-9,18.8-20 C44.7,11.7,37.5,4,25.9,4L25.9,4z\"/>\
<path d=\"M25.9,6c10.5,0,16.8,6.7,16.8,18c0,9.9-7.5,18-16.8,18v-2.9c7.8,0,14.1-6.8,14.1-15.1c0-5.6-1.8-15.1-14.1-15.1 c-7.4,0-13.4,6.1-14,13.9h2.4l-3.8,7.1l-3.8-7.1h2.5C9.7,13.4,17,6,25.9,6\"/>\
</g>\
</svg>')"

const addSvg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\">\
<polygon style=\"fill:%23ffffff;\" points=\"31.2,28 24.8,28 24.8,32.8 20,32.8 20,39.2 24.8,39.2 24.8,44 31.2,44 31.2,39.2 36,39.2 36,32.8 31.2,32.8 \"/> \
<polygon style=\"fill:%23ffffff\" points=\"12,32 12,4 32.3,24.3 20,24.3 19.7,24.6 \"/>\
<polygon points=\"13.8,8.2 13.8,27.8 19,22.8 19.2,22.5 28,22.5 \"/>\
<polyline points=\"29.6,29.6 29.6,34.4 34.4,34.4 34.4,37.6 29.6,37.6 29.6,42.4 26.4,42.4 26.4,37.6 21.6,37.6 21.6,34.4 26.4,34.4 26.4,29.6 29.6,29.6  \"/>\
</svg>')"

const removeSvg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\">\
<rect style=\"fill:%23ffffff;\" x=\"20\" y=\"32.8\" width=\"16\" height=\"6.4\"/>\
<polygon  style=\"fill:%23ffffff;\" points=\"12,32 12,4 32.3,24.3 20,24.3 19.7,24.6 \"/>\
<polygon points=\"13.8,8.2 13.8,27.8 19,22.8 19.2,22.5 28,22.5 \"/>\
<polyline points=\"34.4,34.4 34.4,37.6 21.6,37.6 21.6,34.4 \"/>\
</svg>')"

const repositionSvg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\">\
<path style=\"fill:%23ffffff;\" d=\"M24,17.5c-3.6,0-6.5,2.9-6.5,6.5s2.9,6.5,6.5,6.5s6.5-2.9,6.5-6.5S27.6,17.5,24,17.5L24,17.5z\"/>\
<path style=\"fill:%23ffffff;\" d=\"M24,4L4,24l20,20l20-20L24,4z M31.5,31.5h-15v-15h15V31.5z\"/>\
<polygon points=\"17,34 24,40.5 31,34  \"/>\
<polygon points=\"31,14 24,7.5 17,14     \"/>\
<polygon points=\"14,17 7.5,24 14,31   \"/>\
<polygon points=\"34,31 40.5,24 34,17    \"/>\
<path d=\"M24,20c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S21.8,20,24,20\"/>\
</svg>')"

const EventConstants = {
  SELECTION_CHANGED: "draw:selectionChanged",
  DRAG_BEGIN: "draw:drag:begin",
  DRAG_END: "draw:drag:end"
}

const tmpPt1 = Point2d.create(0, 0)
const tmpPt2 = Point2d.create(0, 0)

const boundsStrokeStyle = new StrokeStyle({
  strokeColor: "darkgray",
  strokeWidth: 2
})

const defaultXformStyle = {
  fillColor: "white",
  strokeColor: "black",
  strokeWidth: 2
}

function inCanvas(canvas, x, y) {
  const domrect = canvas.getBoundingClientRect()
  let localX = 0
  let localY = 0
  return ((localX = x - domrect.left - canvas.clientLeft) >= 0 && localX <= canvas.clientWidth && (localY = y - domrect.top - canvas.clientTop) >= 0 && localY <= canvas.clientHeight)
}

function getLocalMousePos(out, elem, event) {
  const domrect = elem.getBoundingClientRect()
  out[0] = event.clientX - domrect.left - elem.clientLeft
  out[1] = event.clientY - domrect.top - elem.clientTop
}

function transformSelectedShape(canvas, event, selectedInfo, camera) {
  getLocalMousePos(tmpPt1, canvas, event)
  Point2d.transformMat2d(tmpPt2, tmpPt1, camera.screenToWorldMatrix)
  const shape = selectedInfo.shape
  if (shape instanceof XformShape) {
    InteractUtils.transformXformShape(shape, selectedInfo, tmpPt1, tmpPt2, camera)
  } else if (shape instanceof VertEditableShape) {
    InteractUtils.translateVert(shape, selectedInfo, tmpPt1, tmpPt2, camera)
  } else {
    InteractUtils.translateShape(shape, selectedInfo, tmpPt1, tmpPt2, camera)
  }
}

function addEventKeysToSelectedInfo(event, selectedInfo) {
  selectedInfo.keys = {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey
  }
}

function getSelectedObjsFromMap(selectionMap) {
  const selectedObjs = []
  selectionMap.forEach((subshape, shape) => {
    selectedObjs.push(shape)
  })
  return selectedObjs
}

function selectShape(selectedShape, sortedShapes, currSelectedShapes, selectStyle, xformStyle, selectOpts) {
  const fireObject = {
    unselectedShapes: getSelectedObjsFromMap(currSelectedShapes)
  }
  clearSelectedShapes(currSelectedShapes)
  selectedShape.save()
  const maxZ = sortedShapes[sortedShapes.length - 1].zIndex
  selectedShape.zIndex = maxZ + 1
  BasicStyle.copyBasicStyle(selectStyle, selectedShape)
  selectedShape.selected = true
    // const dimensions = selectedShape.getDimensions()

  let newSelectShape = null
  if (selectOpts.scalable || selectOpts.rotatable) {
    newSelectShape = new XformShape(xformStyle || defaultXformStyle, selectOpts)
    selectedShape.addChildXform(newSelectShape)
  }
  currSelectedShapes.set(selectedShape, newSelectShape)

  fireObject.selectedShapes = [selectedShape]
  return fireObject
}

function clearSelectedShapes(selectedShapeMap) {
  selectedShapeMap.forEach((selectedShape, shape) => {
    shape.restore()
    shape.selected = false
    shape.removeChildXform(selectedShape)
  })
  selectedShapeMap.clear()
}

function clearSpecificShapes(selectedShapeMap, shapes) {
  const clearedShapes = []
  shapes.forEach(shape => {
    const selectedShape = selectedShapeMap.get(shape)
    shape.restore()
    shape.selected = false
    shape.removeChildXform(selectedShape)
    selectedShapeMap.delete(shape)
    clearedShapes.push(shape)
  })
  return clearedShapes
}

function appendCustomCursor(_event, target, cursorStyle, offsetX = -14, offsetY = -14) {
  const cursor = document.getElementById('cursor')

  const mouseX = (e) => {
    return `${(e.offsetX) + 'px'}`
  }

  const mouseY = (e) => {
    return `${(e.offsetY) + 'px'}`
  }

  if (cursor === null) {
    const newCursor = document.createElement('span')
    newCursor.setAttribute('id', 'cursor')
    newCursor.setAttribute('style', `position: absolute; top: ${mouseY(_event)}; left: ${mouseX(_event)}; width: 28px; height: 28px; background: ${cursorStyle} no-repeat; cursor: none; pointer-events: none; transform: translate(${offsetX}px, ${offsetY}px)`)
    target.appendChild(newCursor)
  } else if (cursor.style.background !== cursorStyle + 'no-repeat') {
    cursor.style.background = cursorStyle + 'no-repeat'
    cursor.style.top = mouseY(_event)
    cursor.style.left = mouseX(_event)
  } else {
    cursor.style.top = mouseY(_event)
    cursor.style.left = mouseX(_event)
  }
}

function updateCursorPosition(_event) {
  const cursor = document.getElementById('cursor')

  const mouseX = (e) => {
    return `${(e.offsetX) + 'px'}`
  }

  const mouseY = (e) => {
    return `${(e.offsetY) + 'px'}`
  }

  if (cursor !== null) {
    cursor.style.top = mouseY(_event)
    cursor.style.left = mouseX(_event)
  }
}

export default class ShapeBuilder extends DrawEngine {
  constructor(parent, opts) {
    super(parent, opts)
  }

  _mousedownCB(event) {
    if (!inCanvas(this._drawCanvas, event.clientX, event.clientY)) {
      return
    }

    this.timer = performance.now()

    Point2d.set(tmpPt1, event.offsetX, event.offsetY)
    Point2d.transformMat2d(tmpPt2, tmpPt1, this._camera.screenToWorldMatrix)
    const worldToScreenMatrix = this._camera.worldToScreenMatrix
    const shapes = this.sortedShapes
    let i = -1
    let selectedShape = null
    let selectedInfo = null
    for (i = shapes.length - 1; i >= 0; i -= 1) {
      const shapeInfo = this._objects.get(shapes[i])
      if (shapes[i].selected) {
        selectedShape = this._selectedShapes.get(shapes[i])
        selectedInfo = shapeInfo
        let hitInfo = null
        if (selectedShape && (hitInfo = selectedShape.containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)).hit) {
          if (selectedShape instanceof VertEditableShape && event.altKey && hitInfo.controlIndex < shapes[i].numVerts) {
            shapes[i].removeVert(hitInfo.controlIndex)
            selectedShape = null
          } else {
            const localXform = selectedShape.parent.localXform
            const invLocalXform = Mat2d.clone(localXform)
            Mat2d.invert(invLocalXform, invLocalXform)
            const startObjPos = Point2d.clone(tmpPt2)
            Point2d.transformMat2d(startObjPos, startObjPos, invLocalXform)
            this._dragInfo = Object.assign({
              rotate: Boolean(hitInfo.rotate),
              controlIndex: hitInfo.controlIndex,
              startObjectPos: startObjPos,
              worldToObjectMatrix: invLocalXform,
              startLocalPos: selectedShape.parent.getPosition(),
              startLocalScale: selectedShape.parent.getScale(),
              startLocalRot: selectedShape.parent.getRotation(),
              shapeWidth: selectedShape.parent.width,
              shapeHeight: selectedShape.parent.height
            }, selectedInfo)
          }
          break
        } else if (shapes[i].containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)) {
          selectedShape = shapes[i]
          break
        }
      }
      // else if (shapeInfo.selectable && shapes[i].containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)) {
      //   selectedShape = shapes[i]
      //   selectedInfo = shapeInfo
      //   const selectEventObj = selectShape(selectedShape, shapes, this._selectedShapes, this._selectStyle, this._xformStyle, selectedInfo)
      //   this.fire(EventConstants.SELECTION_CHANGED, selectEventObj)
      //   break
      // }
    }

    if (i < 0 && this._selectedShapes.size) {
      if (this._selectedShapes.size) {
        this.fire(EventConstants.SELECTION_CHANGED, {
          unselectedShapes: getSelectedObjsFromMap(this._selectedShapes),
          selectedShapes: []
        })
      }
      this._dragInfo = null
      clearSelectedShapes(this._selectedShapes)
    } else if (selectedShape && selectedInfo && (selectedInfo.movable || selectedInfo.rotatable || selectedInfo.scalable)) {
      if (!this._dragInfo && selectedInfo.movable) {
        this._dragInfo = {
          startLocalPos: selectedShape.getPosition()
        }
      }

      if (this._dragInfo) {
        this._dragInfo.shape = selectedShape
        this._dragInfo.startPos = Point2d.clone(tmpPt1)
        this._dragInfo.startWorldPos = Point2d.clone(tmpPt2)
        this._dragInfo.objectToWorldMatrix = Mat2d.clone(selectedShape.globalXform)
        addEventKeysToSelectedInfo(event, this._dragInfo)
        event.stopImmediatePropagation()
        this.fire(EventConstants.DRAG_BEGIN, {
          shapes: getSelectedObjsFromMap(this._selectedShapes)
        })
      }
    }
    event.preventDefault()

  }

  _mouseupCB(event) {
    if (this._dragInfo && this._dragInfo.shape) {
      event.stopImmediatePropagation()
      event.preventDefault()
      this._dragInfo = null
      this.fire(EventConstants.DRAG_END, {
        shapes: getSelectedObjsFromMap(this._selectedShapes)
      })
    } else if (performance.now() - this.timer < 500) {
      // this is a relatively quick click

      Point2d.set(tmpPt1, event.offsetX, event.offsetY)
      Point2d.transformMat2d(tmpPt2, tmpPt1, this._camera.screenToWorldMatrix)
      const worldToScreenMatrix = this._camera.worldToScreenMatrix
      const shapes = this.sortedShapes
      let selectedShape = null
      let selectedInfo = null
      for (let i = shapes.length - 1; i >= 0; i -= 1) {
        selectedInfo = this._objects.get(shapes[i])
        if (selectedInfo.selectable && shapes[i].containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)) {
          selectedShape = shapes[i]
          break
        }
      }

      if (selectedShape && !selectedShape.selected) {
        const selectEventObj = selectShape(selectedShape, shapes, this._selectedShapes, this._selectStyle, this._xformStyle, selectedInfo)
        this.fire(EventConstants.SELECTION_CHANGED, selectEventObj)
      }
    }
  }

  _mousemoveCB(event) {
    let incanvas = false
    if (!(incanvas = inCanvas(this._drawCanvas, event.clientX, event.clientY)) && !this._dragInfo) {
      return
    }

    if (this._dragInfo && this._dragInfo.shape) {
      updateCursorPosition(event)
      addEventKeysToSelectedInfo(event, this._dragInfo)
      transformSelectedShape(this._drawCanvas, event, this._dragInfo, this._camera)
      event.stopImmediatePropagation()
      event.preventDefault()
    } else if (!event.buttons && this._selectedShapes.size) {
      Point2d.set(tmpPt1, event.offsetX, event.offsetY)
      Point2d.transformMat2d(tmpPt2, tmpPt1, this._camera.screenToWorldMatrix)
      const worldToScreenMatrix = this._camera.worldToScreenMatrix
      const shapes = this.sortedShapes
      let i = 0
      const flipy = this._camera.isYFlipped()
      for (i = shapes.length - 1; i >= 0; i -= 1) {
        if (shapes[i].selected) {
          const selectInfo = this._objects.get(shapes[i])
          const selectedShape = this._selectedShapes.get(shapes[i])
          let hitInfo = null
          if (selectedShape && (hitInfo = selectedShape.containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)).hit) {
            if (selectedShape instanceof XformShape) {
              const cursor = document.getElementById('cursor')
              this._parent.style.cursor = 'none'
              // forEach not supported on nodelist in IE/Edge
              for (let i = 0; i < this._parent.childNodes.length; i++) {
                this._parent.childNodes[i].style.cursor = 'none'
              }
              if (hitInfo.rotate) {
                let degrees = shapes[i].getRotation()
                if (flipy) {
                  degrees *= -1
                  if (hitInfo.controlIndex === 1) {
                    degrees -= 90
                  } else if (hitInfo.controlIndex === 0) {
                    degrees += 180
                  } else if (hitInfo.controlIndex === 2) {
                    degrees += 90
                  }
                } else {
                  if (hitInfo.controlIndex === 0) {
                    degrees -= 90
                  } else if (hitInfo.controlIndex === 1) {
                    degrees += 180
                  } else if (hitInfo.controlIndex === 3) {
                    degrees += 90
                  }
                }
                appendCustomCursor(event, this._parent, `${rotateSvg.replace(/\<degrees\>/g, `${degrees}`)}`)
              } else if (hitInfo.controlIndex < 4) {
                if (hitInfo.controlIndex === 0 || hitInfo.controlIndex === 3) {
                  appendCustomCursor(event, this._parent, `${scaleSvg.replace(/\<degrees\>/g, `${-shapes[i].getRotation() - 45}`)}`)
                } else if (hitInfo.controlIndex === 1 || hitInfo.controlIndex === 2) {
                  appendCustomCursor(event, this._parent, `${scaleSvg.replace(/\<degrees\>/g, `${-shapes[i].getRotation() + 45}`)}`)
                }
              } else {
                if (hitInfo.controlIndex % 2 === 0) {
                  appendCustomCursor(event, this._parent, `${scaleSvg.replace(/\<degrees\>/g, `${-shapes[i].getRotation()}`)}`)
                } else {
                  appendCustomCursor(event, this._parent, `${scaleSvg.replace(/\<degrees\>/g, `${-shapes[i].getRotation() + 90}`)}`)
                }
              }
            } else if (selectedShape instanceof VertEditableShape) {
              this._parent.style.cursor = 'none'
              // forEach not supported on nodelist in IE/Edge
              for (let i = 0; i < this._parent.childNodes.length; i++) {
                this._parent.childNodes[i].style.cursor = 'none'
              }
              if (hitInfo.controlIndex >= shapes[i].numVerts) {
                appendCustomCursor(event, this._parent, addSvg, -8, -6)
              } else if (event.altKey) {
                appendCustomCursor(event, this._parent, removeSvg, -8, -6)
              } else {
                appendCustomCursor(event, this._parent, repositionSvg, -14, -14)
              }
            }
            event.stopImmediatePropagation()
            event.preventDefault()
            break
          } else if (shapes[i].containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)) {
            if (selectInfo && selectInfo.movable) {
              const cursor = document.getElementById('cursor')
              if (cursor !== null) {
                cursor.parentNode.removeChild(cursor)
              }
              this._parent.style.cursor = "move"
              for (let i = 0; i < this._parent.childNodes.length; i++) {
                this._parent.childNodes[i].style.cursor = 'move'
              }
              event.stopImmediatePropagation()
              event.preventDefault()
            }
            break
          }
        }
      }

      if (i < 0) {
        const cursor = document.getElementById('cursor')
        if (cursor !== null) {
          cursor.parentNode.removeChild(cursor)
        }
        this._parent.style.cursor = "default"
        // forEach not supported on nodelist in IE/Edge
        for (let i = 0; i < this._parent.childNodes.length; i++) {
          this._parent.childNodes[i].style.cursor = 'default'
        }
      }
    }
  }

  _clickCB(event) {
    // noop
  }

  _dblclickCB(event) {
    if (!inCanvas(this._drawCanvas, event.clientX, event.clientY)) {
      return
    }

    Point2d.set(tmpPt1, event.offsetX, event.offsetY)
    Point2d.transformMat2d(tmpPt2, tmpPt1, this._camera.screenToWorldMatrix)
    const worldToScreenMatrix = this._camera.worldToScreenMatrix
    const shapes = this.sortedShapes
    let i = -1
    for (i = shapes.length - 1; i >= 0; i -= 1) {
      const shapeInfo = this._objects.get(shapes[i])
      if (shapeInfo.selectable && shapes[i].containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)) {
        if (shapeInfo.editable && shapes[i] instanceof PolyLine) {
          const selectedShape = shapes[i]
          let doXform = false
          if (shapes[i].selected) {
            const interactiveShape = this._selectedShapes.get(shapes[i])
            if (interactiveShape) {
              selectedShape.restore()
              selectedShape.removeChildXform(interactiveShape)
              doXform = !(interactiveShape instanceof XformShape)
            }
          }

          selectedShape.selected = true
          selectedShape.save()
          const maxZ = shapes[shapes.length - 1].zIndex
          selectedShape.zIndex = maxZ + 1
          BasicStyle.copyBasicStyle(this._selectStyle, selectedShape)
          let newSelectShape = null
          if (doXform) {
            if (shapeInfo.rotatable || shapeInfo.scalable) {
              newSelectShape = new XformShape(this._xformStyle || defaultXformStyle, shapeInfo)
              selectedShape.addChildXform(newSelectShape)
            }
          } else {
            newSelectShape = new VertEditableShape(selectedShape, this._xformStyle)
            selectedShape.addChildXform(newSelectShape)
          }
          this._selectedShapes.set(selectedShape, newSelectShape)
        } else if (!shapes[i].selected) {
          const selectEventObj = selectShape(shapes[i], shapes, this._selectedShapes, this._selectStyle, this._xformStyle, shapeInfo)
          this.fire(EventConstants.SELECTION_CHANGED, selectEventObj)
        }
        break
      }
    }

    if (i < 0 && this._selectedShapes.size) {
      if (this._selectedShapes.size) {
        this.fire(EventConstants.SELECTION_CHANGED, {
          unselectedShapes: getSelectedObjsFromMap(this._selectedShapes),
          selectedShapes: []
        })
      }
      this._dragInfo = null
      clearSelectedShapes(this._selectedShapes)
    } else {
      event.stopImmediatePropagation()
    }
    event.preventDefault()
  }

  _mouseoverCB(event) {
    // noop
  }

  _mouseoutCB(event) {
    // noop
  }

  _init(parent, opts) {
    this._activated = (opts && opts.enableInteractions)
    super._init(parent, opts, this._activated)
    const myevents = Object.getOwnPropertyNames(EventConstants).map(event => {
      return EventConstants[event]
    })
    this.registerEvents(myevents)
    this._dragInfo = null
    this._selectedShapes = new Map()
    this._selectStyle = new BasicStyle((opts && opts.selectStyle ? opts.selectStyle : {
      fillColor: "orange"
    }))

    this._xformStyle = new BasicStyle((opts && opts.xformStyle ? opts.xformStyle : {
      fillColor: "white",
      strokeColor: "black",
      strokeWidth: 2
    }))

    this.timer = 0
  }

  _renderShapes(ctx, drawShapes, camera) {
    const worldToScreenMat = camera.worldToScreenMatrix
    drawShapes.forEach(shape => {
      if (shape.visible) {
        shape.render(ctx, worldToScreenMat, this._styleState)
        // shape.renderBounds(ctx, worldToScreenMat, boundsStrokeStyle)
        if (shape.selected) {
          const interacShape = this._selectedShapes.get(shape)
          if (interacShape) {
            interacShape.render(ctx, worldToScreenMat, this._styleState)
            // interacShape.renderBounds(ctx, worldToScreenMat, boundsStrokeStyle)
          }
        }
      }
    })
  }

  set selectStyle(selectStyle) {
    BasicStyle.copyBasicStyle(selectStyle, this._selectStyle)
  }

  get selectStyle() {
    return this._selectStyle
  }

  get selectedShapes() {
    return getSelectedObjsFromMap(this._selectedShapes)
  }

  selectShape(shape) {
    const shapeInfo = this._objects.get(shape)
    if (shapeInfo && shapeInfo.selectable) {
      const selectEventObj = selectShape(shape, this.sortedShapes, this._selectedShapes, this._selectStyle, this._xformStyle, shapeInfo)
      this.fire(EventConstants.SELECTION_CHANGED, selectEventObj)
    }
  }

  clearSelection() {
    if (this._selectedShapes.size) {
      const selectedShapes = getSelectedObjsFromMap(this._selectedShapes)
      clearSelectedShapes(this._selectedShapes)
      this.fire(EventConstants.SELECTION_CHANGED, {
        unselectedShapes: selectedShapes,
        selectedShapes: []
      })
      this._rerenderCb()
    }
  }

  addShape(shape, opts = null, select = false) {
    let shapes = shape
    if (!Array.isArray(shapes)) {
      shapes = [shape]
    }

    super.addShape(shapes)
    shapes.forEach(shape => {
      const shapeInfo = this._objects.get(shape)
      if (shapeInfo) {
        shapeInfo.selectable = (opts && typeof opts.selectable !== "undefined" ? Boolean(opts.selectable) : true)
        shapeInfo.movable = (opts && typeof opts.movable !== "undefined" ? Boolean(opts.movable) : true)
        shapeInfo.rotatable = (opts && typeof opts.rotatable !== "undefined" ? Boolean(opts.rotatable) : true)
        shapeInfo.scalable = (opts && typeof opts.scalable !== "undefined" ? Boolean(opts.scalable) : true)
        shapeInfo.uniformScaleOnly = (opts && typeof opts.uniformScaleOnly !== "undefined" ? Boolean(opts.uniformScaleOnly) : false)
        shapeInfo.centerScaleOnly = (opts && typeof opts.centerScaleOnly !== "undefined" ? Boolean(opts.centerScaleOnly) : false)
        shapeInfo.editable = (opts && typeof opts.editable !== "undefined" ? Boolean(opts.editable) : true)
      }
    })

    if (select) {
      const selectEventObj = {
        unselectedShapes: getSelectedObjsFromMap(this._selectedShapes)
      }
      const selectedShapes = []
      shapes.forEach(shape => {
        const shapeInfo = this._objects.get(shape)
        if (shapeInfo.selectable) {
          selectShape(shape, this.sortedShapes, this._selectedShapes, this._selectStyle, this._xformStyle, shapeInfo)
          selectedShapes.push(shape)
        }
      })

      if (selectedShapes.length) {
        selectEventObj.selectedShapes = selectedShapes
        this.fire(EventConstants.SELECTION_CHANGED, selectEventObj)
      }
    }

    return this
  }


  deleteShape(shape) {
    let shapes = shape
    if (!Array.isArray(shapes)) {
      shapes = [shape]
    }
    const selectClearedShapes = clearSpecificShapes(this._selectedShapes, shapes)
    this.fire(EventConstants.SELECTION_CHANGED, {
      unselectedShapes: selectClearedShapes,
      selectedShapes: getSelectedObjsFromMap(this._selectedShapes)
    })
    return super.deleteShape(shapes)
  }

  deleteSelectedShapes() {
    const selectedShapes = getSelectedObjsFromMap(this._selectedShapes)
    clearSelectedShapes(this._selectedShapes)
    this.fire(EventConstants.SELECTION_CHANGED, {
      unselectedShapes: selectedShapes,
      selectedShapes: []
    })
    return super.deleteShape(selectedShapes)
  }

  get interactionsEnabled() {
    return this._activated
  }

  enableInteractions() {
    this._enableEvents()
    this._activated = true
    return this
  }

  disableInteractions(clearSelection = true) {
    if (clearSelection) {
      this.clearSelection()
    }
    this._disableEvents()
    this._activated = false
    return this
  }
}

Object.assign(EventConstants, DrawEngine.EventConstants)
ShapeBuilder.EventConstants = EventConstants
