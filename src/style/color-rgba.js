/* eslint-disable no-magic-numbers */
"use strict"

import Math from "../math/math"

/**
 * Color keywords as defined by the CSS color modules
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value}
 * @type {Map}
 */
const colorKeywords = new Map([["aliceblue", "#F0F8FF"],
                               ["antiquewhite", "#FAEBD7"],
                               ["aqua", "#00FFFF"],
                               ["aquamarine", "#7FFFD4"],
                               ["azure", "#F0FFFF"],
                               ["beige", "#F5F5DC"],
                               ["bisque", "#FFE4C4"],
                               ["black", "#000000"],
                               ["blanchedalmond", "#FFEBCD"],
                               ["blue", "#0000FF"],
                               ["blueviolet", "#8A2BE2"],
                               ["brown", "#A52A2A"],
                               ["burlywood", "#DEB887"],
                               ["cadetblue", "#5F9EA0"],
                               ["chartreuse", "#7FFF00"],
                               ["chocolate", "#D2691E"],
                               ["coral", "#FF7F50"],
                               ["cornflowerblue", "#6495ED"],
                               ["cornsilk", "#FFF8DC"],
                               ["crimson", "#DC143C"],
                               ["cyan", "#00FFFF"],
                               ["darkblue", "#00008B"],
                               ["darkcyan", "#008B8B"],
                               ["darkgoldenrod", "#B8860B"],
                               ["darkgray", "#A9A9A9"],
                               ["darkgreen", "#006400"],
                               ["darkkhaki", "#BDB76B"],
                               ["darkmagenta", "#8B008B"],
                               ["darkolivegreen", "#556B2F"],
                               ["darkorange", "#FF8C00"],
                               ["darkorchid", "#9932CC"],
                               ["darkred", "#8B0000"],
                               ["darksalmon", "#E9967A"],
                               ["darkseagreen", "#8FBC8F"],
                               ["darkslateblue", "#483D8B"],
                               ["darkslategray", "#2F4F4F"],
                               ["darkturquoise", "#00CED1"],
                               ["darkviolet", "#9400D3"],
                               ["deeppink", "#FF1493"],
                               ["deepskyblue", "#00BFFF"],
                               ["dimgray", "#696969"],
                               ["dodgerblue", "#1E90FF"],
                               ["firebrick", "#B22222"],
                               ["floralwhite", "#FFFAF0"],
                               ["forestgreen", "#228B22"],
                               ["fuchsia", "#FF00FF"],
                               ["gainsboro", "#DCDCDC"],
                               ["ghostwhite", "#F8F8FF"],
                               ["gold", "#FFD700"],
                               ["goldenrod", "#DAA520"],
                               ["gray", "#808080"],
                               ["green", "#008000"],
                               ["greenyellow", "#ADFF2F"],
                               ["honeydew", "#F0FFF0"],
                               ["hotpink", "#FF69B4"],
                               ["indianred", "#CD5C5C"],
                               ["indigo", "#4B0082"],
                               ["ivory", "#FFFFF0"],
                               ["khaki", "#F0E68C"],
                               ["lavender", "#E6E6FA"],
                               ["lavenderblush", "#FFF0F5"],
                               ["lawngreen", "#7CFC00"],
                               ["lemonchiffon", "#FFFACD"],
                               ["lightblue", "#ADD8E6"],
                               ["lightcoral", "#F08080"],
                               ["lightcyan", "#E0FFFF"],
                               ["lightgoldenrodyellow", "#FAFAD2"],
                               ["lightgray", "#D3D3D3"],
                               ["lightgreen", "#90EE90"],
                               ["lightpink", "#FFB6C1"],
                               ["lightsalmon", "#FFA07A"],
                               ["lightseagreen", "#20B2AA"],
                               ["lightskyblue", "#87CEFA"],
                               ["lightslategray", "#778899"],
                               ["lightsteelblue", "#B0C4DE"],
                               ["lightyellow", "#FFFFE0"],
                               ["lime", "#00FF00"],
                               ["limegreen", "#32CD32"],
                               ["linen", "#FAF0E6"],
                               ["magenta", "#FF00FF"],
                               ["maroon", "#800000"],
                               ["mediumaquamarine", "#66CDAA"],
                               ["mediumblue", "#0000CD"],
                               ["mediumorchid", "#BA55D3"],
                               ["mediumpurple", "#9370DB"],
                               ["mediumseagreen", "#3CB371"],
                               ["mediumslateblue", "#7B68EE"],
                               ["mediumspringgreen", "#00FA9A"],
                               ["mediumturquoise", "#48D1CC"],
                               ["mediumvioletred", "#C71585"],
                               ["midnightblue", "#191970"],
                               ["mintcream", "#F5FFFA"],
                               ["mistyrose", "#FFE4E1"],
                               ["moccasin", "#FFE4B5"],
                               ["navajowhite", "#FFDEAD"],
                               ["navy", "#000080"],
                               ["oldlace", "#FDF5E6"],
                               ["olive", "#808000"],
                               ["olivedrab", "#6B8E23"],
                               ["orange", "#FFA500"],
                               ["orangered", "#FF4500"],
                               ["orchid", "#DA70D6"],
                               ["palegoldenrod", "#EEE8AA"],
                               ["palegreen", "#98FB98"],
                               ["paleturquoise", "#AFEEEE"],
                               ["palevioletred", "#DB7093"],
                               ["papayawhip", "#FFEFD5"],
                               ["peachpuff", "#FFDAB9"],
                               ["peru", "#CD853F"],
                               ["pink", "#FFC0CB"],
                               ["plum", "#DDA0DD"],
                               ["powderblue", "#B0E0E6"],
                               ["purple", "#800080"],
                               ["rebeccapurple", "#663399"],
                               ["red", "#FF0000"],
                               ["rosybrown", "#BC8F8F"],
                               ["royalblue", "#4169E1"],
                               ["saddlebrown", "#8B4513"],
                               ["salmon", "#FA8072"],
                               ["sandybrown", "#F4A460"],
                               ["seagreen", "#2E8B57"],
                               ["seashell", "#FFF5EE"],
                               ["sienna", "#A0522D"],
                               ["silver", "#C0C0C0"],
                               ["skyblue", "#87CEEB"],
                               ["slateblue", "#6A5ACD"],
                               ["slategray", "#708090"],
                               ["snow", "#FFFAFA"],
                               ["springgreen", "#00FF7F"],
                               ["steelblue", "#4682B4"],
                               ["tan", "#D2B48C"],
                               ["teal", "#008080"],
                               ["thistle", "#D8BFD8"],
                               ["tomato", "#FF6347"],
                               ["turquoise", "#40E0D0"],
                               ["violet", "#EE82EE"],
                               ["wheat", "#F5DEB3"],
                               ["white", "#FFFFFF"],
                               ["whitesmoke", "#F5F5F5"],
                               ["yellow", "#FFFF00"],
                               ["yellowgreen", "#9ACD32"]])

