"use strict"

import {glMatrix, vec2 as Vec2} from "gl-matrix"

const X = 0
const Y = 1

/**
 * Sets the coordinates of a 2D point
 * @param {Point2d} out Point to set
 * @param {Number} [x = 0]   X coordinate
 * @param {Number} [y = 0]   Y coordinate
 * @return {Point2d}    Point referenced by out arg
 */
export function set(out, x = 0, y = 0) {
  out[X] = x
  out[Y] = y
  return out
}

/**
 * Creates a new Point2d object
 * @param  {Number} [x = 0] X coordinate
 * @param  {Number} [y = 0] Y coordinate
 * @return {Point2d}
 */
export function create(x = 0, y = 0) {
  const out = new glMatrix.ARRAY_TYPE(2)
  return set(out, x, y)
}

/**
 * Creates a new Point2d object with coordinates initialized from an existing point.
 * @param  {Point2d} p
 * @return {Point2d}
 */
export function clone(p) {
  const out = new glMatrix.ARRAY_TYPE(2)
  out[X] = p[X]
  out[Y] = p[Y]
  return out
}

/**
 * Copies the coordinates of one point to another.
 * @param  {Point2d} out The point to copy to
 * @param  {Point2d} p   The point to copy from
 * @return {Point2d}     Point referenced by out arg
 */
export function copy(out, p) {
  out[X] = p[X]
  out[Y] = p[Y]
  return out
}

/**
 * Creates a new point from coordinates
 * @param  {Number} x X coordinate
 * @param  {Number} y Y coordinate
 * @return {Point2d}   New point
 */
export function initFromValues(x, y) {
  return create(x, y)
}

/**
 * Adds a 2d offset to an existing point
 * @param {Point2d} out Point receiving the operation result
 * @param {Point2d} pt  Existing point
 * @param {Vec2d} v   Vector describing the offset
 * @return {Point2d}   Point referenced by out arg
 */
export function addVec2(out, pt, v) {
  return Vec2.add(out, pt, v)
}

/**
 * Calculates the difference between two points
 * @param  {Vec2d} out Vector receiving operation result
 * @param  {Point2d} pt1
 * @param  {Point2d} pt2
 * @return {Vec2d}     Vector referenced by out arg
 */
export function sub(out, pt1, pt2) {
  return Vec2.sub(out, pt1, pt2)
}

/**
 * Performs an 2x2 matrix multiplication on a point
 * @param  {Point2d} out Point receiving operation result
 * @param  {Point2d} p
 * @param  {Mat2} m 2x2 matrix
 * @return {Point2d}     Point referenced by out arg
 */
export function transformMat2(out, p, m) {
  return Vec2.transformMat2(out, p, m)
}

/**
 * Performs a 2x3 matrix multiplication on a point.
 * A 2x3 matrix is ultimately a 2x2 matrix with a
 * translation component
 * @param  {Point2d} out Point receiving operation result
 * @param  {Point2d} p
 * @param  {Mat2d} m   2x3 matrix
 * @return {Point2d}     Point referenced by out arg
 */
export function transformMat2d(out, p, m) {
  return Vec2.transformMat2d(out, p, m)
}

/**
 * Creates a string representation of a point
 * @param  {Point2d} p
 * @return {string}
 */
export function str(p) {
  return `point2d(${p[0]} , ${p[1]})`
}

/**
 * Computes the distance between two 2d points
 * @param  {Point2d} p1
 * @param  {Point2d} p2
 * @return {Number}
 */
export function distance(p1, p2) {
  return Vec2.distance(p1, p2)
}

export const dist = distance

/**
 * Returns the squared distance between two points.
 * This is a cheaper operation than the true distance
 * calculation.
 * @param  {Point2d} p1
 * @param  {Point2d} p2
 * @return {Number}    distance^2
 */
export function squaredDistance(p1, p2) {
  return Vec2.squaredDistance(p1, p2)
}

export const sqrDist = squaredDistance

/**
 * Calculates the point linearly interpolated
 * between two points according to the relative operator t
 * [t == 0 = p1 & t == 1 = p2]
 * @param  {Point2d} out Point receiving result of operation
 * @param  {Point2d} p1  Start point (t = 0)
 * @param  {Point2d} p2  End point (t = 1)
 * @param  {[type]} t   Interpolate parameter [0, 1]
 * @return {Point2d}     Point referenced by out arg
 */
export function lerp(out, p1, p2, t) {
  return Vec2.lerp(out, p1, p2, t)
}

/**
 * Returns whether two points are relatively equal
 * @param  {Point2d} a
 * @param  {Point2d} b
 * @return {Boolean}   Returns true if two point are relatively equal, false otherwise
 */
export function equals(a, b) {
  return Vec2.equals(a, b)
}

/**
 * Returns whether two points are exactly equal.
 * @param  {Point2d} a
 * @param  {Point2d} b
 * @return {Boolean}   Returns true if the two points are exactly equal, false otherwise
 */
export function exactEquals(a, b) {
  return Vec2.exactEquals(a, b)
}
