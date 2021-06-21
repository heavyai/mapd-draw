"use strict"

import { glMatrix, vec2 as Vec2d } from "gl-matrix"

/**
 * Overwrites https://github.com/toji/gl-matrix/blob/v3.3.0/src/vec2.js#L524
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
Vec2d.equals = function(a, b, epsilon = null) {
  const a0 = a[0],
    a1 = a[1]
  const b0 = b[0],
    b1 = b[1]
  const eps = epsilon !== null ? epsilon : glMatrix.EPSILON
  return (
    Math.abs(a0 - b0) <= eps * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
    Math.abs(a1 - b1) <= eps * Math.max(1.0, Math.abs(a1), Math.abs(b1))
  )
}

/**
 * Returns the Z coordinate of a 2D crossproduct
 * @param  {Vec2d} v1
 * @param  {Vec2d} v2
 * @return {Number}    z coord of the 2D crossproduct
 */
Vec2d.cross2d = (v1, v2) => v1[0] * v2[1] - v1[1] * v2[0]

/**
 * Calculates the angle between two vectors when directionality
 * is unnecessary (only returns an angle between 0 and PI, inclusive)
 * @param  {Vec2d} v1
 * @param  {Vec2d} v2
 * @return {Number}    The angle between two vectors in radians [0, PI]
 */
Vec2d.angleFast = (v1, v2) => Math.acos(Vec2d.dot(v1, v2))

/**
 * Returns the true angle between two vectors
 * @param  {Vec2d} v1
 * @param  {Vec2d} v2
 * @return {Number}    The angle between two vectors in radians [-PI, PI]
 */
Vec2d.angle = (v1, v2) => {
  const c = Vec2d.dot(v1, v2)
  const s = Vec2d.cross2d(v1, v2)
  const angle = Math.atan2(s, c)
  return angle
}

/**
 * Returns the angle of a vector from the positive X direction
 * in a cartesian coordinate system
 * @param  {Vec2d} v1
 * @return {Number}    The angle in radians [-PI, PI]
 */
Vec2d.anglePosX = v => {
  let angle = Math.atan2(v[1], v[0])
  if (angle < 0) {
    angle *= -1
  }
  return angle
}

export default Vec2d
