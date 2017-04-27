"use strict"

import * as CanvasUtils from "../util/canvas-utils"
import * as Point2d from "../core/point2d"
import BaseShape from "../shapes/base-shape"
import BasicStyle from "../style/basic-style"
import {
  bindAll
} from "../util/utils"
import Camera2d from "../view/camera2d"
import EventHander from "../util/event-handler"
import ResizeSensor from "css-element-queries/src/ResizeSensor"

const mouseevents = ["mousedown", "mouseup", "mousemove", "click", "dblclick", "mouseover", "mouseout"]
const marginProps = ["top", "bottom", "left", "right"]

export const EventConstants = {
  MOUSEDOWN: "mousedown",
  MOUSEUP: "mouseup",
  MOUSEMOVE: "mousemove",
  CLICK: "click",
  DBLCLICK: "dblclick",
  MOUSEOVER: "mouseover",
  MOUSEOUT: "mouseout",
  SHAPE_ADD: "shape:add",
  SHAPE_DELETE: "shape:delete"
}

class DrawStyleState extends BasicStyle {
  constructor(...args) {
    super(...args)
    this._defaults = {
      packedFillColor: this.packedFillColor,
      packedStrokeColor: this.packedStrokeColor,
      strokeWidth: this.strokeWidth,
      lineJoin: this.lineJoin,
      lineCap: this.lineCap,
      dashPattern: this.dashPattern,
      dashOffset: this.dashOffset
    }
  }

  setFillStyle(ctx, fillStyle) {
    if (fillStyle.packedFillColor !== this.packedFillColor) {
      this.packedFillColor = fillStyle.packedFillColor
      ctx.fillStyle = this.fillColor
    }
  }

  setStrokeStyle(ctx, strokeStyle) {
    if (strokeStyle.packedStrokeColor !== this.packedStrokeColor) {
      this.packedStrokeColor = strokeStyle.packedStrokeColor
      ctx.strokeStyle = this.strokeColor
    }
    if (strokeStyle.strokeWidth !== this._strokeWidth) {
      this.strokeWidth = strokeStyle.strokeWidth
      ctx.lineWidth = this._strokeWidth
    }
    if (strokeStyle.lineJoin !== this._lineJoin) {
      this.lineJoin = strokeStyle.lineJoin
      ctx.lineJoin = this._lineJoin
    }
    if (strokeStyle.lineCap !== this._lineCap) {
      this.lineCap = strokeStyle.lineCap
      ctx.lineCap = this._lineCap
    }

    const dashPattern = strokeStyle._dashPattern
    let diff = false
    if (dashPattern.length === this._dashPattern.length) {
      for (let i = 0; i < dashPattern.length; i += 1) {
        if (dashPattern[i] !== this._dashPattern[i]) {
          diff = true
          break
        }
      }
    } else {
      diff = true
    }

    if (diff) {
      this.dashPattern = dashPattern
      ctx.setLineDash(this._dashPattern)
    }

    if (strokeStyle.dashOffset !== this._dashOffset) {
      this.dashOffset = strokeStyle.dashOffset
      ctx.lineDashOffset = this._dashOffset
    }
  }

  applyDefaults(ctx) {
    Object.getOwnPropertyNames(this._defaults).forEach(prop => {
      this[prop] = this._defaults[prop]
    })
    this.setFillCtx(ctx)
    this.setStrokeCtx(ctx)
  }
}

function addClass(element, className) {
  if (element && (` ${element.className} `).indexOf(` ${className} `) < 0) {
    element.className += (element.className ? " " : "") + className
  }
}

function createCanvas(parent) {
  const canvasContainer = document.createElement("div")
  addClass(canvasContainer, "mapd-draw-canvas-container")

  const canvas = document.createElement("canvas")
  const canvasContext = canvas.getContext("2d")
  const ratio = CanvasUtils.makeCanvasAutoHighDPI(canvasContext)
    // const ratio = 1

  // add class?
  addClass(canvas, "mapd-draw-canvas")
  canvas.style.position = "absolute"
  canvas.style.pointerEvents = "none"

  canvasContainer.appendChild(canvas)

  // canvas.setAttribute("width", ratio * parent.offsetX)
  // canvas.setAttribute("height", ratio * parent.offsetY)
  // parent.insertBefore(canvas, parent.firstChild)
  parent.appendChild(canvasContainer)

  return {
    canvasContainer,
    canvas,
    canvasContext,
    ratio
  }
}


