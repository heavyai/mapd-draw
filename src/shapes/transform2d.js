"use strict"

import * as Point2d from "../core/point2d"
import {glMatrix as GLMatrix, mat2d as Mat2d, vec2 as Vec2d} from "gl-matrix"
import aggregation from "../util/aggregation"
import Math from "../math/math"

/**
 * Builds a 2D transformation matrix (2x3 matrix) from a rotation (in degrees),
 * an x,y scale, a translation, and a pivot (an offset from the origin to
 * apply the transformation around)
 * @param  {Mat2d} mat   Matrix to store the result of the operation
 * @param  {number} rdeg  rotation, in degrees
 * @param  {Vec2d} s     Scale vector, in x & y
 * @param  {Vec2d} t     Translation vector, in x & y
 * @param  {Vec2d} pivot Offset from origin to apply the transformation
 * @return {Mat2d}       Matrix referenced by the mat argument
 */
export function buildXformMatrix(mat, rdeg, s, t, pivot) {
  Mat2d.identity(mat)
  Mat2d.translate(mat, mat, [t[0] + pivot[0], t[1] + pivot[1]])
  Mat2d.rotate(mat, mat, Math.DEG_TO_RAD * rdeg)
  Mat2d.scale(mat, mat, s)
  Mat2d.translate(mat, mat, [-pivot[0], -pivot[1]])
  return mat
}

/**
 * Utility function to dirty all the descendants of a transform node.
 * This is called when a transform node has been modified in some way
 * that it's children need to be notified about.
 * @param  {Transform2d[]} children
 */
function dirtyChildren(children) {
  children.forEach(child => {
    child._xformDirty = true
    dirtyChildren(child._children)
  })
}

/**
 * @typedef {object} Transform2dOptions
 * @property {Point2d} [position = [0,0]] Position in world space coords
 * @property {Vec2d} [scale = [1,1]] Scale in world space coords
 * @property {number} [rotation = 0] Rotation in degrees
 * @property {Vec2d} [pivot = [0, 0]] Offset from origin to apply the setTransformations
 */

/**
 * @class Class to manage basic 2d affine transformations
 * @mixin Can also be used as a mixin
 */
export default class Transform2d {
  /**
   * Creates a new Transform2d
   * @param  {Transform2dOptions} [opts]
   * @return {Transform2d}
   */
  constructor(opts) {
    this.initializer(opts)
  }

  /**
   * Initializes a transform 2d object from options
   * @param  {Transform2dOptions} [opts]
   * @private
   */
  _initTransformFromOptions(opts) {
    if (!opts) {
      return
    }

    if (typeof opts.position !== "undefined") {
      this.setPosition(opts.position)
    }

    if (typeof opts.scale !== "undefined") {
      this.setScale(opts.scale)
    }

    if (typeof opts.rotation !== "undefined") {
      this.setRotation(opts.rotation)
    }

    if (typeof opts.pivot !== "undefined") {
      this.pivot = opts.pivot
    }
  }

  /**
   * Initializes a transform 2d object from options,
   * called from either constructor (if used as base class)
   * or base mixin class (if used as a mixin)
   * @param  {Transform2dOptions} [opts]
   * @protected
   */
  initializer(opts) {
    this._localXform = Mat2d.create()
    this._lxformDirty = false

    this._pivot = Point2d.create(0, 0)

    this._pos = Point2d.create(0, 0)
    this._scale = Vec2d.fromValues(1, 1)
    this._rotDeg = 0

    this._globalXform = Mat2d.create()
    this._xformDirty = false
    this._parent = null
    this._children = new Set()

    this._initTransformFromOptions(opts)
  }

  /**
   * Adds a child to this transform node
   * @param {Transform2d} childXform
   */
  addChildXform(childXform) {
    if (!this._children.has(childXform)) {
      this._children.add(childXform)
      if (childXform._parent) {
        childXform._parent.removeChild(childXform)
      }
      childXform._parent = this
      childXform._xformDirty = true
      dirtyChildren(childXform._children)
    }
  }

  /**
   * Removes a child from this transform node
   * @param  {Transform2d} childXform
   */
  removeChildXform(childXform) {
    this._children.delete(childXform)
  }

  /**
   * Unparents this node from its parent, if it has one
   */
  unparentXform() {
    if (this._parent) {
      this._parent.removeChild(this)
      this._parent = null
      Mat2d.copy(this._globalXform, this.localXform)
    }
  }