/**
 * rgb regex to handle "rgb([0-255],[0-255],[0-255])" color strings
 * @type {RegExp}
 */
const rgbRegex = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)\s*$/i

/**
 * rgba regex to handle "rgba([0-255],[0-255],[0-255],[0.0-1.0])" color strings
 * @type {RegExp}
 */
const rgbaRegex = /^rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([0,1](?:\.\d*)?)\s*\)\s*$/i

/**
 * hex regex to handle "#[00-FF][00-FF][00-FF]" color strings.
 * @type {RegExp}
 */
const hexRegex = /^#([0-9,a-f,A-F]{2})([0-9,a-f,A-F]{2})([0-9,a-f,A-F]{2})\s*$/i

/**
 * Extracts an opacity from an rgba color packed into a 32-bit integer
 * @param  {number} packedRgbaColor
 * @return {number}                 opacity extracted in range of [0,1]
 */
function getOpacity(packedRgbaColor) {
  return (packedRgbaColor & 0xFF) / 255.0
}

/**
 * packs an opacity value [0,1] into an 8-bit integer to be packed
 * into a 32-bit int
 * @param  {number} opacity [0,1]
 * @return {number}         [0,255]
 */
function packOpacity(opacity) {
  return Math.floor(Math.clamp01(opacity) * 255)
}

/**
 * Given a color packed into a 32-bit integer, returns a css-style "rgba()" string
 * @param  {number} packedRgbaColor
 * @return {string}                 int the form "rgba([0,255],[0,255],[0,255],[0,1])"
 */
