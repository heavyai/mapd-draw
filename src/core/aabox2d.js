"use strict"

import {glMatrix, vec2 as Vec2d} from "gl-matrix"

export const MINX = 0
export const MINY = 1
export const MAXX = 2
export const MAXY = 3

const Constants = {
  BOX_SIDES: 4
}

/**
 * Sets the boundaries of an existing 2d axis-aligned bounding box
 * If arguments are not supplied, the aabox is initialized as empty.
 * @param {AABox2d} out  AAbox2d to set
 * @param {Number} [minx = Infinity] Minimum x-axis value
 * @param {Number} [miny = Infinity] Minimum y-axis value
 * @param {Number} [maxx = -Infinity] Maximum x-axis value
 * @param {Number} [maxy = -Infinity] Maximum y-axis value
 * @return {AABox2d}    bounds referenced by out arg
 */
export function set(out, minx, miny, maxx, maxy) {
  out[MINX] = typeof minx === "number" ? minx : Infinity
  out[MINY] = typeof miny === "number" ? miny : Infinity
  out[MAXX] = typeof maxx === "number" ? maxx : -Infinity
  out[MAXY] = typeof maxy === "number" ? maxy : -Infinity
  return out
}

/**
 * Creates a new 2d axis-aligned bounding box object
 * with optional boundaries. If boundaries are not supplied,
 * the aabox is initialized as empty.
 * @param  {Number} [minx = Infinity] Minimum x-axis value
 * @param  {Number} [miny = Infinity] Minimum y-axis value
 * @param  {Number} [maxx = -Infinity] Maximum x-axis value
 * @param  {Number} [maxy = -Infinity] Maximum y-axis value
 * @return {AABox2d}      New AABox2d object
 */
export function create(minx, miny, maxx, maxy) {
  const out = new glMatrix.ARRAY_TYPE(Constants.BOX_SIDES)
  return set(out, minx, miny, maxx, maxy)
}

/**
 * Creates a new 2d axis-aligned bounding box with boundaries copied
 * from an existing aabox.
 * @param  {AABox2d} box existing bounds to copy boundaries from
 * @return {AABox2d}     new AABox2d object
 */
export function clone(box) {
  const out = new glMatrix.ARRAY_TYPE(Constants.BOX_SIDES)
  out[MINX] = box[MINX]
  out[MINY] = box[MINY]
  out[MAXX] = box[MAXX]
  out[MAXY] = box[MAXY]
  return out
}

/**
 * Copies the boundaries from one existing aabox to another.
 * @param  {AABox2d} out bounds to copy to
 * @param  {AABox2d} box bounds to copy from
 * @return {AABox2d}     bounds referenced by out arg
 */
export function copy(out, box) {
  out[MINX] = box[MINX]
  out[MINY] = box[MINY]
  out[MAXX] = box[MAXX]
  out[MAXY] = box[MAXY]
  return out
}

/**
 * Re-initializes an existing aabox as empty.
 * An aabox is empty if the minimum value in either of
 * its dimensions exceeds its respective max value.
 * In this case, the minumums will be set to +Infinity
 * and the maximums to -Infinity
 * @param  {AABox2d} out existing bounds to re-initialize as empty
 * @return {AABox2d}     bounds referenced by out arg
 */
export function initEmpty(out) {
  out[MINX] = Infinity
  out[MINY] = Infinity
  out[MAXX] = -Infinity
  out[MAXY] = -Infinity
  return out
}

/**
 * Re-initializes an existing aabox to infinity, ultimately encompassing
 * all numeric values.
 * @param  {AABox2d} out existing bounds to initialize to infinity
 * @return {AABox2d}     bounds referenced by out arg
 */
export function initInfinity(out) {
  out[MINX] = -Infinity
  out[MINY] = -Infinity
  out[MAXX] = Infinity
  out[MAXY] = Infinity
  return out
}

