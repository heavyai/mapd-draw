"use strict"

import * as AABox2d from "../core/aabox2d"
import aggregation from "../util/aggregation"
import {createEventedTransform2dMixin} from "../shapes/transform2d"
import EventHandler from "../util/event-handler"
import Mat2d from "../core/mat2d"
import {vec2 as Vec2d} from "gl-matrix"

/**
 * Camera modification event
 * @event EventedCamera#changed
 * @type {object}
 * @property {string} attr Name of the attribute modified
 * @property {} prevVal Previous value of the attribute prior to modification
 * @property {} currVal Value of the attribute post modification
 */

/**
 * @class Base camera class for 2d screen projections
 *        The base class is used only for the NDC to screen space trasform
 * @extends {EventHandler}
 */
class BaseCamera2d extends EventHandler {
  /**
   * Constructs a new 2d camera
   * @param  {AABox2d}  viewport           Initial camera viewport boundary, in pixels
   * @param  {Vec2d}  projectionDimensions The width and height of the viewport in world coordinates
   * @param  {Boolean} [flipY=false]       Whether world y coordinates are flipped, if false
   *                                       the top of the viewport window is smaller in y, and the bottom
   *                                       is larger. If true, the bottom has smaller y coords, and the top
   *                                       larger
   * @return {BaseCamera2d}
   */
  constructor(viewport, projectionDimensions, flipY = false) {
    // initialize modify events
    super(["changed", "changed:xform"])

    this._viewport = AABox2d.clone(viewport)
    this._projectionDimensions = Vec2d.clone(projectionDimensions)
    this._yflip = flipY

    // stores the NDC space to screen space matrix
    // NDC (normalized device coordinates) is the space
    // where the left edge of the window is -1, the right edge is 1
    // the top edge is -1, and the bottom edge is 1.
    this._screenMatrix = Mat2d.create()

    // this flag is dirty whenever the attributes for the
    // ndc-to-screen projection are modified
    this._screenDirty = true
  }

  /**
   * Returns true if the world Y coordinates go from negative to positive
   * in a bottom to top fashion in screen space, false otherwise.
   * @return {Boolean}
   */
  isYFlipped() {
    return this._yflip
  }

  /**
   * Sets the camera's screen-space viewport bounds
   * @param  {AABox2d} viewport
   * @fires  EventedCamera#changed
   * @return {BaseCamera2d}
   */
  set viewport(viewport) {
    if (!AABox2d.equals(viewport, this._viewport)) {
      const prev = AABox2d.clone(this._viewport)
      AABox2d.copy(this._viewport, viewport)
      this._screenDirty = true
      this._worldToScreenOutdated = true
      this.fire("changed", {
        attr: "viewport",
        prevVal: prev,
        currVal: viewport
      })
    }
    return this
  }

  /**
   * Gets a copy of the camera's current viewport
   * @return {AABox2d}
   */
  get viewport() {
    return AABox2d.clone(this._viewport)
  }

  /**
   * Gets a reference to the camera's current viewport
   * @return {AABox2d}
   * @readOnly
   */
  get viewportRef() {
    return this._viewport
  }

  /**
   * Gets the current NDC to screen space transform matrix
   * @return {Mat2d}
   */
  get screenMatrix() {
    if (this._screenDirty) {
      const center = [0, 0]
      const extents = [0, 0]
      AABox2d.getCenter(center, this._viewport)
      AABox2d.getExtents(extents, this._viewport)
      Mat2d.set(this._screenMatrix, extents[0], 0, 0, extents[1], center[0], center[1])
      this._worldToScreenOutdated = true
      this._screenDirty = false
    }
    return this._screenMatrix
  }
}

/**
 * @class Main 2d camera class to manage othographic 2d projections
 * @extends {BaseCamera2d}
 * @mixin {EventedTransform2d}
 */
