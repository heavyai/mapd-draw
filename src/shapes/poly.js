"use strict"

import * as AABox2d from "../core/aabox2d"
import * as Point2d from "../core/point2d"
import BaseShape from "./base-shape.js"
import {
  mat2d as Mat2d
} from "gl-matrix"
import Math from "../math/math"
import {
  simpleHull_2D
} from "../math/convex-hull"
import PolyLine from "./poly-line"

function isArray(obj) {
  return Array.isArray(obj) || (ArrayBuffer && ArrayBuffer.isView(obj))
}

export default class Poly extends PolyLine {
  constructor(opts) {
    super(opts)
    if (this._verts.length < 3) {
      throw new Error("Poly shapes must be initialized with an array of 2d points and contain at least 3 points")
    }
  }

  removeVert(vertIndex) {
    if (this._verts.length < 3) {
      throw new Error(`Cannot remove vertex ${vertIndex}. It would result in a poly with < 3 points. A poly must contain at least 3 points.`)
    }

    super.removeVert(vertIndex)
  }


  _draw(ctx) {
    let rtn = false
    if (this._verts.length >= 3) {
      ctx.moveTo(this._verts[0][0], this._verts[0][1])
      for (let i = 1; i < this._verts.length; i += 1) {
        ctx.lineTo(this._verts[i][0], this._verts[i][1])
      }
      ctx.closePath()
      rtn = true
    }
    return rtn
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      type: "Poly" // NOTE: this much match the name of the class
                   // This is also supplied after the super.toJSON()
                   // so that this type overrides the parent class's
                   // type
    })
  }
}