  /**
   * Sets the pivot of the transform
   * @param  {Vec2d} pivot Offset vector from the origin to apply the transformations
   * @return {Transform2d}
   */
  set pivot(pivot) {
    Point2d.copy(this._pivot, pivot)
    this._lxformDirty = true
    dirtyChildren(this._children)
    return this
  }

  /**
   * Gets the current pivot of the transform
   * @return {Vec2d}
   */
  get pivot() {
    return Point2d.clone(this._pivot)
  }

  /**
   * Gets the current pivot reference of the transform.
   * @return {[type]} [description]
   * @readOnly
   */
  get pivotRef() {
    return this._pivot
  }

  /**
   * Gets the parent transform node, if one is attached
   * @return {Transform2d}
   */
  get parent() {
    return this._parent
  }

  /**
   * Gets the current unparented position of the transform
   * @return {Point2d} This is the position of the node as if it were unparented
   */
  getPosition() {
    return Vec2d.clone(this._pos)
  }

  /**
   * Gets the reference to the unparented position of the transform, avoiding
   * a copy
   * @return {Point2d}
   * @readOnly
   */
  getPositionRef() {
    return this._pos
  }

  /**
   * Gets the current world position of the transform, this is its position
   * after all parent transformations have been applied
   * @return {Point2d}
   */
  getWorldPosition() {
    const xform = this.globalXform
    return Point2d.create(xform[4], xform[5])
  }

  /**
   * Sets the unparented world position of the transform
   * @param {Point2d} pos
   */
  setPosition(pos) {
    Point2d.copy(this._pos, pos)
    this._lxformDirty = true
    dirtyChildren(this._children)
  }

  /**
   * Translates the unparented world position of the transform by an offset
   * @param  {Vec2d} translation
   * @return {Transform2d}
   */
  translate(translation) {
    if (translation[0] || translation[1]) {
      Point2d.addVec2(this._pos, this._pos, translation)
      this._lxformDirty = true
      dirtyChildren(this._children)
    }
    return this
  }

  /**
   * Gets the current unparented x,y scale of the transform
   * @return {Vec2d}
   */
  getScale() {
    return Vec2d.clone(this._scale)
  }

  /**
   * Gets the current unparented x/y scale reference of the transform
   * avoiding a copy
   * @return {Vec2d}
   * @readOnly
   */
  getScaleRef() {
    return this._scale
  }

  /**
   * Sets the unparented scale of the transform
   * @param {Vec2d} scale
   * @return {Transform2d}
   */
  setScale(scale) {
    Vec2d.copy(this._scale, scale)
    this._lxformDirty = true
    dirtyChildren(this._children)
    return this
  }

  /**
   * Scales the current unparented scale by a 2d multiplier
   * @param  {Vec2d} scaleMult
   * @return {Transform2d}
   */
  scale(scaleMult) {
    if (scaleMult[0] !== 1 || scaleMult[1] !== 1) {
      Vec2d.multiply(this._scale, this._scale, scaleMult)
      this._lxformDirty = true
      dirtyChildren(this._children)
    }
    return this
  }

  /**
   * Gets the current unparented rotation in degrees of the transform
   * @return {number}
   */
  getRotation() {
    return this._rotDeg
  }

  /**
   * Sets the unparented rotation of the transform
   * @param {number} deg Rotation in degrees
   * @return {Transform2d}
   */
  setRotation(deg) {
    this._rotDeg = deg
    this._lxformDirty = true
    dirtyChildren(this._children)
    return this
  }

  /**
   * Adds an additional rotation in degrees to the current rotation
   * of the transform
   * @param  {number} deg Rotation offset in degrees
   * @return {Transform2d}
   */
  rotate(deg) {
    if (deg) {
      this._rotDeg += deg
      this._lxformDirty = true
      dirtyChildren(this._children)
    }
    return this
  }

  /**
   * Utility function to dirty all the descendants of this node
   * @private
   */
  _dirtyChildren() {
    dirtyChildren(this._children)
  }

