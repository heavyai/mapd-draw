/* eslint-disable no-magic-numbers */
"use strict"

import * as AABox2d from "../core/aabox2d"
import * as Point2d from "../core/point2d"
import {mat2d as Mat2d, vec2 as Vec2d} from "gl-matrix"
import BaseShape from "../shapes/base-shape"

export default class VertEditableShape extends BaseShape {
  constructor(baseVertShape, opts) {
    super(opts)
    this._baseVertShape = baseVertShape
    this._vertRadius = 4
    this._transformedVerts = []
    this._baseaabox = AABox2d.create()
    this._worldToScreenMatrix = Mat2d.create()
  }

  _updateAABox(worldToScreenMatrix) {
    const aabox = this._baseVertShape.aabox
    if (!AABox2d.equals(aabox, this._baseaabox) || !Mat2d.equals(worldToScreenMatrix, this._worldToScreenMatrix)) {
      AABox2d.copy(this._baseaabox, aabox)
      Mat2d.copy(this._worldToScreenMatrix, worldToScreenMatrix)
      AABox2d.transformMat2d(this._aabox, this._baseaabox, this._worldToScreenMatrix)
      const pad = this._vertRadius + this.strokeWidth
      AABox2d.expand(this._aabox, this._aabox, [pad, pad])
    }
  }

  containsPoint(screenPt, worldPt, worldToScreenMatrix, ctx) {
    // Should we update here, or is it safe to
    // say that this is stateful, meaning a render
    // should have been performed beforehand which
    // would've updated its state
    const rtnObj = {
      hit: false,
      controlIndex: -1
    }

    this._updateAABox(worldToScreenMatrix)
    if (this.visible && AABox2d.containsPt(this._aabox, screenPt)) {
      const aabox = AABox2d.create()
      const pad = this._vertRadius + this.strokeWidth / 2
      const extents = [pad, pad]

      let i = 0
      for (i = 0; i < this._transformedVerts.length; i += 1) {
        AABox2d.initCenterExtents(aabox, this._transformedVerts[i], extents)
        if (AABox2d.containsPt(aabox, screenPt)) {
          rtnObj.hit = true
          rtnObj.controlIndex = i
          break
        }
      }

      if (!rtnObj.hit) {
        const tmpPt = [0, 0]
        const tmpVec = [0, 0]
        const radius = ctx.lineWidth * 1.5
        Vec2d.set(extents, radius, radius)
        for (i = 0; i < this._transformedVerts.length - 1; i += 1) {
          Point2d.sub(tmpVec, this._transformedVerts[i + 1], this._transformedVerts[i])
          Vec2d.scale(tmpVec, tmpVec, 0.5)
          Point2d.addVec2(tmpPt, this._transformedVerts[i], tmpVec)
          AABox2d.initCenterExtents(aabox, tmpPt, extents)
          if (AABox2d.containsPt(aabox, screenPt)) {
            rtnObj.hit = true
            rtnObj.controlIndex = this._transformedVerts.length + i
            break
          }
        }

        if (i > 0 && i === this._transformedVerts.length - 1) {
          Point2d.sub(tmpVec, this._transformedVerts[0], this._transformedVerts[i])
          Vec2d.scale(tmpVec, tmpVec, 0.5)
          Point2d.addVec2(tmpPt, this._transformedVerts[i], tmpVec)
          AABox2d.initCenterExtents(aabox, tmpPt, extents)
          if (AABox2d.containsPt(aabox, screenPt)) {
            rtnObj.hit = true
            rtnObj.controlIndex = this._transformedVerts.length + i
          }
        }
      }
    }

    return rtnObj
  }

  renderBounds(ctx, worldToScreenMatrix, boundsStrokeStyle) {
    // we're storing our AABox in screen space here, so worldToScreenMatrix is
    // unused
    this._updateAABox(worldToScreenMatrix)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    boundsStrokeStyle.setStrokeCtx(ctx)
    const center = [0, 0]
    const extents = [0, 0]
    AABox2d.getCenter(center, this._aabox)
    AABox2d.getExtents(extents, this._aabox)
    ctx.beginPath()
    ctx.rect(center[0] - extents[0], center[1] - extents[1], extents[0] * 2, extents[1] * 2)
    ctx.stroke()
    ctx.restore()
  }

  render(ctx) {
    ctx.save()

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const objToScreenMatrix = this._baseVertShape._fullXform
    const verts = this._baseVertShape.vertsRef
    this._transformedVerts = new Array(verts.length)
    const tmpPt = [0, 0]
    const tmpVec = [0, 0]

    ctx.beginPath()
    let i = 0
    this._transformedVerts[i] = [0, 0]
    Point2d.transformMat2d(this._transformedVerts[i], verts[i], objToScreenMatrix)

    const radius = Math.max(ctx.lineWidth * 1.5, 2.5)
    for (i = 0; i < verts.length - 1; i += 1) {
      this._transformedVerts[i + 1] = [0, 0]
      Point2d.transformMat2d(this._transformedVerts[i + 1], verts[i + 1], objToScreenMatrix)
      Point2d.sub(tmpVec, this._transformedVerts[i + 1], this._transformedVerts[i])
      Vec2d.scale(tmpVec, tmpVec, 0.5)
      Point2d.addVec2(tmpPt, this._transformedVerts[i], tmpVec)

      ctx.moveTo(tmpPt[0] + radius, tmpPt[1])
      ctx.arc(tmpPt[0], tmpPt[1], radius, 0, Math.TWO_PI)
    }

    if (i > 0) {
      Point2d.sub(tmpVec, this._transformedVerts[0], this._transformedVerts[i])
      Vec2d.scale(tmpVec, tmpVec, 0.5)
      Point2d.addVec2(tmpPt, this._transformedVerts[i], tmpVec)
      ctx.moveTo(tmpPt[0] + radius, tmpPt[1])
      ctx.arc(tmpPt[0], tmpPt[1], radius, 0, Math.TWO_PI)

      // TODO(croot): Is this appropriate? Can the fill/stroke style
      // be cross compatible? What about gradients/patterns?
      // We can probably safely assume no gradients/patterns at
      // this point
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()
    }

    ctx.beginPath()

    this._transformedVerts.forEach(vert => {
      ctx.moveTo(vert[0] + this._vertRadius, vert[1])
      ctx.arc(vert[0], vert[1], this._vertRadius, 0, Math.TWO_PI)
    })

    if (this.isFillVisible()) {
      this.setFillCtx(ctx)
      ctx.fill()
    }

    if (this.isStrokeVisible()) {
      this.setStrokeCtx(ctx)
      ctx.stroke()
    }

    ctx.restore()
  }
}
