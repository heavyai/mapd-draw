/* eslint-disable no-magic-numbers */
"use strict"

import * as AABox2d from "../core/aabox2d"
import * as Point2d from "../core/point2d"
import BaseShape from "./base-shape.js"
import {mat2d as Mat2d} from "gl-matrix"
import Math from "../math/math"
import {simpleHull_2D} from "../math/convex-hull"

const identityMatrix = Mat2d.create()

/**
 * Expands an axis-aligned bounding box to encapsulate a 2d vertex
 * defined in an array of vertices, and updates a struct used to
 * store the indices of the vertices that define the final bounds
 * of the vertices
 * @param  {AABox2d} box          Bounds to expand
 * @param  {Point2d} pt           2d vertex to encapsulate
 * @param  {number} ptIdx         Index of the vertex in its list of vertices
 * @param  {number[]} extentIndices Struct to store the indices of the bounding vertices
 * @private
 */
function aaboxEncapsulatePt(box, pt, ptIdx, extentIndices) {
  if (AABox2d.isEmpty(box)) {
    box[0] = pt[0]
    box[2] = pt[0]
    extentIndices[0] = extentIndices[2] = ptIdx
    box[1] = pt[1]
    box[3] = pt[1]
    extentIndices[1] = extentIndices[3] = ptIdx
  } else {
    if (pt[0] < box[0]) {
      box[0] = pt[0]
      extentIndices[0] = ptIdx
    } else if (pt[0] > box[2]) {
      box[2] = pt[0]
      extentIndices[2] = ptIdx
    }

    if (pt[1] < box[1]) {
      box[1] = pt[1]
      extentIndices[1] = ptIdx
    } else if (pt[1] > box[3]) {
      box[3] = pt[1]
      extentIndices[3] = ptIdx
    }
  }
}

/**
 * Function called sequentially to calculate the centroid of a polygon
 * @param  {Point2d} centroidPt Current centroid point
 * @param  {Point2d} pt1        Point describing one end of an edge of a polygon
 * @param  {Point2d} pt2        Point describing other end of an edge of a polygon
 * @private
 */
function buildCentroid(centroidPt, pt1, pt2) {
  const a = pt1[0] * pt2[1] - pt2[0] * pt1[1]
  centroidPt[0] += (pt1[0] + pt2[0]) * a
  centroidPt[1] += (pt1[1] + pt2[1]) * a
  return a
}

/**
 * Utility function used to check whether an argument is an array
 * of an arraybuffer
 * @param  {}  obj
 * @return {Boolean}     Returns true if object is array-like
 */
function isArray(obj) {
  return Array.isArray(obj) || (ArrayBuffer && ArrayBuffer.isView(obj))
}

/**
 * @typedef {object} PolyLineOptions
 * @property {number[]|Point2d[]} [verts=[]] Initial vertices of the polyline
 */

/**
 * @class Class defining a poly line
 * @extends {BaseShape}
 */
export default class PolyLine extends BaseShape {

  /**
   * Creates a new poly line shape
   * @param  {PolyLineOptions} [opts] [description]
   * @return {PolyLine}
   */
  constructor(opts) {
    const verts = opts.verts || []
    super(opts)
    if (!isArray(verts) ||
      verts.length === 0 || (isArray(verts[0]) && verts.length < 1) ||
      (!isArray(verts[0]) && (verts.length < 2 || verts.length % 2 !== 0))) {
      throw new Error("PolyLine shapes must be initialized with an array of 2d points and contain at least 1 points")
    }

    // going to build the aabox and store the indices for each vertex
    // that defines the bounds
    this._extentIndices = [-1, -1, -1, -1]
    this._localaabox = AABox2d.create()
    this._verts = []
    this._centroid = [0, 0]
    AABox2d.initEmpty(this._aabox)
    let signedArea = 0
    let i = 0
    if (isArray(verts[0])) {
      for (i = 0; i < verts.length - 1; i += 1) {
        this._verts.push(Point2d.clone(verts[i]))
        aaboxEncapsulatePt(this._aabox, verts[i], i, this._extentIndices)
        signedArea += buildCentroid(this._centroid, verts[i], verts[i + 1])
      }
      this._verts.push(Point2d.clone(verts[i]))
      aaboxEncapsulatePt(this._aabox, verts[i], i, this._extentIndices)
      signedArea += buildCentroid(this._centroid, verts[i], verts[0])
    } else {
      this._verts.push(Point2d.create(verts[0], verts[1]))
      aaboxEncapsulatePt(this._aabox, this._verts[0], 0, this._extentIndices)
      let idx = 1
      for (i = 2; i < verts.length - 2; i += 2, idx += 1) {
        this._verts.push(Point2d.create(verts[i], verts[i + 1]))
        aaboxEncapsulatePt(this._aabox, this._verts[idx], idx, this._extentIndices)
        signedArea += buildCentroid(this._centroid, this._verts[idx - 1], this._verts[idx])
      }
      this._verts.push(Point2d.create(verts[i], verts[i + 1]))
      aaboxEncapsulatePt(this._aabox, this._verts[idx], idx, this._extentIndices)
      signedArea += buildCentroid(this._centroid, this._verts[idx], this._verts[0])
    }
    signedArea *= 0.5
    this._centroid[0] /= 6.0 * signedArea
    this._centroid[1] /= 6.0 * signedArea

    // extract the center of the aabox. We are going to use this as the
    // shape's pivot, so all rotation/scale transformations will be sourced
    // at this location
    const pivot = Point2d.create()
    AABox2d.getCenter(pivot, this._aabox)
    this.pivot = pivot

    // now build the convex hull of the vertices.
    // When rebuilding the axis aligned box (a transform is applied for example),
    // there's no need to traverse all the points. All we need to do is traverse
    // the points that define the convex hull to rebuild the bounds
    if (this._verts.length < 3) {
      this._convexHull = this._verts.map((val, idx) => idx)
    } else {
      this._convexHull = simpleHull_2D(this._verts)
    }
  }

