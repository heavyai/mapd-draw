"use strict"

import ColorRGBA, {createEventedColorRGBAClass} from "./color-rgba"
import aggregation from "../util/aggregation"

/**
 * @typedef {object} StrokeStyleOptions
 * @property {string} [strokeColor = "black"]
 * @property {number} [strokeWidth = 0]
 * @property {string} [lineJoin = "miter"]
 * @property {string} [lineCap = "butt"]
 * @property {number[]} [dashPattern = []]
 * @property {number} [dashOffset = 0]
 */

/**
 * validates a possible stroke width value
 * @param  {number} strokeWidth
 * @throws If validation fails
 * @private
 */
function validateStrokeWidth(strokeWidth) {
  if (typeof strokeWidth !== "number") {
    throw new Error("Stroke width must be a number")
  }
}

/**
 * Enum for line join values
 * @enum {number}
 */
const JoinEnum = {
  MITER: 0,
  BEVEL: 1,
  ROUND: 2
}

/**
 * line join values as strings, the enum values match the index in this string
 * @type {string[]}
 */
const lineJoinOpts = ["miter", "bevel", "round"]

/**
 * validates a line join value
 * @param  {string} lineJoin Should be one of ["miter", "bevel", "round"]
 * @throws If validation fails
 * @return {JoinEnum}
 * @private
 */
function validateLineJoin(lineJoin) {
  let idx = -1
  if (typeof lineJoin !== "string" || (idx = lineJoinOpts.indexOf(lineJoin.toLowerCase())) < 0) {
    throw new Error(`Line join must be a string and must be one of [${lineJoinOpts.join(", ")}]`)
  }
  return idx
}

/**
 * Enum for line cap values
 * @enum {number}
 */
const CapEnum = {
  BUTT: 0,
  SQUARE: 1,
  ROUND: 2
}

/**
 * line cap values as strings, the CapEnum values match the index in this string
 * @type {string[]}
 */
const lineCapOpts = ["butt", "square", "round"]

/**
 * validates a line cap value
 * @param  {string} lineCap Should be one of "butt", "square", "round"
 * @throws If validation fails
 * @return {CapEnum}
 * @private
 */
function validateLineCap(lineCap) {
  let idx = -1
  if (typeof lineCap !== "string" || (idx = lineCapOpts.indexOf(lineCap.toLowerCase())) < 0) {
    throw new Error(`Line cap must be a string and must be one of [${lineCapOpts.join(", ")}]`)
  }
  return idx
}

/**
 * validates a dash pattern value
 * @param  {number[]} dashPattern
 * @throws If validation fails
 * @private
 */
function validateDashPattern(dashPattern) {
  if (!dashPattern || !Array.isArray(dashPattern) || dashPattern.length % 2 !== 0) {
    throw new Error("The dash pattern must be an array with an even number of numbers (or an empty array)")
  }
}

/**
 * validates a dash offset value
 * @param  {number} dashOffset
 * @throws If validation fails
 * @private
 */
function validateDashOffset(dashOffset) {
  if (typeof dashOffset !== "number") {
    throw new Error("The dash offset must be a number")
  }
}

/**
 * Manages the stroke style of a 2d rendering context. Can be used as a mixin or base class
 * @class
 * @mixin
 */
export default class StrokeStyle {
  constructor(opts) {
    this.initializer(opts)
  }

  /**
   * initializes the stroke style object from an options object
   * @param  {StrokeStyleOptions} [opts]
   * @private
   */
  _initStrokeStyleFromOptions(opts) {
    if (opts) {
      if (typeof opts.strokeColor !== "undefined") {
        this.strokeColor = opts.strokeColor
      }
      if (typeof opts.strokeOpacity !== "undefined") {
        this.strokeOpacity = opts.strokeOpacity
      }
      if (typeof opts.strokeWidth !== "undefined") {
        this.strokeWidth = opts.strokeWidth
      }
      if (typeof opts.lineMiter !== "undefined") {
        this.lineJoin = opts.lineMiter
      }
      if (typeof opts.lineCap !== "undefined") {
        this.lineCap = opts.lineCap
      }
      if (typeof opts.dashPattern !== "undefined") {
        this.dashPattern = opts.dashPattern
      }
      if (typeof opts.dashOffset !== "undefined") {
        this.dashOffset = opts.dashOffset
      }
    }
  }

