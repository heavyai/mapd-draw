"use strict"

import * as InteractUtils from "../interactions/interact-utils"
import * as Point2d from "../core/point2d"
import BasicStyle from "../style/basic-style"
import DrawEngine from "./draw-engine"
import Mat2d from "../core/mat2d"
import PolyLine from "../shapes/poly-line"
import VertEditableShape from "../interactions/vert-editable-shape"
import XformShape from "../interactions/xform-shape"

const scaleSvg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg transform='rotate(<degrees>,24,24)'%3E%3Cpolygon style='fill:%23ffffff;' points='16,20 16,12 4,24 16,36 16,28 32,28 32,36 44,24 32,12 32,20 '/%3E%3Cpolygon points='14,22 14,17 7,24 14,31 14,26 34,26 34,31 41,24 34,17 34,22 '/%3E%3C/g%3E%3C/svg%3E\") no-repeat"

const rotateSvg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg transform='rotate(<degrees>,24,24)'%3E%3Cpath style='fill:%23ffffff;' d='M25.9,4C16.6,4,8.8,11.2,7.4,20.8H6.7H3.3l1.6,2.9l3.8,7.1l1.8,3.3l1.8-3.3l3.8-7.1l1.6-2.9h-3.3h-0.1 c1.3-5.7,6.1-9.9,11.7-9.9c8,0,12.1,4.4,12.1,13.1c0,7.2-5.4,13.1-12.1,13.1h-2v2V42v2h2c10.4,0,18.8-9,18.8-20 C44.7,11.7,37.5,4,25.9,4L25.9,4z'/%3E%3Cpath d='M25.9,6c10.5,0,16.8,6.7,16.8,18c0,9.9-7.5,18-16.8,18v-2.9c7.8,0,14.1-6.8,14.1-15.1c0-5.6-1.8-15.1-14.1-15.1 c-7.4,0-13.4,6.1-14,13.9h2.4l-3.8,7.1l-3.8-7.1h2.5C9.7,13.4,17,6,25.9,6'/%3E%3C/g%3E%3C/svg%3E\") no-repeat"

const addSvg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpolygon style='fill:%23ffffff;' points='31.2,28 24.8,28 24.8,32.8 20,32.8 20,39.2 24.8,39.2 24.8,44 31.2,44 31.2,39.2 36,39.2 36,32.8 31.2,32.8 '/%3E %3Cpolygon style='fill:%23ffffff' points='12,32 12,4 32.3,24.3 20,24.3 19.7,24.6 '/%3E%3Cpolygon points='13.8,8.2 13.8,27.8 19,22.8 19.2,22.5 28,22.5 '/%3E%3Cpolyline points='29.6,29.6 29.6,34.4 34.4,34.4 34.4,37.6 29.6,37.6 29.6,42.4 26.4,42.4 26.4,37.6 21.6,37.6 21.6,34.4 26.4,34.4 26.4,29.6 29.6,29.6  '/%3E%3C/svg%3E\") no-repeat"

const removeSvg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect style='fill:%23ffffff;' x='20' y='32.8' width='16' height='6.4'/%3E%3Cpolygon  style='fill:%23ffffff;' points='12,32 12,4 32.3,24.3 20,24.3 19.7,24.6 '/%3E%3Cpolygon points='13.8,8.2 13.8,27.8 19,22.8 19.2,22.5 28,22.5 '/%3E%3Cpolyline points='34.4,34.4 34.4,37.6 21.6,37.6 21.6,34.4 '/%3E%3C/svg%3E\") no-repeat"

const repositionSvg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath style='fill:%23ffffff;' d='M24,17.5c-3.6,0-6.5,2.9-6.5,6.5s2.9,6.5,6.5,6.5s6.5-2.9,6.5-6.5S27.6,17.5,24,17.5L24,17.5z'/%3E%3Cpath style='fill:%23ffffff;' d='M24,4L4,24l20,20l20-20L24,4z M31.5,31.5h-15v-15h15V31.5z'/%3E%3Cpolygon points='17,34 24,40.5 31,34  '/%3E%3Cpolygon points='31,14 24,7.5 17,14     '/%3E%3Cpolygon points='14,17 7.5,24 14,31   '/%3E%3Cpolygon points='34,31 40.5,24 34,17    '/%3E%3Cpath d='M24,20c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S21.8,20,24,20'/%3E%3C/svg%3E\") no-repeat"

