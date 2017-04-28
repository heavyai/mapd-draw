"use strict"

import {vec2 as Vec2d} from "gl-matrix"

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