/**
 * Initializes an existing aabox with its top-left corner set to be the origin ([0, 0]),
 * an extends outwards in each dimension by its respective size.
 *   minx: 0
 *   miny: 0
 *   maxx: sizes[x]
 *   maxy: sizes[y]
 * @param  {AABox2d} out   existing bounds to re-initialize
 * @param  {Vec2d} sizes   new width/height of the bounds
 * @return {AABox2d}       bounds referenced by out arg
 */
export function initSizeFromOrigin(out, sizes) {
  if (sizes[0] < 0) {
    out[MINX] = -sizes[0]
    out[MAXX] = 0
  } else {
    out[MINX] = 0
    out[MAXX] = sizes[0]
  }
  if (sizes[1] < 0) {
    out[MINY] = -sizes[1]
    out[MAXY] = 0
  } else {
    out[MINY] = 0
    out[MAXY] = sizes[1]
  }
  return out
}

/**
 * Initializes an existing aabox with its top-left corner set to be an existing pt and with
 * bounds extending outwards in each dimension by its respective size.
 *   minx: pt[x]
 *   miny: pt[y]
 *   maxx: pt[x] + sizes[x]
 *   maxy: pt[y] + sizes[y]
 * @param  {AABox2d} out   existing bounds to re-initialize
 * @param  {Point2d} pt    new position of the top-left corner of the bounds
 * @param  {Vec2d} sizes   new width/height of the bounds
 * @return {AABox2d}       bounds referenced by out arg
 */
export function initSizeFromLocation(out, pt, sizes) {
  for (let i = 0; i < 2; i += 1) {
    if (sizes[i] < 0) {
      out[i] = pt[i] - sizes[i]
      out[i + 2] = pt[i]
    } else {
      out[i] = pt[i]
      out[i + 2] = pt[i] + sizes[i]
    }
  }
  return out
}

/**
 * Initializes an existing aabox with its center set to a specific pt and with bounds
 * extending outward in each dimension so that the aabox's width and height are a
 * specific size
 * @param  {AABox2d} out    existing bounds to re-initialize
 * @param  {Point2d} center new center of the bounds
 * @param  {Vec2d} sizes  new width/height of the bounds
 * @return {AABox2d}        bounds referenced by out arg
 */
export function initCenterExtents(out, center, sizes) {
  for (let i = 0; i < 2; i += 1) {
    if (sizes[i] < 0) {
      out[i] = center[i] + sizes[i]
      out[i + 2] = center[i] - sizes[i]
    } else {
      out[i] = center[i] - sizes[i]
      out[i + 2] = center[i] + sizes[i]
    }
  }
  return out
}

/**
 * Returns true if the aabox is empty
 * @param  {AABox2d}  box
 * @return {Boolean}     true if box is empty, false otherwise
 */
export function isEmpty(box) {
  return (box[MINX] > box[MAXX] || box[MINY] > box[MAXY])
}

/**
 * Returns true if an aabox is infinite in either dimension
 * @param  {AABox2d}  box Existing aabox to check
 * @return {Boolean}     True if box extends to +/- inifinity in either dimension, false otherwise
 */
export function isInfinite(box) {
  return !isFinite(box[MINX]) || !isFinite(box[MINY]) || !isFinite(box[MAXX]) || !isFinite(box[MAXY])
}

/**
 * Returns true if one aabox approximately equals another
 * @param  {AABox2d} a
 * @param  {AABox2d} b
 * @return {Boolean}   true if a ~= b
 */
export function equals(a, b) {
  const a0 = a[0]
  const a1 = a[1]
  const a2 = a[2]
  const a3 = a[3]
  const b0 = b[0]
  const b1 = b[1]
  const b2 = b[2]
  const b3 = b[3]
  return (Math.abs(a0 - b0) <= glMatrix.EPSILON && Math.abs(a1 - b1) <= glMatrix.EPSILON && Math.abs(a2 - b2) <= glMatrix.EPSILON && Math.abs(a3 - b3) <= glMatrix.EPSILON)
}

/**
 * Returns the width/height of an existing aabox
 * @param  {Vec2d} out 2d vector to store the width/height of an existing aabox
 * @param  {AABox2d} box bounds to extract the width/height from
 * @return {Vec2d}     vector referenced by the out arg
 */