function getRGBAString(packedRgbaColor) {
  return `rgba(${(packedRgbaColor) >>> 24}, ${(packedRgbaColor & 0xFF0000) >> 16}, ${(packedRgbaColor & 0xFF00) >> 8}, ${getOpacity(packedRgbaColor)})`
}

/**
 * Given an rgba() color string, extracts a numeric color packed into a 32-bit int
 * @param  {string} color
 * @return {number}
 */
function getPackedColorRGBAFromString(color) {
  if (typeof color !== "string") {
    throw new Error(`${color} is not a valid color string`)
  }

  let packedColor = 0

  let match = null
  if ((match = color.match(rgbRegex))) {
    packedColor = 255 // (fully opaque)
    packedColor |= Math.clamp(Number.parseInt(match[3], 10), 0, 255) << 8
    packedColor |= Math.clamp(Number.parseInt(match[2], 10), 0, 255) << 16
    packedColor |= Math.clamp(Number.parseInt(match[1], 10), 0, 255) << 24
  } else if ((match = color.match(rgbaRegex))) {
    packedColor = packOpacity(Number.parseFloat(match[4], 10))
    packedColor |= Math.clamp(Number.parseInt(match[3], 10), 0, 255) << 8
    packedColor |= Math.clamp(Number.parseInt(match[2], 10), 0, 255) << 16
    packedColor |= Math.clamp(Number.parseInt(match[1], 10), 0, 255) << 24
  } else if ((match = color.match(hexRegex))) {
    packedColor = 255 // (fully opaque)
    packedColor |= Math.clamp(Number.parseInt(match[3], 16), 0, 255) << 8
    packedColor |= Math.clamp(Number.parseInt(match[2], 16), 0, 255) << 16
    packedColor |= Math.clamp(Number.parseInt(match[1], 16), 0, 255) << 24
  } else if (colorKeywords.has(color)) {
    match = colorKeywords.get(color).match(hexRegex)
    packedColor = 255 // (fully opaque)
    packedColor |= Math.clamp(Number.parseInt(match[3], 16), 0, 255) << 8
    packedColor |= Math.clamp(Number.parseInt(match[2], 16), 0, 255) << 16
    packedColor |= Math.clamp(Number.parseInt(match[1], 16), 0, 255) << 24
  } else {
    throw new Error(`${color} is not a valid color string`)
  }

  return packedColor
}

/** @class manages colors in the RGBA color space. Can also be used as a mixin */
export default class ColorRGBA {
  /**
   * Creates a new color in the RGBA color space
   * @param  {string}    initColorStr color string in the form "rgb()", "rgba()", "#......", or a color keyword (i.e. "red")
   * @param  {...object} args         Additional arguments that may be passed to other initializers/constructors
   *                                  if this class is used as a base class or mixin
   * @return {ColorRGBA}
   */
  constructor(initColorStr, ...args) {
    this.initializer(initColorStr, ...args)
  }

  /**
   * initializes a color in the RGBA color space using a color string
   * @param  {string} initColorStr initializer string in the form "rgb()", "rgba()", "#......", or color keyword
   */
  initializer(initColorStr) {
    this._color = 0
    if (initColorStr) {
      this.value = initColorStr
    }
  }

  /**
   * sets all the channels of the RGBA color given a color string
   * @param  {string} color color string in the form "rgb()", "rgba()", "#......", or color keyword
   * @return {ColorRGBA}
   */
  set value(color) {
    this._color = getPackedColorRGBAFromString(color)
    return this
  }

  /**
   * Gets the rgba color as a color string "rgba()"
   * @return {string} rgba color as a string
   */
  get value() {
    return getRGBAString(this._color)
  }

  /**
   * Sets the value of the RGBA color packed as a 32-bit int
   * @param  {number} packedColor
   * @return {ColorRGBA}
   */
  set packedValue(packedColor) {
    this._color = 0
    this._color |= packedColor
    return this
  }

  /**
   * Gets the current value of the RGBA color as a packed 32-bit int
   * @return {number}
   */
  get packedValue() {
    return this._color
  }

  /**
   * sets the opacity of the RGBA color (modifies alpha channel only)
   * @param  {number} opacity [0,1]
   * @return {ColorRGBA}
   */
  set opacity(opacity) {
    if (typeof opacity !== "number") {
      throw new Error("Opacity must be a number between 0-1")
    }

    const currOpacity = this._color & 0xFF
    const newOpacity = packOpacity(opacity)
    if (newOpacity !== currOpacity) {
      this._color &= 0xFFFFFF00
      this._color |= newOpacity
    }
    return this
  }

