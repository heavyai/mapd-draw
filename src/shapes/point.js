"use strict"

import * as AABox2d from "../core/aabox2d"
import BaseShape from "./base-shape.js"
import Mat2d from "../core/mat2d"
import Math from "../math/math"

/**
 * @typedef {object} PointOptions
 * @property {number} [size=5] Size of the point in pixels
 */

/**
 * @class Point shape class. A point differs from a circle in that
 *        a point's size is defined in screen/pixel space whereas
 *        a circle is defined in world space.
 * @extends {BaseShape}
 */
export default class Point extends BaseShape {
  /**
   * Creates a new point shape
   * @param  {PointOptions} [opts]
   * @return {Point}
   */
  constructor(opts) {
    super(opts)
    this._size = 5
    if (typeof opts.size !== "undefined") {
      this.size = opts.size
    }
    AABox2d.initCenterExtents(this._aabox, [0, 0], [this._radius, this._radius])
    this.translate(opts.x || 0, opts.y || 0)
  }

  /**
   * Sets the size of the point
   * @param  {nuber} size Size of the point in pixels
   * @return {Pixel}      this
   * @fires {Shape#geomChanged}
   * @throws {Error} If size is not a valid number
   */
  set size(size) {
    if (typeof size !== "number") {
      throw new Error("Radius must be a number")
    }

    if (size !== this._size) {
      const prev = this._size
      this._size = size
      this._geomDirty = true // dirty needs to be set before firing event

      this.fire("changed:geom", {
        attr: "size",
        prevVal: prev,
        currVal: this._size
      })
    }
  }

  /**
   * Gets the current size of the point
   * @return {number}
   */
  get size() {
    return this._size
  }

  /**
   * Called when the bounding box requires updating
   * @private
   * @override
   */
  _updateAABox() {
    if (this._geomDirty || this._boundsOutOfDate) {
      const pos = this._pos
      const scale = this._scale
      const rot = Math.DEG_TO_RAD * this._rotDeg
      const cossqr = Math.pow(Math.cos(rot), 2)
      const sinsqr = Math.pow(Math.sin(rot), 2)
      const asqr = Math.pow(scale[0] * this._size, 2)
      const bsqr = Math.pow(scale[1] * this._size, 2)
      const A = Math.sqrt(bsqr * sinsqr + asqr * cossqr)
      const B = Math.sqrt(asqr * sinsqr + bsqr * cossqr)
      AABox2d.initCenterExtents(this._aabox, pos, [A, B])
      this._geomDirty = false
      this._boundsOutOfDate = false
    }
  }

  /**
   * Draws the point using a 2d rendering context. Called by the BaseShape
   * class
   * @param  {CanvasRenderingContext2d} ctx 2d rendering context
   * @override
   */
  _draw(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const pos = [0, 0]
    Mat2d.svd(pos, null, null, this._fullXform)
    ctx.arc(pos[0], pos[1], this._size, 0, Math.TWO_PI, false)
  }

  /**
   * Called to convert the shape to a serializable JSON object
   * @return {object}
   * @override
   */
  toJSON() {
    return Object.assign({
      type: "Point", // NOTE: this much match the name of the class
      size: this.size
    }, super.toJSON())
  }

}
