"use strict"

import { mat2d as Mat2d } from "gl-matrix"
import { EPSILON } from "./configure"

/**
 * Overwrites https://github.com/toji/gl-matrix/blob/v3.3.0/src/vec2.js#L524
 * since there is no way to configure the global epsilon used for floating pt
 * comparisons.
 *
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @param {Number} [epsilon=null] Optional epsilon value to use for the comparison. If null, uses
 *                                the globally-configured epsilon.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
Mat2d.equals = function equals(a, b, epsilon = null) {
  const a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5]
  const b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5]
  const eps = epsilon !== null ? epsilon : EPSILON
  return (
    Math.abs(a0 - b0) <= eps * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
    Math.abs(a1 - b1) <= eps * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
    Math.abs(a2 - b2) <= eps * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
    Math.abs(a3 - b3) <= eps * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
    Math.abs(a4 - b4) <= eps * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
    Math.abs(a5 - b5) <= eps * Math.max(1.0, Math.abs(a5), Math.abs(b5))
  )
}

/**
 * Singular value decomposition
 * See: http://math.stackexchange.com/questions/861674/decompose-a-2d-arbitrary-transform-into-only-scaling-and-rotation
 */

/**
 * Calculates the singular value decomposition to extract the
 * scale, rotation, and translation from a 2x3 matrix.
 * Any matrix built by affine transformations can be decomposed
 * into a rotation*scale*rotation*translation
 * See: http://math.stackexchange.com/questions/861674/decompose-a-2d-arbitrary-transform-into-only-scaling-and-rotation
 * @param  {Vec2d} outTranslate Vector to hold the translation components
 * @param  {Vec2d} outScale     Vector to hold the x,y scale components
 * @param  {Vec2d} outRotate    Vector to hold the rotation components
 * @param  {Mat2d} mat          Matrix to decompose
 */
Mat2d.svd = (outTranslate, outScale, outRotate, mat) => {
  if (outTranslate) {
    outTranslate[0] = mat[4]
    outTranslate[1] = mat[5]
  }
  if (outScale || outRotate) {
    const E = (mat[0] + mat[3]) / 2.0
    const F = (mat[0] - mat[3]) / 2.0
    const G = (mat[1] + mat[2]) / 2.0
    const H = (mat[1] - mat[2]) / 2.0
    if (outScale) {
      const Q = Math.sqrt(E * E + H * H)
      const R = Math.sqrt(F * F + G * G)
      outScale[0] = Q + R
      outScale[1] = Q - R
    }
    if (outRotate) {
      const a1 = Math.atan2(G, F)
      const a2 = Math.atan2(H, E)
      outRotate[0] = (a2 - a1) / 2.0
      outRotate[1] = (a2 + a1) / 2.0
    }
  }
}

export default Mat2d
