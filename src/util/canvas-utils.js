/* eslint-disable func-names */
"use strict"

/**
 * Gets the pixel ratio of a specific HTML canvas 2d context
 * @param  {CanvasRenderingContext2D} canvasCtx
 * @return {number}           pixel ratio of the canvas 2d context
 */
export function getPixelRatio(canvasCtx) {
  const backingStore = canvasCtx.backingStorePixelRatio ||
    canvasCtx.webkitBackingStorePixelRatio ||
    canvasCtx.mozBackingStorePixelRatio ||
    canvasCtx.msBackingStorePixelRatio ||
    canvasCtx.oBackingStorePixelRatio ||
    canvasCtx.backingStorePixelRatio || 1

  return (window.devicePixelRatio || 1) / backingStore
}

/**
 * Wraps certain canvas 2d context APIs to handle
 * displays with high per-pixel ratios. This is useful
 * so that the API can be called with screen-space coordinates
 * and the wrappers modify the arguments of those APIs to properly
 * handle displays with high pixel densities
 * @param  {CanvasRenderingContext2D} canvasCtx
 * @return {number}           pixel ratio of the wrapped canvas context
 */
export function makeCanvasAutoHighDPI(canvasCtx) {
  const pixelRatio = getPixelRatio(canvasCtx)

  if (pixelRatio === 1) {
    return 1
  }

  const allRatioArgs = [
    "fillRect",
    "clearRect",
    "strokeRect",
    // "moveTo",
    // "lineTo",
    // "arcTo",
    // "bezierCurveTo",
    "isPointInPath",
    "isPointInStroke"
    // "quadraticCurveTo",
    // "rect",
    // "translate",
    // "createRadialGradient",
    // "createLinearGradient"
  ]

  allRatioArgs.forEach(funcName => {
    canvasCtx[funcName] = (function(_super) {
      return function(...args) {
        args = args.map((a) => a * pixelRatio)

        return _super.apply(this, args)
      }
    })(canvasCtx[funcName])
  })

  // const ratioArgsByIndex = {
  //   arc: [0, 1, 2]
  // }

  // Object.getOwnPropertyNames(ratioArgsByIndex).forEach(funcName => {
  //   const value = ratioArgsByIndex[funcName]
  //   canvasCtx[funcName] = (function(_super) {
  //     return function(...args) {
  //       let i = 0
  //       let len = 0
  //       for (i = 0, len = value.length; i < len; i += 1) {
  //         args[value[i]] *= pixelRatio
  //       }
  //       return _super.apply(this, args)
  //     }
  //   })(canvasCtx[funcName])
  // })

  // // Stroke lineWidth adjustment
  // canvasCtx.stroke = (function(_super) {
  //   return function(...args) {
  //     this.lineWidth *= pixelRatio
  //     _super.apply(this, args)
  //     this.lineWidth /= pixelRatio
  //   }
  // })(canvasCtx.stroke)

  // // Text
  // //
  // canvasCtx.fillText = (function(_super) {
  //   return function(...args) {
  //     args[1] *= pixelRatio // x
  //     args[2] *= pixelRatio // y

  //     this.font = this.font.replace(
  //       /(\d+)(px|em|rem|pt)/g,
  //       function(w, m, u) {
  //         return (m * pixelRatio) + u
  //       }
  //     )

  //     _super.apply(this, args)

  //     this.font = this.font.replace(
  //       /(\d+)(px|em|rem|pt)/g,
  //       function(w, m, u) {
  //         return (m / pixelRatio) + u
  //       }
  //     )
  //   }
  // })(canvasCtx.fillText)

  // canvasCtx.strokeText = (function(_super) {
  //   return function(...args) {
  //     args[1] *= pixelRatio // x
  //     args[2] *= pixelRatio // y

  //     this.font = this.font.replace(
  //       /(\d+)(px|em|rem|pt)/g,
  //       function(w, m, u) {
  //         return (m * pixelRatio) + u
  //       }
  //     )

  //     _super.apply(this, args)

  //     this.font = this.font.replace(
  //       /(\d+)(px|em|rem|pt)/g,
  //       function(w, m, u) {
  //         return (m / pixelRatio) + u
  //       }
  //     )
  //   }
  // })(canvasCtx.strokeText)


  const setTransformArgs = [pixelRatio, 0, 0, pixelRatio, 0, 0]
  canvasCtx.setTransform = (function(_super) {
    return function(...args) {
      _super.apply(this, setTransformArgs)
      this.transform(...args)
    }
  })(canvasCtx.setTransform)

  return pixelRatio
}
