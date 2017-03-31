"use strict"

import {mat2d as Mat2d} from "gl-matrix"

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
