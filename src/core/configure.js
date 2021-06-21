/**
 * Common utilities, overwriting some functionality from gl-matrix::common.js
 */

import { glMatrix } from "gl-matrix"

/**
 * global difference epsilon for floating-pt comparisons
 */

export let EPSILON = glMatrix.EPSILON

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */
export function setMatrixArrayType(type) {
  return glMatrix.setMatrixArrayType(type)
}

/**
 * Sets the global differencing epsilon for floating-pt comparisons
 *
 * @param {number} epsilon represents the difference between 1 and the smallest floating point number greater than 1.
 */
export function setEpsilon(epsilon) {
  EPSILON = epsilon
}