  /**
   * Initializer method to initialize a stroke style. Used for both initializing
   * via base-class and mixin hierarchy.
   * @param  {StrokeStyleOptions} [opts]
   * @protected
   */
  initializer(opts) {
    this._strokeColor = new ColorRGBA("black")
    this._strokeWidth = 0
    this._lineJoin = JoinEnum.MITER
    this._lineCap = CapEnum.BUTT
    this._dashPattern = []
    this._dashOffset = 0
    this._initStrokeStyleFromOptions(opts)
  }

  /**
   * Sets the stroke color
   * @param  {string} strokeColor Color as a string, "rgb()", "rgba()", "#......", or a color keyword (i.e. "black")
   * @return {StrokeStyle}
   */
  set strokeColor(strokeColor) {
    this._strokeColor.value = strokeColor
    return this
  }

  /**
   * Gets the stroke color of the style
   * @return {string}
   */
  get strokeColor() {
    return this._strokeColor.value
  }

  /**
   * Sets the opacity of the stroke style
   * @param  {number} opacity [0,1]
   * @return {StrokeStyle}
   */
  set strokeOpacity(opacity) {
    this._strokeColor.opacity = opacity
  }

  /**
   * Gets the current opacity of the stroke style [0,1]
   * @return {number} Opacity in the range [0,1]
   */
  get strokeOpacity() {
    return this._strokeColor.opacity
  }

  /**
   * Sets the stroke color of the style defined as a 32-bit int
   * @param  {number} packedStrokeColor Color value as a 32-bit int (i.e. 0xFFFFFFFF)
   * @return {StrokeStyle}
   */
  set packedStrokeColor(packedStrokeColor) {
    this._strokeColor.packedValue = packedStrokeColor
  }

  /**
   * Gets the current value of the color of the stroke style as a 32-bit int
   * @return {number} i.e. 0xFFFFFFFF
   */
  get packedStrokeColor() {
    return this._strokeColor.packedValue
  }

  /**
   * Sets the stroke width
   * @param  {number} strokeWidth
   * @return {StrokeStyle}
   */
  set strokeWidth(strokeWidth) {
    validateStrokeWidth(strokeWidth)
    this._strokeWidth = strokeWidth
    return this
  }

  /**
   * Gets the current stroke width
   * @return {number}
   */
  get strokeWidth() {
    return this._strokeWidth
  }

  /**
   * Sets how lines should be joined
   * @param  {string} lineJoin One of "miter", "round", or "bevel"
   * @return {StrokeStyle}
   */
  set lineJoin(lineJoin) {
    const enumVal = validateLineJoin(lineJoin)
    this._lineJoin = enumVal
    return this
  }

  /**
   * Gets the current line join
   * @return {string}
   */
  get lineJoin() {
    return lineJoinOpts[this._lineJoin]
  }

  /**
   * Sets how lines should be capped
   * @param  {string} lineCap One of "butt", "square", or "round"
   * @return {StrokeStyle}
   */
  set lineCap(lineCap) {
    const enumVal = validateLineCap(lineCap)
    this._lineCap = enumVal
    return this
  }

  /**
   * Gets the current line cap of the style
   * @return {string}
   */
  get lineCap() {
    return lineCapOpts[this._lineJoin]
  }

  /**
   * Sets the dash pattern of the style
   * @param  {number[]} dashPattern A list of numbers that specifies distances to alternately
   *                                draw a line and a gap (in screen units)
   * @return {StrokeStyle}
   */
  set dashPattern(dashPattern) {
    validateDashPattern(dashPattern)
    this._dashPattern = dashPattern.slice()
    return this
  }

  /**
   * Gets the current dash pattern of the style
   * @return {number[]}
   */
  get dashPattern() {
    return this._dashPattern.slice()
  }

  /**
   * Sets the dash offset of the style
   * @param  {number} dashOffset
   * @return {StrokeStyle}
   */
  set dashOffset(dashOffset) {
    validateDashOffset(dashOffset)
    this._dashOffset = dashOffset
    return this
  }

  /**
   * Gets the current dash offset
   * @return {number}
   */
  get dashOffset() {
    return this._dashOffset
  }

  /**
   * Returns true if the stroke style is visible, i.e. it is not fully transparent
   * and has a width > 0
   * @return {Boolean}
   */
  isStrokeVisible() {
    return this._strokeColor.opacity > 0 && this._strokeWidth > 0
  }

  /**
   * Returns true if stroke is partially transparent, i.e. opacity < 1
   * @return {Boolean} [description]
   */
  isTransparent() {
    return this._strokeColor.isTransparent()
  }