  /**
   * Gets the current opacity (alpha channel) of the RGBA color
   * @return {number} [0,1]
   */
  get opacity() {
    return getOpacity(this._color)
  }

  /**
   * Returns true if the current opacity of the rgba color < 1
   * @return {Boolean}
   */
  isTransparent() {
    return getOpacity(this._color) < 1.0
  }
}

/**
 * Creates a new color RGBA class that fires events whenever the color
 * is changed externally
 * @param  {string} eventName Event type to fire when color is modified
 * @param  {string} colorName Name of the color attribute. This string is used in the event object fired
 * @return {function}         New class constructor function
 */
export function createEventedColorRGBAClass(eventName, colorName) {

  /**
   * @class New rgba color class that fires events when modified
   * @extends {ColorRGBA}
   */
  return class EventedColorRGBA extends ColorRGBA {
    /**
     * Color modification event
     * @event EventedColor#changed
     * @type {object}
     * @property {string} attr Name of the attribute modified
     * @property {} prevVal Previous value of the attribute prior to modification
     * @property {} currVal Value of the attribute post modification
     */

    /**
     * Initializes the evented color
     * @param  {string} initColorStr initial color as string
     * @param  {EventHandler} eventHandler Event handler instance used to manage the color
     *                                     modification events
     * @protected
     */
    initializer(initColorStr, eventHandler) {
      this._eventHandler = eventHandler
      super.initializer(initColorStr)
    }

    /**
     * Validates modification of the rgba color, and if modified, fires
     * modification events
     * @param  {number} newPackedColor Color defined by a 32-bit int
     * @private
     */
    _checkPackedColorChanged(newPackedColor) {
      if (newPackedColor !== this._color) {
        const prev = this._color
        const prevOpacity = getOpacity(prev)
        const opacity = getOpacity(newPackedColor)
        this._color = newPackedColor

        this._eventHandler.fire(eventName, {
          attr: colorName,
          prevVal: getRGBAString(prev),
          currVal: getRGBAString(this._color)
        })

        if (opacity !== prevOpacity) {
          this._eventHandler.fire(eventName, {
            attr: "opacity",
            prevVal: prevOpacity,
            currVal: opacity
          })
        }
      }
    }

    /**
     * sets all the channels of the RGBA color from a color string
     * @param  {string} color color string in the form "rgb()", "rgba()", "#......", or color keyword
     * @fires  EventedColor#changed
     * @return {ColorRGBA}
     */
    set value(color) {
      const tmpcolor = getPackedColorRGBAFromString(color)
      this._checkPackedColorChanged(tmpcolor)
      return this
    }

    /**
     * Gets the rgba color as a color string "rgba()"
     * @return {string} rgba color as a string
     */
    get value() {
      return getRGBAString(this._color)
    }

    /**
     * Sets the value of the RGBA color packed as a 32-bit int
     * @param  {number} packedColor
     * @fires  EventedColor#changed
     * @return {ColorRGBA}
     */
    set packedValue(packedColor) {
      let tmpcolor = 0
      tmpcolor |= packedColor
      this._checkPackedColorChanged(tmpcolor)
      return this
    }

    /**
     * Gets the current value of the RGBA color as a packed 32-bit int
     * @return {number}
     */
    get packedValue() {
      return this._color
    }

    /**
     * sets the opacity of the RGBA color (modifies alpha channel only)
     * @param  {number} opacity [0,1]
     * @fires  EventedColor#changed
     * @return {ColorRGBA}
     */
    set opacity(opacity) {
      if (typeof opacity !== "number") {
        throw new Error("Opacity must be a number between 0-1")
      }

      const currOpacity = this._color & 0xFF
      const newOpacity = packOpacity(opacity)
      if (newOpacity !== currOpacity) {
        this._color &= 0xFFFFFF00
        this._color |= newOpacity

        this._eventHandler.fire(eventName, {
          attr: "opacity",
          prevVal: currOpacity / 255.0,
          currVal: newOpacity / 255.0
        })
      }
      return this
    }

    /**
     * Gets the current opacity (alpha channel) of the RGBA color
     * @return {number} [0,1]
     */
    get opacity() {
      return getOpacity(this._color)
    }
  }
}