  /**
   * Get the untransformed width/height of the polyline. This is essentially
   * the width/height of the poly's bounds
   * @return {Vec2d} Width/height of the bounds of the polyline
   */
  getDimensions() {
    return [this.width, this.height]
  }

  /**
   * Get the untransformed width of the polyline. This is the width of the
   * axis-aligned bounds of the poly
   * @return {number} Width of the poly in world-space units
   */
  get width() {
    this._updateAABox()
    if (!this._verts.length || this._extentIndices[0] < 0 || this._extentIndices[2] < 0) {
      return 0
    }

    return this._verts[this._extentIndices[2]][0] - this._verts[this._extentIndices[0]][0]
  }

  /**
   * Gets the untransformed height of the polyline. This is the height of the axis-aligned
   * bounds of the poly
   * @return {number} Height of the poly in world-space units
   */
  get height() {
    this._updateAABox()
    if (!this._verts.length || this._extentIndices[0] < 0 || this._extentIndices[2] < 0) {
      return 0
    }

    return this._verts[this._extentIndices[3]][1] - this._verts[this._extentIndices[1]][1]
  }

  /**
   * Gets a reference to the vertex array of the polyline
   * @return {Point2d[]}
   * @readOnly
   */
  get vertsRef() {
    return this._verts
  }

  /**
   * Gets the number of vertices in the polyline
   * @return {number}
   */
  get numVerts() {
    return this._verts.length
  }

  /**
   * Utility function that collapses all the verts, meaning the verts
   * are flattened to their position with local-space transforms applied
   * and then the local transforms are cleared. This is done whenever
   * the vertices of the polygon are modified as it can be a little tricky
   * to re-adjust the pivot/transforms of the vert when new verts are added,
   * deleted, etc.
   * @return {boolean} Returns true if the points were indeed flattened
   *                   The points wouldn't be flattened if there are no
   *                   transforms to apply, for example
   * @private
   */
  _collapseVerts() {
    Point2d.set(this._pivot, 0, 0)

    // TODO(croot): what if this poly is
    // parented to another transform?

    const xform = this.localXform
    if (Mat2d.equals(xform, identityMatrix)) {
      // if there are no transforms to apply,
      // do nothing - fast out
      return false
    }

    AABox2d.initEmpty(this._aabox)

    // flatten all the points to their current world-space position
    // with transforms applied
    for (let i = 0; i < this._verts.length; i += 1) {
      Point2d.transformMat2d(this._verts[i], this._verts[i], xform)
    }

    // now recalcute the convex hull of all the transformed points
    if (this._verts.length < 3) {
      this._convexHull = this._verts.map((val, idx) => idx)
    } else {
      this._convexHull = simpleHull_2D(this._verts)
    }
    // use the convex hull points to rebuild the bounds
    this._convexHull.forEach(idx => {
      aaboxEncapsulatePt(this._aabox, this._verts[idx], idx, this._extentIndices)
    })

    // reset the local transforms
    this.setTransformations(0, 0, 1, 1, 0)

    return true
  }

  /**
   * Translates a specific vertex of the polygon by an offset
   * @param  {number} vertIndex Index of the vertex to translate
   * @param  {Vec2d} t         Translation offset, in world-space units
   * @return {PolyLine}           this
   * @fires {Shape#geomChanged}
   * @throws {Error} If vertIndex is invalid.
   */
  translateVert(vertIndex, t) {
    if (vertIndex >= this._verts.length) {
      throw new Error(`Cannot translate vertex at index ${vertIndex}. There are only ${this._verts.length} vertices in the polygon.`)
    }

    if (t[0] || t[1]) {
      const prev = Point2d.clone(this._verts[vertIndex])
      const newPt = Point2d.clone(this._verts[vertIndex])
      Point2d.addVec2(newPt, newPt, t)

      // TODO(croot): this could be made smarter by determining whether
      // this point affects the convex hull or not by checking it's relationship
      // with its neighbors
      this._collapseVerts()
      this._resetAABox = true
      this._geomDirty = true
      Point2d.copy(newPt)
      this.fire("changed:geom", {
        attr: `verts[${vertIndex}]`,
        prevVal: prev,
        currVal: newPt
      })
    }
    return this
  }

