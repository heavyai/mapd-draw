"use strict"

import * as AABox2d from "../core/aabox2d"
import BaseShape from "./base-shape.js"
import Math from "../math/math"

/**
 * @typedef {object} CircleOptions
 * @property {number} [radius=10] Radius of the circle in world-space coordinates
 */

/**
 * @class Shape class describing a circle
 * @extends {BaseShape}
 */
export default class Circle extends BaseShape {
  /**
   * Creates a new Circle shape
   * @param  {CircleOptions} [opts]
   * @return {Circle}
   */
  constructor(opts) {
    super(opts)
    this._radius = 10
    if (typeof opts.radius !== "undefined") {
      this.radius = opts.radius
    }
    AABox2d.initCenterExtents(this._aabox, [0, 0], [this._radius, this._radius])
  }

  /**
   * Sets the radius of the circle
   * @param  {number} radius Radius of circle in world-space coordinates
   * @return {Circle}        this
   * @fires {Shape#geomChanged}
   * @throws {Error} If radius is not a valid number
   */
  set radius(radius) {
    if (typeof radius !== "number") {
      throw new Error("Radius must be a number")
    }

    if (radius !== this._radius) {
      const prev = this._radius
      this._radius = radius
      this._geomDirty = true // dirty needs to be set before firing event

      this.fire("changed:geom", {
        attr: "radius",
        prevVal: prev,
        currVal: this._radius
      })
    }

    return this
  }

  /**
   * Gets the current radius of the circle
   * @return {number}
   */
  get radius() {
    return this._radius
  }

  /**
   * Gets the untransformed width/height of the circle
   * @return {Vec2d} Width/height of the circle, untransformed
   */
  getDimensions() {
    const diameter = this.radius * 2
    return [diameter, diameter]
  }

  /**
   * Gets the untransformed width of the circle
   * @return {number}
   */
  get width() {
    return this.radius * 2
  }

  /**
   * Gets the untransformed height of the circle
   * @return {number}
   */
  get height() {
    return this.radius * 2
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
      const asqr = Math.pow(scale[0] * this._radius, 2)
      const bsqr = Math.pow(scale[1] * this._radius, 2)
      const A = Math.sqrt(bsqr * sinsqr + asqr * cossqr)
      const B = Math.sqrt(asqr * sinsqr + bsqr * cossqr)
      AABox2d.initCenterExtents(this._aabox, pos, [A, B])
      this._geomDirty = false
      this._boundsOutOfDate = false
    }
  }

  /**
   * Draws the circle using a 2d rendering context. Called by the BaseShape
   * class
   * @param  {CanvasRenderingContext2d} ctx 2d rendering context
   * @override
   */
  _draw(ctx) {
    ctx.arc(0, 0, this._radius, 0, Math.TWO_PI, false)
  }

  /**
   * Called to convert the shape to a serializable JSON object
   * @return {object}
   * @override
   */
  toJSON() {
    return Object.assign({
      type: "Circle", // NOTE: this much match the name of the class
      radius: this.radius
    }, super.toJSON())
  }

}
