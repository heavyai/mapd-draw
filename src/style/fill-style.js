"use strict"

import ColorRGBA, {createEventedColorRGBAClass} from "./color-rgba"
import aggregation from "../util/aggregation"

/**
 * @typedef {object} FillStyleOptions
 * @property {string} [fillColor="black"] Fill color defined as a string
 * @property {number} [fillOpacity=1] Opacity of the fill color. This supersedes any opacity inherent in fillColor
 */

/**
 * Manages the fill style of a 2d rendering context. Can be used as a mixin or base class
 * @class
 * @mixin
 */
export default class FillStyle {
  /**
   * Creates a new fill style object
   * @param {FillStyleOptions} [opts]
   * @return {FillStyle}
   */
  constructor(opts) {
    // TODO(croot): support gradients and patterns
    this.initializer(opts)
  }

  /**
   * initializes the fill style object from an options object
   * @param  {FillStyleOptions} [opts]
   * @private
   */
  _initFillStyleFromOptions(opts) {
    if (opts) {
      if (typeof opts.fillColor !== "undefined") {
        this.fillColor = opts.fillColor
      }
      if (typeof opts.fillOpacity !== "undefined") {
        this.fillOpacity = opts.fillOpacity
      }
    }
  }

  /**
   * Initializer method to initialize a fill style. Used for both initializing
   * via base-class and mixin hierarchy.
   * @param  {FillStyleOptions} [opts]
   */
  initializer(opts) {
    this._fillColor = new ColorRGBA("black")
    this._initFillStyleFromOptions(opts)
  }

  /**
   * Sets the fill color
   * @param  {string} fillColor Color as a string, "rgb()", "rgba()", "#......", or a color keyword (i.e. "black")
   * @return {FillStyle}
   */
  set fillColor(fillColor) {
    this._fillColor.value = fillColor
    return this
  }

  /**
   * Gets the fill color of the style
   * @return {string}
   */
  get fillColor() {
    return this._fillColor.value
  }

  /**
   * Sets the opacity of the fill style
   * @param  {number} opacity [0,1]
   * @return {FillStyle}
   */
  set fillOpacity(opacity) {
    this._fillColor.opacity = opacity
    return this
  }

  /**
   * Gets the current opacity of the fill style [0,1]
   * @return {number} Opacity in the range [0,1]
   */
  get fillOpacity() {
    return this._fillColor.opacity
  }

  /**
   * Sets the fill color of the style defined as a 32-bit int
   * @param  {number} packedFillColor Color value as a 32-bit int (i.e. 0xFFFFFFFF)
   * @return {FillStyle}
   */
  set packedFillColor(packedFillColor) {
    this._fillColor.packedValue = packedFillColor
    return this
  }

  /**
   * Gets the current value of the color of the fill style as a 32-bit int
   * @return {number} i.e. 0xFFFFFFFF
   */
  get packedFillColor() {
    return this._fillColor.packedValue
  }

  /**
   * Returns true if the fill style is visible, i.e. it has an opacity > 0
   * @return {Boolean}
   */
  isFillVisible() {
    return this._fillColor.opacity > 0
  }

  /**
   * Returns true if the fill style is transparent in any way, i.e. opacity < 1
   * @return {Boolean}
   */
  isTransparent() {
    return this._fillColor.isTransparent()
  }

  /**
   * Sets the fill style state of a 2d rendering context
   * @param {CanvasRenderingContext2D} ctx
   */
  setFillCtx(ctx) {
    ctx.fillStyle = this.fillColor
  }

  /**
   * Copies the properties of one fill style to another
   * @param  {FillStyle} srcStyle FillStyle object to copy from
   * @param  {FillStyle} dstStyle FillStyle object to copy to
   */
  static copyFillStyle(srcStyle, dstStyle) {
    if (typeof srcStyle.packedFillColor === "undefined") {
      if (typeof srcStyle.fillColor !== "undefined") {
        dstStyle.fillColor = srcStyle.fillColor
      }
      if (typeof srcStyle.fillOpacity !== "undefined") {
        dstStyle.fillOpacity = srcStyle.fillOpacity
      }
    } else {
      dstStyle.packedFillColor = srcStyle.packedFillColor
    }
  }

  /**
   * Comparison operator between two FillStyle objects. This is primarily
   * used for sorting to minimize context switching of a 2d renderer
   * @param  {FillStyle} fillStyleA
   * @param  {FillStyle} fillStyleB
   * @return {number}            Returns < 0 if fillStyleA < fillStyleB, > 0 if fillStyleA > fillStyleB, or 0 if they are equal.
   */
  static compareFillStyle(fillStyleA, fillStyleB) {
    const valA = fillStyleA.isFillVisible()
    const valB = fillStyleB.isFillVisible()
    if (valA !== valB) {
      return valA - valB
    }
    return fillStyleA.packedFillColor - fillStyleB.packedFillColor
  }

  /**
   * Returns a json object of a FillStyle object
   * @param  {FillStyle} fillStyleObj
   * @return {{fillColor: string}}
   */
  static toJSON(fillStyleObj) {
    return {
      fillColor: fillStyleObj.fillColor
    }
  }
}

/**
 * Creates a new fill style class that fires events whenever the style
 * is modified.
 * @param  {string} eventName Event type to fire when fill style is modified
 * @return {function}         New class constructor function
 */
export function createEventedFillStyleMixin(eventName) {
  /**
   * Evented fill color class to handle fill color modifications
   * @type {ColorRGBA}
   */
  const FillColorClass = createEventedColorRGBAClass(eventName, "fillColor")

  /**
   * @mixin New evented fill style mixin. Will fire events whenever
   *        the fill color is modified
   */
  return aggregation(null, FillStyle, class EventedFillStyle {
    initializer(opts) {
      this._fillColor = new FillColorClass("red", this)
      this._initFillStyleFromOptions(opts)
    }
  })
}
