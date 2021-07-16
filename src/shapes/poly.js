"use strict"

import PolyLine from "./poly-line"
import * as Point2d from "../core/point2d"

const Constants = {
  MINIMUM_POINTS: 3
}

export default class Poly extends PolyLine {
  constructor(opts) {
    super(opts)
    if (this._verts.length < Constants.MINIMUM_POINTS) {
      throw new Error(
        "Poly shapes must be initialized with an array of 2d points and contain at least 3 points"
      )
    }
  }

  removeVert(vertIndex) {
    if (this._verts.length < Constants.MINIMUM_POINTS) {
      throw new Error(
        `Cannot remove vertex ${vertIndex}. It would result in a poly with < 3 points. A poly must contain at least 3 points.`
      )
    }

    super.removeVert(vertIndex)
  }

  _draw(ctx) {
    let rtn = false
    if (this._verts.length >= Constants.MINIMUM_POINTS) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const proj_pt = Point2d.create()
      Point2d.transformMat2d(proj_pt, this._verts[0], this._fullXform)
      ctx.moveTo(proj_pt[0], proj_pt[1])
      for (let i = 1; i < this._verts.length; i += 1) {
        Point2d.transformMat2d(proj_pt, this._verts[i], this._fullXform)
        ctx.lineTo(proj_pt[0], proj_pt[1])
      }
      ctx.closePath()
      rtn = true
    }
    return rtn
  }

  // eslint-disable-next-line indent
  toJSON() {
    return Object.assign(super.toJSON(), {
      /* eslint-disable  indent */
      type: "Poly" // NOTE: this much match the name of the class
      // This is also supplied after the super.toJSON()
      // so that this type overrides the parent class's
      // type
      /* eslint-enable indent */
    })
  }
}
