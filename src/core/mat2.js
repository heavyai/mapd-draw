"use strict"

import { glMatrix, mat2 as Mat2 } from "gl-matrix"

/**
 * Overwrites https://github.com/toji/gl-matrix/blob/v3.3.0/src/mat2.js#L379
 * since there is no way to configure the global epsilon used for floating pt
 * comparisons.
 *
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {Vec2d} a The first vector.
 * @param {Vec2d} b The second vector.
 * @param {Number} [epsilon=null] Optional epsilon value to use for the comparison. If null, uses
 *                                the globally-configured epsilon.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
Mat2.equals = function(a, b, epsilon = null) {
  const a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3]
  const b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3]
  const eps = epsilon !== null ? epsilon : glMatrix.EPSILON
  return (
    Math.abs(a0 - b0) <= eps * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
    Math.abs(a1 - b1) <= eps * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
    Math.abs(a2 - b2) <= eps * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
    Math.abs(a3 - b3) <= eps * Math.max(1.0, Math.abs(a3), Math.abs(b3))
  )
}

export default Mat2