export function getSize(out, box) {
  return Vec2d.set(out, box[MAXX] - box[MINX], box[MAXY] - box[MINY])
}

/**
 * Returns the extents of an existing aabox.
 * Extents is the size of a bounds in each dimension starting at the center
 * of the bounds. (i.e. extents = [width / 2, height / 2])
 * @param  {Vec2d} out 2d vector to store the extents of an existing aabox
 * @param  {AABox2d} box bounds to extract the extents from
 * @return {Vec2d}     vector referenced by the out arg
 */
export function getExtents(out, box) {
  getSize(out, box)
  return Vec2d.scale(out, out, 0.5) // eslint-disable-line no-magic-numbers
}

/**
 * Returns the center of an existing aabox
 * @param  {Point2d} out point to store the center of an existing bounds
 * @param  {AABox2d} box bounds to extract the center from
 * @return {Point2d}     point referenced by the out arg
 */
export function getCenter(out, box) {
  getExtents(out, box)
  out[MINX] += box[MINX]
  out[MINY] += box[MINY]
  return out
}

/**
 * Expands an existing aabox by a specified size in each dimension.
 * @param  {AABox2d} out        bounds to store the resulting operation in
 * @param  {AABox2d} box        starting bounds to expand
 * @param  {Vec2d} expandSize   size to expand in each dimension
 * @return {AABox2d}            bounds referenced by the out arg
 */
export function expand(out, box, expandSize) {
  out[MINX] = box[MINX] - expandSize[0]
  out[MAXX] = box[MAXX] + expandSize[0]
  out[MINY] = box[MINY] - expandSize[1]
  out[MAXY] = box[MAXY] + expandSize[1]
}

/**
 * Computes the area of an existing aabox
 * @param  {AABox2d} box
 * @return {Number}     area of the bounds
 */
export function area(box) {
  return (box[MAXX] - box[MINX]) * (box[MAXY] - box[MINY])
}

/**
 * Calculates the hull of two aaboxes. The hull is the smallest bounds that contains
 * both of the aaboxes
 * @param  {AABox2d} out bounds to store the resulting operation in
 * @param  {AABox2d} a
 * @param  {AABox2d} b
 * @return {AABox2d}     bounds referenced by out arg
 */
export function hull(out, a, b) {
  return create(Math.min(a[MINX], b[MINX]), Math.min(a[MINY], b[MINY]), Math.max(a[MAXX], b[MAXX]), Math.max(a[MAXY], b[MAXY]))
}

/**
 * Calculates the intersection of two existing bounds.
 * @param  {AABox2d} out bounds to store the resulting operation in
 * @param  {AABox2d} a
 * @param  {AABox2d} b
 * @return {AABox2d}     bounds referenced by out arg
 */
export function intersection(out, a, b) {
  let boxToUse = out
  if (out === a) {
    boxToUse = create()
  }

  let minindex = MINX
  let maxindex = MAXX
  for (; minindex <= MINY; minindex += 1, maxindex += 1) {
    if (a[maxindex] < b[minindex] || a[minindex] > b[maxindex]) {
      break
    }

    boxToUse[minindex] = Math.max(a[minindex], b[minindex])
    boxToUse[maxindex] = Math.min(a[maxindex], b[maxindex])
  }

  if (minindex !== MINY + 1) {
    initEmpty(boxToUse)
  }

  if (out === a) {
    copy(out, boxToUse)
  }

  return out
}

/**
 * Returns true if one bounds overlaps another in any way (non-inclusive).
 * @param  {AABox2d} a
 * @param  {AABox2d} b
 * @return {Boolean}   Returns true if a overlaps b, false otherwise
 */
export function overlaps(a, b) {
  return !(a[MAXX] <= b[MINX] || a[MINX] >= b[MAXX] || a[MAXY] <= b[MINY] || a[MINY] >= b[MAXY])
}

/**
 * Returns true if one bounds full contains another (inclusive).
 * @param  {AABox2d} a
 * @param  {AABox2d} b
 * @return {Boolean}   true if a fully contains b.
 */
