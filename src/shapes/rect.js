"use strict"

import * as AABox2d from "../core/aabox2d"
import BaseShape from "./base-shape.js"

/**
 * @typedef {object} RectOptions
 * @property {number} [width=0] Width of the rect in world space coords
 * @property {number} [height=0] Height of the rect in world space coords
 */

/**
 * @class Class for defining a rectangle shape
 * @extends {BaseShape}
 */
export default class Rect extends BaseShape {
  /**
   * Creates a new rectangle shape
   * @param  {RectOptions} [opts]
   * @return {Rect}
   */
  constructor(opts) {
    super(opts)
    this._width = 0
    this._height = 0
    if (typeof opts.width !== "undefined") {
      this.width = opts.width
    }
    if (typeof opts.height !== "undefined") {
      this.height = opts.height
    }
  }

  /**
   * Gets the untransformed width/height of the rect
   * @return {Vec2d} Width/height of the rect
   */
  getDimensions() {
    return [this._width, this._height]
  }

  /**
   * Sets the width of the rectangle
   * @param  {number} width Width of the rect in world-space coordinates
   * @return {Rect}       this
   * @fires {Shape#geomChanged}
   * @throws {Error} If width is not a valid number
   */
  set width(width) {
    if (typeof width !== "number") {
      throw new Error("Width must be a number")
    }

    if (width !== this._width) {
      const prev = this._width
      this._width = width
      this._geomDirty = true // dirty needs to be set before firing event

      this.fire("changed:geom", {
        attr: "width",
        prevVal: prev,
        currVal: this._width
      })
    }
    return this
  }

  /**
   * Gets the current untransformed width of the rect
   * @return {number} Width in world-space units
   */
  get width() {
    return this._width
  }

  /**
   * Sets the height of the rectangle
   * @param  {number} height Height of the rect in world-space units
   * @return {Rect}       this
   * @fires {Shape#geomChanged}
   * @throws {Error} If height is not a valid number
   */
  set height(height) {
    if (typeof height !== "number") {
      throw new Error("Height must be a number")
    }

    if (height !== this._height) {
      const prev = this._height
      this._height = height
      this._geomDirty = true // dirty needs to be set before firing event

      this.fire("changed:geom", {
        attr: "height",
        prevVal: prev,
        currVal: this._height
      })
    }
    return this
  }

  /**
   * Gets the current untransformed height of the rect
   * @return {number} Height in world-space units
   */
  get height() {
    return this._height
  }

  /**
   * Called when the bounding box requires updating
   * @private
   * @override
   */
  _updateAABox() {
    if (this._geomDirty || this._boundsOutOfDate) {
      AABox2d.initCenterExtents(this._aabox, [0, 0], [this._width / 2, this._height / 2])
      AABox2d.transformMat2d(this._aabox, this._aabox, this.globalXform)
      this._geomDirty = this._boundsOutOfDate = false
    }
  }

  /**
   * Draws the rect using a 2d rendering context. Called by the BaseShape
   * class
   * @param  {CanvasRenderingContext2d} ctx 2d rendering context
   * @override
   */
  _draw(ctx) {
    ctx.rect(0 - this.width / 2, 0 - this.height / 2, this.width, this.height)
  }

  /**
   * Called to convert the shape to a serializable JSON object
   * @return {object}
   * @override
   */
  toJSON() {
    return Object.assign({
      type: "Rect",
      width: this.width,
      height: this.height
    }, super.toJSON())
  }
}
