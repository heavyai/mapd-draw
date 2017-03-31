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

const scaleSvg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 30 30\" x=\"0px\" y=\"0px\" width=\"30px\" height=\"30px\"><style type=\"text/css\">.st0{fill:white;stroke:#333;stroke-width:1.5;stroke-linejoin:round;}</style><polygon class=\"st0\" transform=\"rotate(<degrees>,15,15)\" points=\"19,17 19,21 26,15 19,9 19,13 11,13 11,9 4,15 11,21 11,17 19,17\"/></svg>') 15 15"

const rotateSvg = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20px\" height=\"20px\" viewBox=\"0 0 30 30\"> <path transform=\"rotate(<degrees>,15,15)\" d=\"M15.9965,1.1841a13.8158,13.8158,0,1,1,.0105,27.6315,1.011,1.011,0,1,1-.0286-2.0218q.0143,0,.0286,0A11.794,11.794,0,1,0,5.0134,10.6192l2.0745-1.211a1.011,1.011,0,1,1,1.0109,1.748L4.0551,13.5151a1.011,1.011,0,0,1-1.382-.3667c-.0064-.011-2.3774-4.414-2.3774-4.414A.9693.9693,0,0,1,1.54,7.3689a.9793.9793,0,0,1,.5456.4071L3.1706,9.7873A13.8542,13.8542,0,0,1,15.9965,1.1841Z\"/></svg>') 10 10"

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
                this._parent.style.cursor = `${rotateSvg.replace("<degrees>", `${degrees}`)}, alias`
              } else if (hitInfo.controlIndex < 4) {
                if (hitInfo.controlIndex === 0) {
                  this._parent.style.cursor = `${scaleSvg.replace("<degrees>", `${-shapes[i].getRotation() - 45}`)}, sw-resize`
                } else if (hitInfo.controlIndex === 1) {
                  this._parent.style.cursor = `${scaleSvg.replace("<degrees>", `${-shapes[i].getRotation() + 45}`)}, nw-resize`
                } else if (hitInfo.controlIndex === 2) {
                  this._parent.style.cursor = `${scaleSvg.replace("<degrees>", `${-shapes[i].getRotation() + 45}`)}, se-resize`
                } else if (hitInfo.controlIndex === 3) {
                  this._parent.style.cursor = `${scaleSvg.replace("<degrees>", `${-shapes[i].getRotation() - 45}`)}, ne-resize`
                }
              } else {
                if (hitInfo.controlIndex % 2 === 0) {
                  this._parent.style.cursor = `${scaleSvg.replace("<degrees>", `${-shapes[i].getRotation()}`)}, ew-resize`
                } else {
                  this._parent.style.cursor = `${scaleSvg.replace("<degrees>", `${-shapes[i].getRotation() + 90}`)}, ns-resize`
                }
              }
            } else if (selectedShape instanceof VertEditableShape) {
              if (hitInfo.controlIndex >= shapes[i].numVerts) {
                this._parent.style.cursor = "copy"
              } else if (event.altKey) {
                this._parent.style.cursor = "not-allowed"
              } else {
                this._parent.style.cursor = "all-scroll"
              }
            }
            event.stopImmediatePropagation()
            event.preventDefault()
            break
          } else if (shapes[i].containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)) {
            if (selectInfo && selectInfo.movable) {
              this._parent.style.cursor = "move"
              event.stopImmediatePropagation()
              event.preventDefault()
            }
            break
          }
        }
      }

      if (i < 0) {
        this._parent.style.cursor = "default"
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