export default class Camera2d extends aggregation(BaseCamera2d,
  createEventedTransform2dMixin("changed:xform")) {

  /**
   * Creates a new Camera2d object
   * @param  {AABox2d} viewport             The camera's viewport bounds in pixel space
   * @param  {Vec2d} projectionDimensions The width/height of the camera's viewport in world coordinates
   * @param  {Boolean} flipY              True if the direction from negative to positive Y coordinates
   *                                      go from the bottom to top of the window. False means Y coords
   *                                      from negative to positive values go from the top to the bottom
   * @return {Camera2d}
   */
  constructor(viewport, projectionDimensions, flipY) {
    super(viewport, projectionDimensions, flipY)

    this._viewMatrix = Mat2d.create()
    this._viewDirty = true
    this._projMatrix = Mat2d.create()
    this._projDirty = true
  }

  /**
   * Sets the projection dimensions of the camera's view. This is the width/height
   * in world space coordiantes of the camera's view.
   * @param  {Vec2d} projectionDimensions
   * @return {Camera2d} this
   */
  set projectionDimensions(projectionDimensions) {
    if (!Vec2d.equals(projectionDimensions, this._projectionDimensions)) {
      const prev = Vec2d.clone(this._projectionDimensions)
      AABox2d.copy(this._projectionDimensions, projectionDimensions)
      this._viewDirty = true
      this._projDirty = true
        // this._yflip = this._projectionDimensions[3] < this._projectionDimensions[1]
      this.fire("changed", {
        attr: "projectionDimensions",
        prevVal: prev,
        currVal: projectionDimensions
      })
    }
    return this
  }

  /**
   * Gets a copy of the camera's current projection dimensions
   * @return {Vec2d}
   */
  get projectionDimensions() {
    return Vec2d.clone(this._projectionDimensions)
  }

  /**
   * Gets a reference to the camera's current projection dimensions
   * @return {Vec2d}
   * @readOnly
   */
  get projectionDimensionsRef() {
    return this._projectionDimensions
  }

  /**
   * Called when the local transform (does not include parent transforms) of the Transform2d
   * mixin is modified. Used to be notified internally that the view-to-screen space
   * transformation needs updating
   * @private
   */
  _localXformUpdated() {
    this._boundsOutOfDate = true
  }

  /**
   * Called when the global matrix (includes parent transforms) of the
   * Transform2d mixin is modified. Used to be notified internally that
   * the view-to-screen space transformation needs updating
   * @private
   */
  _globalXformUpdated() {
    this._boundsOutOfDate = true
  }

  /**
   * Gets the transformation matrix from world space to view/camera space
   * @return {Mat2d}
   */
  get viewMatrix() {
    if (this._viewDirty || this._boundsOutOfDate || this._xformDirty || this._lxformDirty) {
      // the matrix has been marked dirty, so recalculate
      const pos = [0, 0]
      const scale = [0, 0]
      const rot = [0, 0]
      const xform = this.globalXform
      Mat2d.svd(pos, scale, rot, xform)
      Mat2d.fromTranslation(this._viewMatrix, Vec2d.negate(pos, pos))
      Mat2d.rotate(this._viewMatrix, this._viewMatrix, -rot[0])
      Mat2d.scale(this._viewMatrix, this._viewMatrix, scale)
      Mat2d.rotate(this._viewMatrix, this._viewMatrix, -rot[1])
      this._worldToScreenOutdated = true
      this._viewDirty = false
    }
    return this._viewMatrix
  }

  /**
   * Gets the orthographic projection transformation matrix from
   * view to NDC (normalized device coordinates) space
   * @return {Mat2d}
   */
  get projMatrix() {
    if (this._projDirty) {
      const flip = (this._yflip ? -1 : 1)
      Mat2d.set(this._projMatrix, 2.0 / this._projectionDimensions[0], 0, 0, flip * 2.0 / this._projectionDimensions[1], 0, 0)
      this._worldToScreenOutdated = true
      this._projDirty = false
    }
    return this._projMatrix
  }

  /**
   * Returns true if any of the dirty flags are active
   * @return {Boolean}
   * @private
   */
  _matricesDirty() {
    return this._boundsOutOfDate || this._lxformDirty || this._xformDirty || this._viewDirty || this._projDirty || this._screenDirty
  }

  /**
   * Gets the transformation matrix from world space to screen space.
   * @return {Mat2d}
   */
  get worldToScreenMatrix() {
    if (!this._worldToScreenMatrix || this._worldToScreenOutdated || this._matricesDirty()) {
      if (!this._worldToScreenMatrix) {
        this._worldToScreenMatrix = Mat2d.create()
      }
      Mat2d.copy(this._worldToScreenMatrix, this.viewMatrix)
      Mat2d.multiply(this._worldToScreenMatrix, this.projMatrix, this._worldToScreenMatrix)
      Mat2d.multiply(this._worldToScreenMatrix, this.screenMatrix, this._worldToScreenMatrix)
      this._worldToScreenOutdated = false
      this._screenToWorldOutdated = true
    }
    return this._worldToScreenMatrix
  }

  /**
   * Gets teh transform matrix from screen space to world space.
   * @return {[type]} [description]
   */
  get screenToWorldMatrix() {
    if (!this._screenToWorld || this._screenToWorldOutdated || this._matricesDirty()) {
      if (!this._screenToWorld) {
        this._screenToWorld = Mat2d.create()
      }
      Mat2d.copy(this._screenToWorld, this.worldToScreenMatrix)
      Mat2d.invert(this._screenToWorld, this._screenToWorld)
      this._screenToWorldOutdated = false
    }
    return this._screenToWorld
  }
}