  /**
   * Updates the local affine matrix if marked as dirty
   * If derived/mixin classes have a _localXformUpdates method
   * defined, that will be called here when the local transform
   * is updated.
   * @private
   */
  _updatelocalxform() {
    if (this._lxformDirty) {
      buildXformMatrix(this._localXform, this._rotDeg, this._scale, this._pos, this._pivot)
      if (this._localXformUpdated) {
        this._localXformUpdated()
      }
      this._lxformDirty = false
    }
  }

  /**
   * Updates the global 2x3 matrix of the transform if marked dirty
   * If derived/mixin classes have a _globalXformUpdates method
   * defined, that will be called here when the global transform
   * is updated.
   * @private
   */
  _updateglobalxform() {
    if (this._lxformDirty || this._xformDirty) {
      this._updatelocalxform()
      if (this._parent) {
        Mat2d.multiply(this._globalXform, this._parent.globalXform, this._localXform)
      } else {
        Mat2d.copy(this._globalXform, this._localXform)
      }
      if (this._globalXformUpdated) {
        this._globalXformUpdated()
      }
      this._xformDirty = false
    }
  }

  /**
   * Gets the current local transformation matrix of the node.
   * @return {Mat2d}
   */
  get localXform() {
    this._updatelocalxform()
    return this._localXform
  }

  /**
   * Gets the current global transformation matrix of the node. This is essentially
   * its local transform multiplied against all the local transforms of its parents.
   * This is ultimately used to convert a point from object space to world space, and
   * inversely, from world space to object space.
   * @return {Mat2d}
   */
  get globalXform() {
    this._updateglobalxform()
    return this._globalXform
  }

  /**
   * Sets the transform state of a 2d rendering context
   * @param  {CanvasRenderingContext2D} ctx
   * @param  {Mat2d} currMatrix          The current matrix used to store the result of the
   *                                     model-view-projection-screen matrix multiplication for this node
   * @param  {Mat2d} worldToScreenMatrix The current world-to-screen tranform
   */
  transformCtx(ctx, currMatrix, worldToScreenMatrix) {
    Mat2d.multiply(currMatrix, worldToScreenMatrix, this.globalXform)

    ctx.setTransform(currMatrix[0],
      currMatrix[1],
      currMatrix[2],
      currMatrix[3],
      currMatrix[4],
      currMatrix[5])
  }

  /**
   * Converts a Transform2d instance to a JSON object
   * @param  {Transform2d} xformObj
   * @return {{position: Point2d, scale: Vec2d, rotation: number, pivot: Vec2d}}
   */
  static toJSON(xformObj) {
    // TODO(croot): How do we deal with parenting here?
    // To properly deal with this, we may need to supply an
    // identifier for every created object... This may likely
    // need to be a name string supplied by the user
    const pos = xformObj.getPositionRef()
    const scale = xformObj.getScaleRef()
    const pivot = xformObj.pivotRef
    return {
      position: [pos[0], pos[1]],
      scale: [scale[0], scale[1]],
      rotation: xformObj.getRotation(),
      pivot: [pivot[0], pivot[1]]
    }
  }
}

/**
 * Creates a new Transform2d mixin class that is intended to be mixed in with
 * a class that inherits from the EventHandler class
 * @param  {string} eventName Type name of the event fired when the transform is modified
 * @return {function}           Mixin
 */
