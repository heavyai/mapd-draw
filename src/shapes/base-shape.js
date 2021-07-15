"use strict"

import * as AABox2d from "../core/aabox2d"
import * as Point2d from "../core/point2d"
import Vec2d from "../core/vec2d"
import Mat2d from "../core/mat2d"
import FillStyle, { createEventedFillStyleMixin } from "../style/fill-style"
import StrokeStyle, {
  createEventedStrokeStyleMixin
} from "../style/stroke-style"
import Transform2d, { createEventedTransform2dMixin } from "./transform2d"
import aggregation from "../util/aggregation"
import BasicStyle from "../style/basic-style"
import EventHandler from "../util/event-handler"

/**
 * @typedef {object} CoreShapeOptions
 * @property {number} [zIndex=0] Z index draw order of the shape. Lower numbers get drawn before larger numbers
 */

/**
 * Shape geom modification event
 * @event Shape#geomChanged
 * @type {object}
 * @property {string} attr Name of the attribute modified
 * @property {} prevVal Previous value of the attribute prior to modification
 * @property {} currVal Value of the attribute post modification
 */

/**
 * Shape modification event
 * @event EventedShape#changed
 * @type {object}
 * @property {string} attr Name of the attribute modified
 * @property {} prevVal Previous value of the attribute prior to modification
 * @property {} currVal Value of the attribute post modification
 */

/**
 * @class Defines the core functionality for all shapes
 * @extends {EventHandler}
 */
class CoreBaseShape extends EventHandler {
  /**
   * Creates new core functionality for a shape
   * @param  {CoreShapeOptions} [opts]
   * @return {CoreBaseShape}
   */
  constructor(opts) {
    super([
      "changed:xform",
      "changed:style",
      "changed:order",
      "changed:visibility",
      "changed:geom"
    ])
    this._aabox = AABox2d.create()
    this._zIndex = opts && opts.zIndex ? opts.zIndex : 0
    this._visible = true
    this._geomDirty = false

    this._fullXform = Mat2d.create()
  }

  /**
   * Sets the z index (back to front draw order) of the shape
   * @param  {number} zIndex
   * @fires  EventedShape#changed
   * @return {CoreBaseShape}        this
   */
  set zIndex(zIndex) {
    if (!Number.isInteger(zIndex)) {
      throw new Error("zIndex must be an integer")
    }
    if (zIndex !== this._zIndex) {
      const prev = this._zIndex
      this._zIndex = zIndex
      this.fire("changed:order", {
        attr: "zIndex",
        prevVal: prev,
        currVal: this._zIndex
      })
    }
    return this
  }

  /**
   * Gets the current z index (i.e. draw/layer order) of the shape
   * @return {number}
   */
  get zIndex() {
    return this._zIndex
  }

  /**
   * Gets a reference to the current axis-aligned bounding box of the
   * shape
   * @return {AABox2d}
   * @readOnly
   */
  get aabox() {
    this._updateAABox()
    return this._aabox
  }

  /**
   * Sets the visibility of the shape
   * @param  {Boolean} visible If true, the shape is considered visible
   * @fires  EventedShape#changed
   * @return {CoreBaseShape}         this
   * @throws {Error} If argument is not a boolean type
   */
  set visible(visible) {
    if (typeof visible !== "boolean") {
      throw new Error("visible must be a boolean")
    }

    if (visible !== this._visible) {
      this._visible = visible
      this.fire("changed:visibility", {
        attr: "visible",
        prevVal: !this._visible,
        currVal: this._visible
      })
    }

    return this
  }

  /**
   * Gets the current visibility of the shape
   * @return {boolean}
   */
  get visible() {
    return this._visible
  }
}

/**
 * @class Defines the basic functionality of all shapes. This includes
 *        mixing in from EventedTransform2d so that affine transformations
 *        can be applied to the shape. Also includes mixing in fill and stroke
 *        properties so that the shape's renderable properties can be modified.
 * @extends {CoreBaseShape}
 * @mixin {EventedTransform2d}
 * @mixin {EventedFillStyle}
 * @mixin {EventedStrokeStyle}
 */
