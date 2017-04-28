"use strict"

import * as AABox2d from "../core/aabox2d"
import * as Point2d from "../core/point2d"
import {
  buildXformMatrix
} from "../shapes/transform2d"
import Mat2d from "../core/mat2d"
import Rect from "../shapes/rect"
import Vec2d from "../core/vec2d"

const Constants = {
  SIDES: 4
}

function drawOBBoxModifierRect(ctx, pt, objToScreenMat, modifierSize, modifierHalfSize, modifierRotation, scale) {
  Point2d.transformMat2d(pt, pt, objToScreenMat)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.translate(pt[0], pt[1])
  ctx.rotate(modifierRotation[1])
  ctx.scale(scale[0], scale[1])
  ctx.rotate(modifierRotation[0])
  ctx.translate(-pt[0], -pt[1])
  ctx.rect(pt[0] - modifierHalfSize, pt[1] - modifierHalfSize, modifierSize, modifierSize)

  // ctx.moveTo(pt[0], pt[1])
  // ctx.lineTo(pt[0], pt[1] + 20)
  // ctx.moveTo(pt[0], pt[1])
  // ctx.lineTo(pt[0] + 20, pt[1])

  // ctx.font = "24px serif"
  // ctx.fillText(text, pt[0], pt[1])
}

function isPointInOBBoxModifierRect(screenPt, modifierPt, objToScreenMat, modifierMat, halfBoxSz, boxSz, padBoxSz, padBoxRadius, xScale, yScale) {
  let hit = false
  let rotate = false
  Point2d.transformMat2d(modifierPt, modifierPt, objToScreenMat)
  if (Point2d.distance(modifierPt, screenPt) <= padBoxRadius) {
    Vec2d.negate(modifierPt, modifierPt)
    modifierMat[4] = modifierMat[0] * modifierPt[0] + modifierMat[2] * modifierPt[1]
    modifierMat[5] = modifierMat[1] * modifierPt[0] + modifierMat[3] * modifierPt[1]

    let x = 0
    let y = 0
    Point2d.transformMat2d(modifierPt, screenPt, modifierMat)
    if ((Math.abs(modifierPt[0]) <= halfBoxSz && Math.abs(modifierPt[1]) <= halfBoxSz) ||
      (Boolean(xScale) && Boolean(yScale) &&
        (rotate = ((x = xScale * modifierPt[0]) > -halfBoxSz && x <= padBoxSz &&
          (y = yScale * modifierPt[1]) > -halfBoxSz && y <= padBoxSz)))) {
      hit = true
    }
  }
  return {
    hit,
    rotate
  }
}

export default class XformShape extends Rect {
  constructor(opts, selectOpts = {
    scalable: true,
    rotatable: true
  }) {
    super(opts)
    this._interactiveBoxSize = 8
    this._interactiveBoxPadding = 10
    if (opts && typeof opts.vertexSize !== "undefined") {
      this._interactiveBoxSize = opts.vertexSize
    }

    this._scalable = true
    this._rotatable = true
    if (selectOpts) {
      if (typeof selectOpts.scalable !== "undefined") {
        this._scalable = Boolean(selectOpts.scalable)
      }

      if (typeof selectOpts.rotatable !== "undefined") {
        this._rotatable = Boolean(selectOpts.rotatable)
      }
    }
  }

  containsPoint(screenPt) {
    // Should we update here, or is it safe to
    // say that this is stateful, meaning a render
    // should have been performed beforehand which
    // would've updated its state
    let rtnObj = {
      hit: false,
      rotate: false,
      controlIndex: -1
    }

    const aabox = this.aabox
    if ((this._rotatable || this._scalable) && this.visible && AABox2d.containsPt(aabox, screenPt)) {
      const scale = [0, 0]
      const rot = [0, 0]
      Mat2d.svd(null, scale, rot, this._fullXform)
      const mat = Mat2d.create()

      scale[0] = (scale[0] < 0 ? -1 : 1)
      scale[1] = (scale[1] < 0 ? -1 : 1)

      if (scale[0] * scale[1] > 0) {
        Vec2d.negate(rot, rot)
      }

      Mat2d.rotate(mat, mat, rot[1])
      Mat2d.scale(mat, mat, scale)
      Mat2d.rotate(mat, mat, rot[0])

      const boxPadding = (this._rotatable ? this._interactiveBoxPadding : 0)
      const halfBoxSz = this._interactiveBoxSize / 2
      const halfWidth = this.width / 2
      const halfHeight = this.height / 2
      const pt = [0, 0]
      const padSz = halfBoxSz + boxPadding
      const padRadius = Math.sqrt(2 * padSz * padSz)
      let xScale = 0
      let yScale = 0

      for (let i = 0; i < Constants.SIDES; i += 1) {
        xScale = (i < 2 ? -1 : 1)
        yScale = (i % 2 === 0 ? -1 : 1)
        Point2d.set(pt, xScale * halfWidth, yScale * halfHeight)
        rtnObj = isPointInOBBoxModifierRect(screenPt, pt, this._fullXform, mat, halfBoxSz, this._interactiveBoxSize, padSz, padRadius, xScale, yScale, scale)
        if (rtnObj.hit) {
          rtnObj.controlIndex = i
          break
        }
      }

      if (!rtnObj.hit && this._scalable) {
        for (let i = 0; i < Constants.SIDES; i += 1) {
          xScale = (i % 2 === 0 ? (i < 2 ? -1 : 1) : 0)
          yScale = (i % 2 === 0 ? 0 : (i < 2 ? -1 : 1))
          Point2d.set(pt, xScale * halfWidth, yScale * halfHeight)
          rtnObj = isPointInOBBoxModifierRect(screenPt, pt, this._fullXform, mat, halfBoxSz, this._interactiveBoxSize, padSz, padRadius, xScale, yScale, scale)
          if (rtnObj.hit) {
            rtnObj.controlIndex = i + Constants.SIDES
            break
          }
        }
      }

      if (rtnObj.rotate && !this._rotatable) {
        rtnObj.rotate = false
      } else if (!rtnObj.rotate && !this._scalable) {
        rtnObj.rotate = true
      }
    }

    return rtnObj
  }