  /**
   * Sets the stroke style state of a 2d rendering context
   * @param {CanvasRenderingContext2D} ctx
   */
  setStrokeCtx(ctx) {
    ctx.strokeStyle = this.strokeColor
    ctx.lineWidth = this._strokeWidth
    ctx.lineJoin = this._lineJoin
    ctx.lineCap = this._lineCap
    ctx.setLineDash(this._dashPattern)
    ctx.lineDashOffset = this._dashOffset
  }

  /**
   * Copies the properties of one stroke style to another
   * @param  {StrokeStyle} srcStyle StrokeStyle object to copy from
   * @param  {StrokeStyle} dstStyle StrokeStyle object to copy to
   */
  static copyStrokeStyle(srcStyle, dstStyle) {
    if (typeof srcStyle.packedStrokeColor === "undefined") {
      if (typeof srcStyle.strokeColor !== "undefined") {
        dstStyle.strokeColor = srcStyle.strokeColor
      }
      if (typeof srcStyle.strokeOpacity !== "undefined") {
        dstStyle.strokeOpacity = srcStyle.strokeOpacity
      }
    } else {
      dstStyle.packedStrokeColor = srcStyle.packedStrokeColor
    }
    if (typeof srcStyle.strokeWidth !== "undefined") {
      dstStyle.strokeWidth = srcStyle.strokeWidth
    }
    if (typeof srcStyle.lineJoin !== "undefined") {
      dstStyle.lineJoin = srcStyle.lineJoin
    }
    if (typeof srcStyle.lineCap !== "undefined") {
      dstStyle.lineCap = srcStyle.lineCap
    }
    if (typeof srcStyle.dashPattern !== "undefined") {
      dstStyle.dashPattern = srcStyle.dashPattern
    }
    if (typeof srcStyle.dashOffset !== "undefined") {
      dstStyle.dashOffset = srcStyle.dashOffset
    }
  }

  /**
   * Comparison operator between two StrokeStyle objects. This is primarily
   * used for sorting to minimize context switching of a 2d renderer
   * @param  {StrokeStyle} strokeStyleA
   * @param  {StrokeStyle} strokeStyleB
   * @return {number}            Returns < 0 if strokeStyleA < strokeStyleB, > 0 if strokeStyleA > strokeStyleB, or 0 if they are equal.
   */
  static compareStrokeStyle(strokeStyleA, strokeStyleB) {
    let valA = strokeStyleA.isStrokeVisible()
    let valB = strokeStyleB.isStrokeVisible()
    if (valA !== valB) {
      return valA - valB
    }
    valA = strokeStyleA.packedStrokeColor
    valB = strokeStyleB.packedStrokeColor
    if (valA !== valB) {
      return valA - valB
    }
    valA = strokeStyleA.strokeWidth
    valB = strokeStyleB.strokeWidth
    if (valA !== valB) {
      return valA - valB
    }
    valA = strokeStyleA._lineJoin
    valB = strokeStyleB._lineJoin
    if (valA !== valB) {
      return valA - valB
    }
    valA = strokeStyleA._lineCap
    valB = strokeStyleB._lineCap
    if (valA !== valB) {
      return valA - valB
    }
    valA = strokeStyleA._dashPattern
    valB = strokeStyleB._dashPattern
    if (valA.length === valB.length && valA.length > 0) {
      for (let i = 0; i < valA.length; i += 1) {
        if (valA[i] !== valB[i]) {
          return valA[i] - valB[i]
        }
      }
      return strokeStyleA.dashOffset - strokeStyleB.dashOffset
    }
    return valA.length - valB.length
  }

  /**
   * Returns a json object of a StrokeStyle object
   * @param  {StrokeStyle} strokeStyleObj
   * @return {{strokeColor: string,
   *           strokeWidth: number,
   *           lineJoin: string,
   *           lineCap: string,
   *           dashPattern: number[],
   *           dashOffset: number
   *          }}
   */
  static toJSON(strokeStyleObj) {
    return {
      strokeColor: strokeStyleObj.strokeColor,
      strokeWidth: strokeStyleObj.strokeWidth,
      lineJoin: strokeStyleObj.lineJoin,
      lineCap: strokeStyleObj.lineCap,
      dashPattern: strokeStyleObj.dashPattern,
      dashOffset: strokeStyleObj.dashOffset
    }
  }
}

/**
 * Creates a new stroke style class that fires events whenever the style
 * is modified.
 * @param  {string} eventName Event type to fire when stroke style is modified
 * @return {function}         New class constructor function
 */