export default class BaseShape extends aggregation(
  CoreBaseShape,
  createEventedTransform2dMixin("changed:xform"),
  createEventedFillStyleMixin("changed:style"),
  createEventedStrokeStyleMixin("changed:style")
) {
  /**
   * Creates new basic functionality (including transform, fill style, and stroke style properties)
   * for a shape
   * @param  {object} opts
   * @return {BaseShape}
   */
  constructor(opts) {
    super(opts)
    this._stateStack = []

    // if true, the render loop will call the _drawDebug method, if it exists
    // This can be used to active debug draw rendering for extra visual markers
    // useful in debugging the drawn shape.
    const { debug } = opts
    this._doDebugDraw =
      typeof debug === "boolean" &&
      debug &&
      typeof this._drawDebug === "function"
  }

  /**
   * Saves the current state of the shape so that it can be restored later.
   * @return {BaseShape} this
   */
  save() {
    // Currently only the state of the fill/stroke style properties
    // and the z index are saved. May want to expand this to include
    // all modifiable properties (i.e. transform props and visibility prop)
    const state = new BasicStyle()
    BasicStyle.copyBasicStyle(this, state)
    state.zIndex = this.zIndex
    this._stateStack.push(state)
    return this
  }

  /**
   * Pops a saved state from the top of the saved state stack
   * @return {BaseShape} this
   */
  restore() {
    // Currently only restores the state of the fill/stroke style properties
    // and the z index. May want to expand this to include
    // all modifiable properties (i.e. transform props and visibility prop)
    const state = this._stateStack.pop()
    if (state) {
      BasicStyle.copyBasicStyle(state, this)
      this.zIndex = state.zIndex
    }
    return this
  }

  /**
   * Gets the visibility of the shape
   * @return {boolean}
   * @override
   */
  get visible() {
    return this._visible && (this.isFillVisible() || this.isStrokeVisible())
  }

  /**
   * Gets the width/height of the shape after the parent transforms are applied
   * @return {Vec2d} Width/Height of the shape after all parent transforms applied
   */
  getGlobalDimensions() {
    const scale = Vec2d.create()
    Mat2d.svd(null, scale, null, this.globalXform)
    scale[0] *= this.width
    scale[1] *= this.height
    return scale
  }

  /**
   * Returns true the shape contains a screen/world space point
   * @param  {Point2d} screenPt           The point to check in screen/pixel space
   * @param  {Poitn2d} worldPt            The point to check in world space
   * @param  {Mat2d} worldToScreenMatrix  The transform matrix from world to screen space
   * @param  {CanvasRenderingContext2D} ctx The 2d rendering context
   * @return {boolean}                    True if the shape contains the point, false otherwise
   */
  containsPoint(screenPt, worldPt, worldToScreenMatrix, ctx) {
    // Should we update here, or is it safe to
    // say that this is stateful, meaning a render
    // should have been performed beforehand which
    // would've updated its state
    let rtn = false
    const aabox = this.aabox

    // Check if the point is contained by the shape's bounds first
    if (this.visible && AABox2d.containsPt(aabox, worldPt)) {
      // re-draw the shape (invisible) so that we can use canvas's
      // isPointInPath/isPointInStroke api calls. Doing that
      // as this should be compatible across all browsers
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.beginPath()
      this._draw(ctx)
      ctx.strokeStyle = "rgba(0,0,0,0)"
      ctx.lineWidth = this.strokeWidth + 5 // eslint-disable-line no-magic-numbers
      ctx.dashPattern = []
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.stroke()
      if (
        (this.isFillVisible() && ctx.isPointInPath(screenPt[0], screenPt[1])) ||
        (this.isStrokeVisible() &&
          ctx.isPointInStroke(screenPt[0], screenPt[1]))
      ) {
        rtn = true
      }
      ctx.restore()
    }
    return rtn
  }

  /**
   * Debug function to draw the bounds of the shape
   * @param  {CanvasRenderingContext2D} ctx                 2d rendering context
   * @param  {Mat2d} worldToScreenMatrix Transform from world to screen space
   * @param  {StrokeStyle} boundsStrokeStyle   The stroke style to use to render the bounds
   */
  renderBounds(ctx, worldToScreenMatrix, boundsStrokeStyle) {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    boundsStrokeStyle.setStrokeCtx(ctx)
    const corner_point = Point2d.create()
    const center = Point2d.create()
    const extents = Point2d.create()
    const aabox = this.aabox
    AABox2d.getCenter(center, aabox)
    AABox2d.getExtents(extents, aabox)

    ctx.beginPath()

    Point2d.set(corner_point, center[0] - extents[0], center[1] - extents[1])
    Point2d.transformMat2d(corner_point, corner_point, worldToScreenMatrix)
    ctx.moveTo(corner_point[0], corner_point[1])

    Point2d.set(corner_point, center[0] + extents[0], center[1] - extents[1])
    Point2d.transformMat2d(corner_point, corner_point, worldToScreenMatrix)
    ctx.lineTo(corner_point[0], corner_point[1])

    Point2d.set(corner_point, center[0] + extents[0], center[1] + extents[1])
    Point2d.transformMat2d(corner_point, corner_point, worldToScreenMatrix)
    ctx.lineTo(corner_point[0], corner_point[1])

    Point2d.set(corner_point, center[0] - extents[0], center[1] + extents[1])
    Point2d.transformMat2d(corner_point, corner_point, worldToScreenMatrix)
    ctx.lineTo(corner_point[0], corner_point[1])

    ctx.closePath()

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.stroke()
    ctx.restore()
  }

  /**
   * Called when the local transform (does not include parent transforms) of the Transform2d
   * mixin is modified. Used to be notified internally that the shape's bounds needs updating
   * @private
   */
  _localXformUpdated() {
    this._boundsOutOfDate = true
  }

  /**
   * Called when the global transform (includes parent transforms) of the Transform2d
   * mixin is modified. Used to be notified internally that the shape's bounds needs updating
   * @private
   */
  _globalXformUpdated() {
    this._boundsOutOfDate = true
  }

  /**
   * Renders the shape using a 2d rendering context
   * @param  {CanvasRenderingContext2d} ctx                 2d rendering context
   * @param  {Mat2d} worldToScreenMatrix Transform from world to screen space,
   *                                     usually provided by a camera
   * @param  {DrawStyleState} styleState Manages the current state of the fill/stroke style attrs
   *                                     of the 2d rendering context. This is self-managed to minimize
   *                                     context state switches
   * @param  {boolean} [doFill=null]     If provided, used to manually override whether to fill the
   *                                     shape.
   * @param  {boolean} [doStroke=null]   If provided, used to manually override whether to stroke the
   *                                     shape.
   */
  render(ctx, worldToScreenMatrix, styleState, doFill = null, doStroke = null) {
    Mat2d.multiply(this._fullXform, worldToScreenMatrix, this.globalXform)

    ctx.beginPath()

    const rtn = this._draw(ctx)
    if (rtn || typeof rtn === "undefined") {
      if (this.isFillVisible() && (doFill === null || Boolean(doFill))) {
        styleState.setFillStyle(ctx, this)
        ctx.fill()
      }

      if (this.isStrokeVisible() && (doStroke === null || Boolean(doStroke))) {
        styleState.setStrokeStyle(ctx, this)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.stroke()
      }

      if (this._doDebugDraw) {
        this._drawDebug(ctx)
      }
    }
  }

  /**
   * Copies the fill/stroke style from one BasicStyle object to this shape
   * @param {BasicStyle} newStyle The style to copy from.
   * @return {BaseShape} this
   */
  setStyle(newStyle) {
    BasicStyle.copyBasicStyle(newStyle, this)
    return this
  }

  /**
   * Returns a JSON object containing the properties of this shape
   * @return {object}
   */
  toJSON() {
    let state = this // eslint-disable-line consistent-this
    if (this._stateStack && this._stateStack.length) {
      state = this._stateStack[0]
    }
    return Object.assign(
      {
        // type: this.constructor.name,
        // NOTE: I wanted to use the above call, which would keep the type
        // consistent with the name of the class, but this isn't always
        // the case, as was found out a few times when trying to add
        // this to immerse
        visible: this.visible,
        zIndex: state.zIndex
      },
      BasicStyle.toJSON(state),
      Transform2d.toJSON(this)
    )
  }

  /**
   * Compares two shapes, usually used to sort the shapes for drawing
   * @param  {BaseShape} shape1
   * @param  {BaseShape} shape2
   * @return {number}        Returns < 0 if shape1 < shape2, > 0 if shape1 > shape2, 0 if shape1 === shape2
   */
  static shapeCompare(shape1, shape2) {
    const zIndex1 = shape1.zIndex
    const zIndex2 = shape2.zIndex
    if (zIndex1 < zIndex2) {
      return -1
    } else if (zIndex1 > zIndex2) {
      return 1
    }

    let rtn = FillStyle.compareFillStyle(shape1, shape2)
    if (!rtn) {
      rtn = StrokeStyle.compareStrokeStyle(shape1, shape2)
    }

    return rtn
  }
}