export function createEventedTransform2dMixin(eventName) {
  /**
   * Transform2d modification event
   * @event EventedTransform2d#changed
   * @type {object}
   * @property {string} attr Name of the attribute modified
   * @property {} prevVal Previous value of the attribute prior to modification
   * @property {} currVal Value of the attribute post modification
   */

  /**
   * @mixin Transform2d mixin with event firing when modified
   */
  return aggregation(null, Transform2d, class EventedTransform2d {
    /**
     * Sets the unparented pivot of the transform. The pivot is
     * the offset from the transform's primary position where the
     * transformation is applied.
     * @param {Vec2d} pivot
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    set pivot(pivot) {
      if (!Point2d.equals(pivot, this._pivot)) {
        const prev = [this._pivot[0], this._pivot[1]]
        Point2d.copy(this._pivot, pivot)
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attr: "pivot",
          prevVal: prev,
          currVal: pivot
        })
      }
      return this
    }

    /**
     * Gets a copy of the unparented pivot of the transform
     * @return {Vec2d}
     */
    get pivot() {
      return Point2d.clone(this._pivot)
    }

    /**
     * Sets the unparented position of the transform.
     * @param {Point2d} pos
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    setPosition(pos) {
      if (!Point2d.equals(pos, this._pos)) {
        const prev = [this._pos[0], this._pos[1]]
        Point2d.copy(this._pos, pos)
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attr: "position",
          prevVal: prev,
          currVal: pos
        })
      }
      return this
    }

    /**
     * Translates the unparented position of a transform by an offset.
     * @param  {Vec2d} translation
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    translate(translation) {
      if (translation[0] || translation[1]) {
        const prev = [this._pos[0], this._pos[1]]
        Point2d.addVec2(this._pos, this._pos, translation)
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attr: "position",
          prevVal: prev,
          currVal: [this._pos[0], this._pos[1]]
        })
      }
      return this
    }

    /**
     * Sets the unparented 2d scale of the transform
     * @param {Vec2d} scale
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    setScale(scale) {
      if (!Vec2d.equals(scale, this._scale)) {
        const prev = [this._scale[0], this._scale[1]]
        Vec2d.copy(this._scale, scale)
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attr: "size",
          prevVal: prev,
          currVal: scale
        })
      }
      return this
    }

    /**
     * Multiplies the current unparented scale of the transform by a 2d scalar
     * @param  {Vec2d} scaleMult
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    scale(scaleMult) {
      if (scaleMult[0] !== 1 || scaleMult[1] !== 1) {
        const prev = [this._scale[0], this._scale[1]]
        Vec2d.multiply(this._scale, this._scale, scaleMult)
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attr: "size",
          prevVal: prev,
          currVal: [this._scale[0], this._scale[1]]
        })
      }
      return this
    }

    /**
     * Sets the unparented rotation of the transform in degrees
     * @param {number} deg Rotation angle in degrees
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    setRotation(deg) {
      const degToUse = deg % 360
      if (degToUse !== this._rotDeg) {
        const prev = this._rotDeg
        this._rotDeg = degToUse
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attr: "orientation",
          prevVal: prev,
          curral: this._rotDeg
        })
      }
    }

    /**
     * Adds a rotation angle in degrees to the current unparented
     * rotation of the transform.
     * @param  {number} deg Additional rotation angle in degrees
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    rotate(deg) {
      if (deg) {
        const prev = this._rotDeg
        this._rotDeg += deg
        this._rotDeg %= 360
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attr: "orientation",
          prevVal: prev,
          curral: this._rotDeg
        })
      }
      return this
    }

    /**
     * Utility function to reset all the unparented transform parameters
     * @param {number} tx  Translation in x in world units
     * @param {number} ty  Translation in y in world units
     * @param {number} sx  Scale in x in world units
     * @param {number} sy  Scale in y in world units
     * @param {number} deg Rotation angle degrees
     * @fires  EventedTransform2d#changed
     * @return {EventedTransform2d}
     */
    setTransformations(tx, ty, sx, sy, deg) {
      const attrs = []
      const prevVals = []
      const currVals = []
      if (typeof tx !== "undefined" && typeof ty !== "undefined" && (!GLMatrix.equals(tx, this._pos[0]) || !GLMatrix.equals(ty, this._pos[1]))) {
        const prev = Point2d.clone(this._pos)
        this._pos[0] = tx
        this._pos[1] = ty
        attrs.push("position")
        prevVals.push(prev)
        currVals.push(Point2d.clone(this._pos))
      }

      if (typeof sx !== "undefined" && typeof sy !== "undefined" && (!GLMatrix.equals(sx, this._scale[0]) || !GLMatrix.equals(sy, this._scale[1]))) {
        const prev = Vec2d.clone(this._scale)
        Vec2d.set(this._scale, sx, sy)
        attrs.push("size")
        prevVals.push(prev)
        currVals.push(Vec2d.clone(this._scale))
      }

      if (typeof deg !== "undefined") {
        const degToUse = deg % 360
        if (!GLMatrix.equals(degToUse, this._rotDeg)) {
          const prev = this._rotDeg
          this._rotDeg = degToUse
          attrs.push("orientation")
          prevVals.push(prev)
          currVals.push(this._rotDeg)
        }
      }

      if (attrs.length) {
        this._lxformDirty = true
        dirtyChildren(this._children)
        this.fire(eventName, {
          attrs,
          prevVals,
          currVals
        })
      }
      return this
    }
  })
}