const EventConstants = {
  SELECTION_CHANGED: "draw:selectionChanged",
  DRAG_BEGIN: "draw:drag:begin",
  DRAG_END: "draw:drag:end"
}

const Constants = {
  SVG_OFFSET: -14,
  QUICK_CLICK_TIME: 500,
  RIGHT_ANGLE: 90,
  STRAIGHT_ANGLE: 180,
  FORTY_FIVE_ANGLE: 45
}

const tmpPt1 = Point2d.create(0, 0)
const tmpPt2 = Point2d.create(0, 0)

const defaultXformStyle = {
  fillColor: "white",
  strokeColor: "black",
  strokeWidth: 2
}

function inCanvas(canvas, x, y) {
  const domrect = canvas.getBoundingClientRect()
  let localX = 0
  let localY = 0
  const isInCanvas = ((localX = x - domrect.left - canvas.clientLeft) >= 0 && localX <= canvas.clientWidth && (localY = y - domrect.top - canvas.clientTop) >= 0 && localY <= canvas.clientHeight)
  return isInCanvas
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

const hideCursor = () => {
  const cursor = document.getElementById("cursor")
  if (cursor !== null) {
    cursor.style.display = "none"
  }
}

const showCursor = () => {
  const cursor = document.getElementById("cursor")
  if (cursor !== null) {
    cursor.style.display = "block"
  }
}

const hideCursorWithPointer = (e) => {
  e.target.parentNode.style.cursor = "default"
  hideCursor()
}

const showCursorWithPointer = (e) => {
  e.target.parentNode.style.cursor = "none"
  showCursor()
}

// understands how to return mouse coordinates as an object in the format {x: <X-COORD>, y: <Y-COORD>}
// accepts a mouse event and a DOM element as arguments
function getMouseCoordinates(e, target) {
  const canvas = document.querySelector(`${`#${target.id} canvas`}`)

  const coords = {
    x: e.offsetX + canvas.offsetLeft,
    y: e.offsetY + canvas.offsetTop
  }

  return coords
}

// understands how to append custom cursors to the DOM
// accepts a mouse event, a DOM element, a cursorStyle, and pixel offsets as arguments
function appendCustomCursor(_event, target, cursorStyle, offsetX = Constants.SVG_OFFSET, offsetY = Constants.SVG_OFFSET) {
  const cursor = document.getElementById("cursor")
  const mouse = getMouseCoordinates(_event, target)

  if (cursor === null) {
    const newCursor = document.createElement("span")
    newCursor.setAttribute("id", "cursor")
    newCursor.setAttribute("style", `position: absolute; top: ${`${mouse.y}px`}; left: ${`${mouse.x}px`}; width: 28px; height: 28px; background: ${cursorStyle}; cursor: none; z-index: 10; pointer-events: none; transform: translate(${offsetX}px, ${offsetY}px)`)
    target.appendChild(newCursor)
  } else if (cursor.style.background === cursorStyle) {
    updateCursorPosition(_event, target)
  } else {
    cursor.style.background = cursorStyle
    updateCursorPosition(_event, target)
  }
}

// understands how to remove the custom cursor from the DOM
function removeCustomCursor() {
  const cursor = document.getElementById("cursor")
  if (cursor !== null) {
    cursor.parentNode.removeChild(cursor)
  }
}

// understands how to change the position of the custom cursor on the page
// accepts a mouse event and a DOM element as arguments
function updateCursorPosition(_event, target) {
  const cursor = document.getElementById("cursor")
  const mouse = getMouseCoordinates(_event, target)

  if (cursor !== null) {
    cursor.style.top = `${`${mouse.y}px`}`
    cursor.style.left = `${`${mouse.x}px`}`
  }
}

export default class ShapeBuilder extends DrawEngine {
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
      const canvas = document.querySelector(`${`#${this._parent.id} > canvas`}`)
      if (canvas === null) {
        this._parent.addEventListener("mouseout", hideCursor)
        this._parent.addEventListener("mouseover", showCursor)
      } else {
        canvas.addEventListener("mouseout", hideCursorWithPointer)
        canvas.addEventListener("mouseover", showCursorWithPointer)
      }
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
      event.preventDefault()
    }
  }

  _mouseupCB(event) {
    if (this._dragInfo && this._dragInfo.shape) {
      event.stopImmediatePropagation()
      event.preventDefault()
      const canvas = document.querySelector(`${`#${this._parent.id} > canvas`}`)
      if (canvas === null) {
        this._parent.removeEventListener("mouseout", hideCursor)
        this._parent.removeEventListener("mouseover", showCursor)
      } else {
        canvas.removeEventListener("mouseout", hideCursorWithPointer)
        canvas.removeEventListener("mouseover", showCursorWithPointer)
      }
      this._dragInfo = null
      this.fire(EventConstants.DRAG_END, {
        shapes: getSelectedObjsFromMap(this._selectedShapes)
      })
    } else if (performance.now() - this.timer < Constants.QUICK_CLICK_TIME) {
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
    if (!(inCanvas(this._drawCanvas, event.clientX, event.clientY)) && !this._dragInfo) {
      return
    }

    if (this._dragInfo && this._dragInfo.shape) {
      updateCursorPosition(event, this._parent)
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
          this._parent.style.cursor = "none"
          // forEach not supported on nodelist in IE/Edge
          for (let j = 0; j < this._parent.childNodes.length; j += 1) {
            this._parent.childNodes[j].style.cursor = "none"
            if (this._parent.childNodes[j].nodeName.toLowerCase() !== "canvas") {
              this._parent.childNodes[j].style.pointerEvents = "none"
            }
          }
          if (selectedShape && (hitInfo = selectedShape.containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)).hit) {
            if (selectedShape instanceof XformShape) {
              if (hitInfo.rotate) {
                let degrees = shapes[i].getRotation()
                if (flipy) {
                  degrees *= -1
                  if (hitInfo.controlIndex === 1) {
                    degrees -= Constants.RIGHT_ANGLE
                  } else if (hitInfo.controlIndex === 0) {
                    degrees += Constants.STRAIGHT_ANGLE
                  } else if (hitInfo.controlIndex === 2) {
                    degrees += Constants.RIGHT_ANGLE
                  }
                } else if (hitInfo.controlIndex === 0) {
                  degrees -= Constants.RIGHT_ANGLE
                } else if (hitInfo.controlIndex === 1) {
                  degrees += Constants.STRAIGHT_ANGLE
                } else if (hitInfo.controlIndex === 3) { // eslint-disable-line no-magic-numbers
                  degrees += Constants.RIGHT_ANGLE
                }
                appendCustomCursor(event, this._parent, `${rotateSvg.replace(/<degrees>/g, `${degrees}`)}`)
              } else if (hitInfo.controlIndex < 4) { // eslint-disable-line no-magic-numbers
                if (hitInfo.controlIndex === 0 || hitInfo.controlIndex === 3) { // eslint-disable-line no-magic-numbers
                  appendCustomCursor(event, this._parent, `${scaleSvg.replace(/<degrees>/g, `${-shapes[i].getRotation() - Constants.FORTY_FIVE_ANGLE}`)}`)
                } else if (hitInfo.controlIndex === 1 || hitInfo.controlIndex === 2) {
                  appendCustomCursor(event, this._parent, `${scaleSvg.replace(/<degrees>/g, `${-shapes[i].getRotation() + Constants.FORTY_FIVE_ANGLE}`)}`)
                }
              } else if (hitInfo.controlIndex % 2 === 0) {
                appendCustomCursor(event, this._parent, `${scaleSvg.replace(/<degrees>/g, `${-shapes[i].getRotation()}`)}`)
              } else {
                appendCustomCursor(event, this._parent, `${scaleSvg.replace(/<degrees>/g, `${-shapes[i].getRotation() + Constants.RIGHT_ANGLE}`)}`)
              }
            } else if (selectedShape instanceof VertEditableShape) {
              this._parent.style.cursor = "none"
              // forEach not supported on nodelist in IE/Edge
              for (let j = 0; j < this._parent.childNodes.length; j += 1) {
                this._parent.childNodes[j].style.cursor = "none"
                if (this._parent.childNodes[j].nodeName.toLowerCase() !== "canvas") {
                  this._parent.childNodes[j].style.pointerEvents = "none"
                }
              }
              if (hitInfo.controlIndex >= shapes[i].numVerts) {
                appendCustomCursor(event, this._parent, addSvg, -8, -6) // eslint-disable-line no-magic-numbers
              } else if (event.altKey) {
                appendCustomCursor(event, this._parent, removeSvg, -8, -6) // eslint-disable-line no-magic-numbers
              } else {
                appendCustomCursor(event, this._parent, repositionSvg, Constants.SVG_OFFSET, Constants.SVG_OFFSET)
              }
            }
            event.stopImmediatePropagation()
            event.preventDefault()
            break
          } else if (shapes[i].containsPoint(tmpPt1, tmpPt2, worldToScreenMatrix, this._drawCtx)) {
            if (selectInfo && selectInfo.movable) {
              const cursor = document.getElementById("cursor")
              if (cursor !== null) {
                cursor.parentNode.removeChild(cursor)
              }
              this._parent.style.cursor = "move"
              for (let j = 0; j < this._parent.childNodes.length; j += 1) {
                this._parent.childNodes[j].style.cursor = "move"
              }
              event.stopImmediatePropagation()
              event.preventDefault()
            }
            break
          }
        }
      }

      if (i < 0) {
        removeCustomCursor()
        this._parent.style.cursor = "default"
        // forEach not supported on nodelist in IE/Edge
        for (let j = 0; j < this._parent.childNodes.length; j += 1) {
          this._parent.childNodes[j].style.cursor = "default"
          if (this._parent.childNodes[j].nodeName.toLowerCase() !== "canvas") {
            this._parent.childNodes[j].style.pointerEvents = "auto"
          }
        }
      }
    }
  }

  _clickCB() {
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

  _mouseoverCB() {
    // noop
  }

  _mouseoutCB() {
    // noop
  }

  _init(parent, opts) {
    this._activated = (opts && opts.enableInteractions)
    super._init(parent, opts, this._activated)
    const myevents = Object.getOwnPropertyNames(EventConstants).map(event => EventConstants[event])
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
    shapes.forEach(newShape => {
      const shapeInfo = this._objects.get(newShape)
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
      shapes.forEach(newShape => {
        const shapeInfo = this._objects.get(newShape)
        if (shapeInfo.selectable) {
          selectShape(newShape, this.sortedShapes, this._selectedShapes, this._selectStyle, this._xformStyle, shapeInfo)
          selectedShapes.push(newShape)
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

    removeCustomCursor()
    this._parent.style.cursor = "default"
    // forEach not supported on nodelist in IE/Edge
    for (let j = 0; j < this._parent.childNodes.length; j += 1) {
      this._parent.childNodes[j].style.cursor = "default"
      this._parent.childNodes[j].style.pointerEvents = "auto"
    }

    return super.deleteShape(shapes)
  }

  deleteSelectedShapes() {
    const selectedShapes = getSelectedObjsFromMap(this._selectedShapes)
    clearSelectedShapes(this._selectedShapes)
    this.fire(EventConstants.SELECTION_CHANGED, {
      unselectedShapes: selectedShapes,
      selectedShapes: []
    })

    removeCustomCursor()
    this._parent.style.cursor = "default"
    // forEach not supported on nodelist in IE/Edge
    for (let j = 0; j < this._parent.childNodes.length; j += 1) {
      this._parent.childNodes[j].style.cursor = "default"
      this._parent.childNodes[j].style.pointerEvents = "auto"
    }

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
