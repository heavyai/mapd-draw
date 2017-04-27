"use strict"

import aggregation from "../util/aggregation"
import FillStyle from "../style/fill-style"
import StrokeStyle from "../style/stroke-style"

/**
 * @class  Basic shape style for a 2d rendering context
 * @extends {FillStyle}
 * @extends {StrokeStyle}
 */
export default class BasicStyle extends aggregation(class BaseBasicStyle {}, FillStyle, StrokeStyle) {
  /**
   * Copies the properties from one BasicStyle to another
   * @param  {BasicStyle} srcBasicStyle The style to copy from
   * @param  {BasicStyle} dstBasicStyle The style to copy to
   */
  static copyBasicStyle(srcBasicStyle, dstBasicStyle) {
    FillStyle.copyFillStyle(srcBasicStyle, dstBasicStyle)
    StrokeStyle.copyStrokeStyle(srcBasicStyle, dstBasicStyle)
  }

  /**
   * Converts a BasicStyle instance to a JSON object
   * @param  {BasicStyle} basicStyleObj
   * @return {{fillColor   : string,
   *           strokeColor : string,
   *           strokeWidth : number,
   *           lineJoin    : string,
   *           lineCap     : string,
   *           dashPattern : number[],
   *           dashOffset  : number
   *          }}
   */
  static toJSON(basicStyleObj) {
    return Object.assign(FillStyle.toJSON(basicStyleObj), StrokeStyle.toJSON(basicStyleObj))
  }
}
