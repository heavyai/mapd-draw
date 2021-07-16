import { EPSILON } from "../core/configure"

const quarter = 0.25
const half = 0.5
const two = 2

Math.QUATER_PI = quarter * Math.PI
Math.HALF_PI = half * Math.PI
Math.HALF_NPI = -half * Math.PI
Math.TWO_PI = two * Math.PI
Math.NPI = -Math.PI
Math.NQUATER_PI = quarter * Math.NPI
Math.NHALF_PI = half * Math.NPI
Math.NTWO_PI = two * Math.NPI
Math.INV_PI = 1 / Math.PI
Math.RAD_TO_DEG = 180 / Math.PI
Math.DEG_TO_RAD = Math.PI / 180

/**
 * Clamp f to be between a min and max.
 * @param {Number} f
 * @param {Number} minv
 * @param {Number} maxv
 * @return {Number}
 */
function clamp(f, minv, maxv) {
  return f < minv ? minv : f > maxv ? maxv : f
}

/**
 * Clamp f to be between 0 and 1.
 * @param {Number} f
 * @return {Number}
 */
function clamp01(f) {
  return f < 0 ? 0 : f > 1 ? 1 : f
}

/**
 * Linearly interpolate (or extrapolate) between @c f1 and @c f2 by @c t percent.
 * @param {Number} f1
 * @param {Number} f2
 * @param {Number} t
 * @return {Number}
 */
function lerp(f1, f2, t) {
  return f1 * (1 - t) + f2 * t
}

Math.clamp = clamp
Math.clamp01 = clamp01
Math.lerp = lerp

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @param {Number} [epsilon=null] Optional epsilon value to use for the comparison. If null, uses
 *                                the globally-configured epsilon.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
Math.floatingPtEquals = function(a, b, epsilon = null) {
  const eps = epsilon !== null ? epsilon : EPSILON
  return Math.abs(a - b) <= eps * Math.max(1.0, Math.abs(a), Math.abs(b))
}

export default Math