  _updatelocalxform(force) {
    if (this._lxformDirty || force) {
      const pos = Point2d.clone(this._pos)
      Point2d.addVec2(pos, pos, this._parent.pivotRef)
      buildXformMatrix(this._localXform, this._rotDeg, this._scale, pos, this._pivot)
      if (this._localXformUpdated) {
        this._localXformUpdated()
      }
      this._lxformDirty = false
    }
  }

  _updateglobalxform() {
    if (this._lxformDirty || this._xformDirty) {
      this._updatelocalxform(true)
      if (this._parent) {
        Mat2d.multiply(this._globalXform, this._parent.globalXform, this._localXform)
      } else {
        Mat2d.copy(this._globalXform, this._localXform)
      }
      if (this._globalXformUpdated) {
        this._globalXformUpdated()
      }
      this._xformDirty = false
    }
  }


  _updateAABox(force = false) {
    if (force || this._geomDirty || this._boundsOutOfDate) {
      const boxPadding = (this._rotatable ? this._interactiveBoxPadding : 0)
      const padding = boxPadding + this._interactiveBoxSize / 2
      AABox2d.initCenterExtents(this._aabox, [0, 0], [this.width / 2, this.height / 2])
      AABox2d.transformMat2d(this._aabox, this._aabox, this._fullXform)
      AABox2d.expand(this._aabox, this._aabox, [padding, padding])
      this._aaboxUpdated = true
      this._geomDirty = this._boundsOutOfDate = false
    }
  }

  get width() {
    return (this.parent && this.parent.width !== "undefined" ? this.parent.width : 0)
  }

  get height() {
    return (this.parent && this.parent.height !== "undefined" ? this.parent.height : 0)
  }

  renderBounds(ctx, worldToScreenMatrix, boundsStrokeStyle) {
    // we're storing our AABox in screen space here, so worldToScreenMatrix is
    // unused
    const aabox = this.aabox
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    boundsStrokeStyle.setStrokeCtx(ctx)
    const center = [0, 0]
    const extents = [0, 0]
    AABox2d.getCenter(center, aabox)
    AABox2d.getExtents(extents, aabox)
    ctx.beginPath()
    ctx.rect(center[0] - extents[0], center[1] - extents[1], extents[0] * 2, extents[1] * 2)
    ctx.stroke()
    ctx.restore()
  }

  render(ctx, worldToScreenMatrix, styleState) {
    if (!this.parent || typeof this.parent.width === "undefined" || this.parent.height === "undefined") {
      return
    }

    this._aaboxUpdated = false
    // do not fill the primary rectangle
    super.render(ctx, worldToScreenMatrix, styleState, false)
    if (!this._aaboxUpdated) {
      this._updateAABox(true)
    }

    const scale = [0, 0]
    const rot = [0, 0]
    Mat2d.svd(null, scale, rot, this._fullXform)
    scale[0] = (scale[0] < 0 ? -1 : 1)
    scale[1] = (scale[1] < 0 ? -1 : 1)

    const halfBoxSz = this._interactiveBoxSize / 2
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2
    const pt = [halfWidth, halfHeight]

    ctx.save()

    ctx.beginPath()
    drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale, "3")

    Point2d.set(pt, halfWidth, -halfHeight)
    drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale, "2")

    Point2d.set(pt, -halfWidth, -halfHeight)
    drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale, "0")

    Point2d.set(pt, -halfWidth, halfHeight)
    drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale, "1")

    if (this._scalable) {
      Point2d.set(pt, 0, halfHeight)
      drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale)

      Point2d.set(pt, 0, -halfHeight)
      drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale)

      Point2d.set(pt, halfWidth, 0)
      drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale)

      Point2d.set(pt, -halfWidth, 0)
      drawOBBoxModifierRect(ctx, pt, this._fullXform, this._interactiveBoxSize, halfBoxSz, rot, scale)
    }

    if (this.isFillVisible()) {
      styleState.setFillStyle(ctx, this)
      ctx.fill()
    }

    if (this.isStrokeVisible()) {
      styleState.setStrokeStyle(ctx, this)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.stroke()
    }

    ctx.restore()
  }
}