export function createEventedStrokeStyleMixin(eventName) {
  /**
   * Evented stroke color class to handle color modification events
   * @type {ColorRGBA}
   */
  const StrokeColorClass = createEventedColorRGBAClass(eventName, "strokeColor")

  /**
   * Stroke style modification event
   * @event EventedStrokeStyle#changed
   * @type {object}
   * @property {string} attr Name of the attribute modified
   * @property {} prevVal Previous value of the attribute prior to modification
   * @property {} currVal Value of the attribute post modification
   */

  /**
   * @mixin New evented stroke style mixin. Will fire events whenever
   *        the stroke is modified
   */
  return aggregation(null, StrokeStyle, class EventedStrokeStyle {
    /**
     * Initializer method to initialize an evented stroke style.
     * @param  {StrokeStyleOptions} [opts]
     * @protected
     */
    initializer(opts) {
      this._strokeColor = new StrokeColorClass("black", this)
      this._strokeWidth = 0
      this._lineJoin = JoinEnum.MITER
      this._lineCap = CapEnum.BUTT
      this._dashPattern = []
      this._dashOffset = 0
      this._initStrokeStyleFromOptions(opts)
    }

    /**
     * Sets the stroke width
     * @param  {number}
     * @fires  EventedStrokeStyle#changed
     * @return {EventedStrokeStyle}
     */
    set strokeWidth(strokeWidth) {
      validateStrokeWidth(strokeWidth)
      if (strokeWidth !== this._strokeWidth) {
        const prev = this._strokeWidth
        this._strokeWidth = strokeWidth
        this.fire(eventName, {
          attr: "strokeWidth",
          prevVal: prev,
          curral: this._strokeWidth
        })
      }

      return this
    }

    /**
     * Gets the current stroke width
     * @return {number}
     */
    get strokeWidth() {
      return this._strokeWidth
    }

    /**
     * Sets the line join
     * @param  {string} lineJoin
     * @fires {EventedStrokeStyle#changed}
     * @return {EventedStrokeStyle}
     */
    set lineJoin(lineJoin) {
      const enumVal = validateLineJoin(lineJoin)

      if (enumVal !== this._lineJoin) {
        const prev = this._lineJoin
        this._lineJoin = enumVal
        this.fire(eventName, {
          attr: "lineJoin",
          prevVal: prev,
          curral: this._lineJoin
        })
      }

      return this
    }

    /**
     * Gets the current line join
     * @return {string}
     */
    get lineJoin() {
      return lineJoinOpts[this._lineJoin]
    }

    /**
     * Sets the line cap
     * @param  {string} lineCap
     * @fires {EventedStrokeStyle#changed}
     * @return {EventedStrokeStyle}
     */
    set lineCap(lineCap) {
      const enumVal = validateLineCap(lineCap)
      if (enumVal !== this._lineCap) {
        const prev = this._lineCap
        this._lineCap = enumVal
        this.fire(eventName, {
          attr: "lineCap",
          prevVal: prev,
          curral: this._lineCap
        })
      }
      return this
    }

    /**
     * Gets the line cap
     * @return {string}
     */
    get lineCap() {
      return lineCapOpts[this._lineCap]
    }

    /**
     * Sets the dash pattern
     * @param  {number[]} dashPattern
     * @fires {EventedStrokeStyle#changed}
     * @return {EventedStrokeStyle}
     */
    set dashPattern(dashPattern) {
      validateDashPattern(dashPattern)
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
        const prev = this._dashPattern
        this._dashPattern = dashPattern.slice()
        this.fire(eventName, {
          attr: "dashPattern",
          prevVal: prev,
          curral: this._dashPattern.slice()
        })
      }
      return this
    }

    /**
     * Gets the current dash pattern
     * @return {number[]}
     */
    get dashPattern() {
      return this._dashPattern.slice()
    }

    /**
     * Sets the current dash offset
     * @param  {number} dashOffset
     * @fires {EventedStrokeStyle#changed}
     * @return {EventedStrokeStyle}
     */
    set dashOffset(dashOffset) {
      validateDashOffset(dashOffset)

      if (dashOffset !== this._dashOffset) {
        const prev = this._dashOffset
        this._dashOffset = dashOffset

        if (this._dashPattern.length) {
          // only fire if dashing is activated
          this.fire(eventName, {
            attr: "dashOffset",
            prevVal: prev,
            curral: this._dashOffset
          })
        }
      }
      return this
    }

    /**
     * Gets the current dash offset
     * @return {number}
     */
    get dashOffset() {
      return this._dashOffset
    }
  })
}