  setVertPosition(vertIndex, pos) {
    if (vertIndex >= this._verts.length) {
      throw new Error(`Cannot translate vertex at index ${vertIndex}. There are only ${this._verts.length} vertices in the polygon.`)
    }

    if (!Point2d.equals(pos, this._verts[vertIndex])) {
      const prev = Point2d.clone(this._verts[vertIndex])
      this._collapseVerts()
      Point2d.copy(this._verts[vertIndex], pos)

      // TODO(croot): this could be made smarter by determining whether
      // this point affects the convex hull or not by checking it's relationship
      // with its neighbors
      this._resetAABox = true
      this._geomDirty = true
      this.fire("changed:geom", {
        attr: `verts[${vertIndex}]`,
        prevVal: prev,
        currVal: pos
      })
    }
  }

  insertVert(vertIndex, pos) {
    let idx = Math.min(Math.max(vertIndex, 0), this._verts.length)
    this._collapseVerts()
    if (vertIndex >= this._verts.length) {
      this._verts.push(Point2d.clone(pos))
      idx = this._verts.length - 1
    } else {
      this._verts.splice(vertIndex, 0, Point2d.clone(pos))
    }
    this._resetAABox = true
    this._geomDirty = true

    this.fire("changed:geom:addvert", {
      attr: `verts[${idx}]`,
      currVal: pos
    })

    return idx
  }

  appendVert(pos) {
    return this.insertVert(this._verts.length, pos)
  }

  removeVert(vertIndex) {
    if (vertIndex >= this._verts.length || vertIndex < 0) {
      throw new Error(`Cannot remove vertex ${vertIndex}. Invalid index. There are only ${this._verts.length} vertices in the shape.`)
    }

    const pos = this._verts[vertIndex]
    this._verts.splice(vertIndex, 1)
    this._collapseVerts()
    this._resetAABox = true
    this._geomDirty = true

    this.fire("changed:geom:removevert", {
      attr: `verts[${vertIndex}]`,
      currVal: pos
    })

    return vertIndex
  }

  _rebuildAABox() {
    AABox2d.initEmpty(this._aabox)
    if (this._verts.length < 3) {
      this._convexHull = this._verts.map((val, idx) => idx)
    } else {
      this._convexHull = simpleHull_2D(this._verts)
    }
    this._convexHull.forEach(idx => {
      aaboxEncapsulatePt(this._aabox, this._verts[idx], idx, this._extentIndices)
    })

    const pivot = Point2d.create(0, 0)
    AABox2d.getCenter(pivot, this._aabox)
    this.pivot = pivot
  }

  _updateAABox() {
    if (this._resetAABox) {
      this._rebuildAABox()
      this._resetAABox = false
    }

    if (this._boundsOutOfDate || this._geomDirty) {
      AABox2d.initEmpty(this._aabox)
      const tmppt = [0, 0]
      const xform = this.globalXform
      this._convexHull.forEach(idx => {
        AABox2d.encapsulatePt(this._aabox, this._aabox, Point2d.transformMat2d(tmppt, this._verts[idx], xform))
      })
      this._boundsOutOfDate = false

      if (this._geomDirty) {
        const pivot = Point2d.create()
        pivot[0] = this._verts[this._extentIndices[0]][0] + 0.5 * (this._verts[this._extentIndices[2]][0] - this._verts[this._extentIndices[0]][0])
        pivot[1] = this._verts[this._extentIndices[1]][1] + 0.5 * (this._verts[this._extentIndices[3]][1] - this._verts[this._extentIndices[1]][1])
        this.pivot = pivot
        this._geomDirty = false
      }
    }
  }

  _draw(ctx) {
    let rtn = false
    if (this._verts.length >= 2) {
      ctx.moveTo(this._verts[0][0], this._verts[0][1])
      for (let i = 1; i < this._verts.length; i += 1) {
        ctx.lineTo(this._verts[i][0], this._verts[i][1])
      }
      rtn = true
    }
    return rtn
  }

  toJSON() {
    return Object.assign({
      type: "PolyLine", // NOTE: this much match the name of the class
      verts: this.vertsRef.map(vert => [vert[0], vert[1]])
    }, super.toJSON())
  }

}

PolyLine.aaboxEncapsulatePt = aaboxEncapsulatePt