function addShapesToMap(newShapes, existingObjectsMap, currIds, reorderCb, redrawCb) {
  newShapes.forEach(shape => {
    existingObjectsMap.set(shape, {
      shapeObj: shape,
      shapeId: currIds.shapeId,
      shapeIdx: -1
    })
    shape.on(["changed:order", "changed:visibility", "changed:style"], reorderCb)
    shape.on(["changed:geom", "changed:visibility", "changed:xform"], redrawCb)
    currIds.shapeId += 1
  })
}

function deleteShapesFromMap(shapes, existingObjectsMap, reorderCb, redrawCb) {
  const idxs = []
  shapes.forEach(shape => {
    const shapeInfo = existingObjectsMap.get(shape)
    if (shapeInfo) {
      idxs.push(shapeInfo.shapeIdx)
    }
    existingObjectsMap.delete(shape)
    shape.off(["changed"], [reorderCb, redrawCb])
  })
  return idxs
}

export default class DrawEngine extends EventHander {
  constructor(parent, opts) {
    super()
    this._init(parent, opts)
  }

  destroy() {
    this._destroyCanvas()

    if (this._objects) {
      this._objects.forEach((shapeInfo, shape) => {
        shape.off("changed", [this._reorderCb, this._redrawCb])
      })
      this._objects.clear()
      this._sortedObjs = []
      this._reorderedObjIdxs.clear()
    }
  }

  _resize(opts) {
    let width = 0
    if (this._parent.offsetWidth) {
      width = Math.max(width, this._parent.offsetWidth - this._margins.left - this._margins.right)
    }

    let height = 0
    if (this._parent.offsetHeight) {
      height = Math.max(height, this._parent.offsetHeight - this._margins.top - this._margins.bottom)
    }

    this._drawCanvas.width = width * this._pixelRatio
    this._drawCanvas.height = height * this._pixelRatio

    this._drawCanvas.style.left = `${this._margins.left}px`
    this._drawCanvas.style.top = `${this._margins.top}px`
    this._drawCanvas.style.width = `${width}px`
    this._drawCanvas.style.height = `${height}px`

    if (this._camera) {
      // const currViewport = this._camera.viewport
      // const currSpace = this._camera.projectionBounds
      // const viewportExtents = [0, 0]
      // AABox2d.getExtents(viewportExtents, currViewport)
      // const spaceCenter = [0, 0]
      // const spaceExtents = [0, 0]
      // AABox2d.getCenter(spaceCenter, currSpace)
      // AABox2d.getExtents(spaceExtents, currSpace)
      // const ratio = spaceExtents
      // Vec2d.div(ratio, spaceExtents, viewportExtents)
      // AABox2d.set(currViewport, 0, 0, width, height)
      // AABox2d.getExtents(viewportExtents, currViewport)
      // Vec2d.multiply(spaceExtents, ratio, viewportExtents)
      // AABox2d.initCenterExtents(currSpace, spaceCenter, spaceExtents)
      // this._camera.viewport = currViewport
      // this._camera.projectionBounds = currSpace
      //   // this._camera.viewport = [0, 0, width, height]
      //   // this._camera.projectionBounds = [0, 0, width, height]
    } else {
      const projDims = (opts && opts.projectionDimensions ? opts.projectionDimensions : [width, height])
      this._camera = new Camera2d([0, 0, width, height], projDims, (opts.flipY ? Boolean(opts.flipY) : false))
      this._camera.setPosition((opts && opts.cameraPosition ? opts.cameraPosition : [width / 2.0, height / 2.0]))
      this._camera.on("changed", this._rerenderCb)
    }
    // this._camera = new Camera2d([0, 0, this.width, this.height], [0, 0, this.width, this.height])
    // this._camera.on("changed", this._rerenderCb)

    this._rerenderCb()
  }

  _mousedownCB(event) {
    if (event.target !== this._parent) {
      return
    }

    this.fire("mousedown", {
      originalEvent: event
    })
  }

  _mouseupCB(event) {
    if (event.target !== this._parent) {
      return
    }

    this.fire("mouseup", {
      originalEvent: event
    })
  }

  _mousemoveCB(event) {
    if (event.target !== this._parent) {
      return
    }

    this.fire("mousemove", {
      originalEvent: event
    })
  }