export function contains(a, b) {
  return !(b[MINX] < a[MINX] || b[MAXX] > a[MAXX] || b[MINY] < a[MINY] || b[MAXY] > a[MAXY])
}

/**
 * Returns true if an existing bounds contains a specific point (inclusive)
 * @param  {AABox2d} box
 * @param  {Point2d} pt
 * @return {Boolean}     Returns true if pt is inside of box, false otherwise
 */
export function containsPt(box, pt) {
  return (pt[MINX] >= box[MINX] && pt[MINX] <= box[MAXX] && pt[MINY] >= box[MINY] && pt[MINY] <= box[MAXY])
}

/**
 * Extends an existing bounds so that it would contain a specific point
 * @param  {AABox2d} out Bounds containing the operation result
 * @param  {AABox2d} box Starting bounds to possibly extend
 * @param  {Point2d} pt  Point to encapsulate in box
 * @return {AAbox2d}     bounds referenced by out arg
 */
export function encapsulatePt(out, box, pt) {
  if (out !== box) {
    copy(out, box)
  }
  if (isEmpty(box)) {
    out[MINX] = pt[MINX]
    out[MAXX] = pt[MINX]
    out[MINY] = pt[MINY]
    out[MAXY] = pt[MINY]
  } else {
    if (pt[MINX] < out[MINX]) {
      out[MINX] = pt[MINX]
    } else if (pt[MINX] > out[MAXX]) {
      out[MAXX] = pt[MINX]
    }

    if (pt[MINY] < out[MINY]) {
      out[MINY] = pt[MINY]
    } else if (pt[MINY] > out[MAXY]) {
      out[MAXY] = pt[MINY]
    }
  }
  return out
}

/**
 * Translates an existing bounds by a specified offset it each dimension
 * @param  {AABox2d} out bounds resulting from the operation
 * @param  {AABox2d} box starting bounds
 * @param  {Vec2d} pos   translation in each dimension
 * @return {AABox2d}     bounds referenced by out arg
 */
export function translate(out, box, pos) {
  out[MINX] = box[MINX] + pos[0]
  out[MINY] = box[MINY] + pos[1]
  out[MAXX] = box[MAXX] + pos[0]
  out[MAXY] = box[MAXY] + pos[1]
}

function transform(out, box, mat, xformFunc) {
  let boxToUse = out
  if (out === box) {
    boxToUse = create()
  }
  initEmpty(boxToUse)

  const pt1 = Vec2d.set(Vec2d.create(), box[MINX], box[MINY])
  const pt2 = Vec2d.create()
  xformFunc(pt2, pt1, mat)
  encapsulatePt(boxToUse, boxToUse, pt2)
  pt1[MINX] = box[MAXX]
  xformFunc(pt2, pt1, mat)
  encapsulatePt(boxToUse, boxToUse, pt2)
  pt1[MINY] = box[MAXY]
  xformFunc(pt2, pt1, mat)
  encapsulatePt(boxToUse, boxToUse, pt2)
  pt1[MINX] = box[MINX]
  xformFunc(pt2, pt1, mat)
  encapsulatePt(boxToUse, boxToUse, pt2)
  if (out === box) {
    copy(out, boxToUse)
  }
  return out
}

/**
 * Transforms an existing bounds by a 2x2 matrix
 * @param  {AABox2d} out bounds to contain the operation result
 * @param  {AABox2d} box bounds to transform
 * @param  {Mat2} mat 2x2 matrix transformation
 * @return {AABox2d}     bounds referenced by out arg
 */
export function transformMat2(out, box, mat) {
  return transform(out, box, mat, Vec2d.transformMat2)
}

/**
 * Transforms an existing bounds by a 2x3 matrix.
 * A 2x3 matrix is a 2x2 matrix with a translation component.
 * @param  {AABox2d} out bounds to hold the operation result
 * @param  {AABox2d} box bounds to transform
 * @param  {Mat2d} mat   2x3 matrix
 * @return {AABox2d}     bounds referenced by out arg
 */
export function transformMat2d(out, box, mat) {
  return transform(out, box, mat, Vec2d.transformMat2d)
}