  _clickCB(event) {
    if (event.target !== this._parent) {
      return
    }

    this.fire("click", {
      originalEvent: event
    })
  }

  _dblclickCB(event) {
    if (event.target !== this._parent) {
      return
    }

    this.fire("dblclick", {
      originalEvent: event
    })
  }

  _mouseoverCB(event) {
    if (event.target !== this._parent) {
      return
    }

    this.fire("mouseover", {
      originalEvent: event
    })
  }

  _mouseoutCB(event) {
    if (event.target !== this._parent) {
      return
    }

    this.fire("mouseout", {
      originalEvent: event
    })
  }

  _enableEvents() {
    this.registerEvents(mouseevents)
    const callbacks = mouseevents.map(event => `_${event}CB`)
    // bindAll(callbacks, this)
    for (let i = 0; i < mouseevents.length; i += 1) {
      document.addEventListener(mouseevents[i], this[callbacks[i]], true)
    }
  }

  _disableEvents() {
    const callbacks = mouseevents.map(event => `_${event}CB`)
    for (let i = 0; i < mouseevents.length; i += 1) {
      document.removeEventListener(mouseevents[i], this[callbacks[i]], true)
    }
  }

  _initCanvas(parent, opts, forceEvents = null) {
    this._margins = (opts && opts.margins ? Object.assign({}, opts.margins) : {})
    marginProps.forEach(prop => {
      if (typeof this._margins[prop] !== "number") {
        this._margins[prop] = 0
      }
    })

    const {
      canvasContainer,
      canvas,
      canvasContext,
      ratio
    } = createCanvas(parent)

    this._container = canvasContainer
    this._drawCanvas = canvas
    this._drawCtx = canvasContext
    this._pixelRatio = ratio
    this._parent = parent

    bindAll(["_resize"], this)
    this._resize(opts)
    this._resizeSensor = new ResizeSensor(parent, this._resize)

    if (forceEvents || (forceEvents === null && opts && opts.enableEvents)) {
      this._enableEvents()
    }
  }

  _destroyCanvas() {
    if (this._drawCanvas) {
      this._disableEvents()
    }

    if (this._parent) {
      this._parent.removeChild(this._drawCanvas)

      if (this._resizeSensor) {
        this._resizeSensor.detach(this._parent, this._resize)
      }
    }

    this._drawCanvas = null
    this._drawCtx = null
    this._parent = null
  }

  _init(parent, opts, forceEvents = null) {
    this.registerEvents([EventConstants.SHAPE_ADD, EventConstants.SHAPE_DELETE])

    bindAll(["_reorderCb", "_rerenderCb"], this)
    bindAll(["_mousedownCB", "_mouseupCB", "_mousemoveCB", "_clickCB", "_dblclickCB", "_mouseoverCB", "_mouseoutCB"], this)

    this._renderFrameCb = this.renderAll.bind(this)
    this._renderRequestId = 0
    this._ids = {
      shapeId: 1
    }

    this._objects = new Map()
    this._sortedObjs = []
    this._reorderedObjIdxs = new Set()

    this._initCanvas(parent, opts, forceEvents)

    this._styleState = new DrawStyleState({
      fillColor: "red"
    })
  }

  getContainer() {
    return this._parent
  }

  getCanvasContainer() {
    return this._container
  }

  getCanvas() {
    return this._drawCanvas
  }

  get sortedShapes() {
    if (this._reorderedObjIdxs.size) {
      console.assert(this._sortedObjs.length === this._objects.size,
        `Size mismatch when rendering objets. Something got out of sync - sorted objs length: ${this._sortedObjs.length}, objects length: ${this._objects.size}`)

      // if (this._reorderedObjIdxs.length / this._sortedObjs.length > 0.7) {
      //   // might as well just resort the whole thing over
      //   this._sortedObjs.sort(shapeInfoCompare)
      // } else {
      // }

      this._sortedObjs.sort(BaseShape.shapeCompare)
      this._reorderedObjIdxs.clear()
    }
    return this._sortedObjs
  }

  get margins() {
    const rtn = {}
    marginProps.forEach(prop => {
      rtn[prop] = this._margins[prop]
    })
    return rtn
  }

  set margins(margins) {
    marginProps.forEach(prop => {
      if (typeof margins[prop] === "number" && margins[prop] !== this._margins[prop]) {
        this._margins[prop] = margins.prop
      }
    })

    this._resize()
  }

  get viewport() {
    return this._camera.viewport
  }

  set viewport(viewport) {
    this._camera.viewport = viewport
  }

  get projectionDimensions() {
    return this._camera.projectionDimensions
  }

  set projectionDimensions(projectionDimensions) {
    this._camera.projectionDimensions = projectionDimensions
    return this
  }

  get cameraPosition() {
    return this._camera.getPosition()
  }

  set cameraPosition(pos) {
    this._camera.setPosition(pos)
    return this
  }

  project(out, screenPt) {
    const screenToWorldMatrix = this._camera.screenToWorldMatrix
    return Point2d.transformMat2d(out, screenPt, screenToWorldMatrix)
  }

  unproject(out, worldPt) {
    const worldToScreenMatrix = this._camera.worldToScreenMatrix
    return Point2d.transformMat2d(out, worldPt, worldToScreenMatrix)
  }

  hasShape(shape) {
    return this._objects.has(shape)
  }

  addShape(shape) {
    let shapes = shape
    if (!Array.isArray(shapes)) {
      shapes = [shape]
    }

    addShapesToMap(shapes, this._objects, this._ids, this._reorderCb, this._rerenderCb)

    // fire add event
    this.fire("shape:add", {
      shape: shapes
    })

    const proxyEvent = {
      target: shapes
    }
    this._reorderCb(proxyEvent)

    return this
  }

  deleteShape(shape) {
    let shapes = shape
    if (!Array.isArray(shapes)) {
      shapes = [shape]
    }

    const idxs = deleteShapesFromMap(shapes, this._objects, this._reorderCb, this._rerenderCb)
    let index = -1
    for (let i = 0; i < shapes.length; i += 1) {
      if ((index = this._sortedObjs.indexOf(shapes[i])) >= 0) {
        this._sortedObjs.splice(index, 1)
      }
      this._reorderedObjIdxs.add(idxs[i])
    }
    this._rerenderCb()

    this.fire("shape:delete", {
      shape: shapes
    })

    return this
  }

  deleteAllShapes() {
    this.deleteShape(this.sortedShapes.slice())
    return this
  }

  moveShapeToTop(shape) {
    if (this._objects.has(shape)) {
      const shapes = this.sortedShapes
      const zindex = shapes[shapes.length - 1].zIndex
      shape.zIndex = zindex + 1
    }
  }

  moveShapeToBack(shape) {
    if (this._objects.has(shape)) {
      const shapes = this.sortedShapes
      const zindex = shapes[0].zIndex
      shape.zIndex = zindex
    }
  }

  getShapesAsJSON() {
    const shapes = this.sortedShapes
    return shapes.map(shape => shape.toJSON())
  }

  _rerenderCb() {
    if (this._renderRequestId) {
      window.cancelAnimationFrame(this._renderRequestId)
    }
    this._renderRequestId = window.requestAnimationFrame(this._renderFrameCb)
  }

  _reorderCb(event) {
    let changedShapes = event.target
    if (!Array.isArray(changedShapes)) {
      changedShapes = [event.target]
    }
    changedShapes.forEach(changedShape => {
      console.assert(changedShape, "A changed event doesn't have an object")
      const shapeInfo = this._objects.get(changedShape)
      console.assert(shapeInfo, `A changed event target isn't in the list of shapes ${changedShape}`)
      if (shapeInfo.shapeIdx < 0) {
        shapeInfo.shapeIdx = this._sortedObjs.push(changedShape) - 1
      }
      this._reorderedObjIdxs.add(shapeInfo.shapeIdx)
    })
    this._rerenderCb()
  }

  _renderShapes(ctx, drawShapes, camera) {
    const worldToScreenMat = camera.worldToScreenMatrix
    drawShapes.forEach(shape => {
      if (shape.visible) {
        shape.render(ctx, worldToScreenMat, this._styleState)
      }
    })
  }

  renderAll() {
    const ctx = this._drawCtx
      // ctx.clearRect(0, 0, this.width, this.height)
    ctx.clearRect(0, 0, this._drawCanvas.offsetWidth, this._drawCanvas.offsetHeight)

    if (!this._objects.size) {
      return
    }

    ctx.save()
    const drawShapes = this.sortedShapes
    this._styleState.applyDefaults(ctx)
    this._renderShapes(ctx, drawShapes, this._camera)
    ctx.restore()
  }
}

DrawEngine.EventConstants = EventConstants
