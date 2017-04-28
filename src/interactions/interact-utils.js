/* eslint-disable no-magic-numbers */
"use strict"

import * as Point2d from "../core/point2d"
import Mat2d from "../core/mat2d"
import Vec2d from "../core/vec2d"

function rotateOBBox(shape, parentShape, selectedInfo, screenPos, worldPos) {
  const pt = [0, 0]
  const scale = [0, 0]
  Mat2d.svd(pt, scale, null, selectedInfo.objectToWorldMatrix)
  const startDir = [0, 0]
  Point2d.sub(startDir, selectedInfo.startWorldPos, pt)
  Vec2d.normalize(startDir, startDir)
  const dir = pt
  Point2d.sub(dir, worldPos, pt)
  Vec2d.normalize(dir, dir)
  let angle = Vec2d.angle(startDir, dir)

  if (selectedInfo.keys.shiftKey) {
    angle = Math.round(angle / Math.QUATER_PI) * Math.QUATER_PI
  }

  // if (!camera.isYFlipped()) {
  //   angle *= -1
  // }

  parentShape.setRotation(selectedInfo.startLocalRot + Math.RAD_TO_DEG * angle)
}

export function transformXformShape(shape, selectedInfo, screenPos, worldPos, camera) {
  const parentShape = shape.parent
  const objPos = [0, 0]
  const deltaPos = [0, 0]
  const deltaDims = [0, 0]

  if (selectedInfo.rotate) {
    rotateOBBox(shape, parentShape, selectedInfo, screenPos, worldPos, camera)
    return
  }

  const uniformScale = (selectedInfo.keys.shiftKey || selectedInfo.uniformScaleOnly)
  const centerScale = (selectedInfo.keys.altKey || selectedInfo.centerScaleOnly)

  // get the position of the shape at start of transform
  const pt = [0, 0]
  Mat2d.svd(pt, null, null, selectedInfo.objectToWorldMatrix)

  // get the mouse delta in world space
  Vec2d.sub(deltaPos, worldPos, selectedInfo.startWorldPos)

  if (uniformScale && selectedInfo.controlIndex < 4) {
    const xAxisDir = [selectedInfo.objectToWorldMatrix[0], selectedInfo.objectToWorldMatrix[1]]
    const yAxisDir = [selectedInfo.objectToWorldMatrix[2], selectedInfo.objectToWorldMatrix[3]]
    const diagDir = [0, 0]

    if (selectedInfo.controlIndex < 2) {
      Vec2d.negate(xAxisDir, xAxisDir)
    }
    if (selectedInfo.controlIndex % 2 === 0) {
      Vec2d.negate(yAxisDir, yAxisDir)
    }

    Vec2d.normalize(xAxisDir, xAxisDir)
    Vec2d.normalize(yAxisDir, yAxisDir)

    Vec2d.add(diagDir, xAxisDir, yAxisDir)
    Vec2d.normalize(diagDir, diagDir)

    const cross = Vec2d.cross2d(deltaPos, diagDir)
    let axisToUse = null
    if (selectedInfo.controlIndex === 0 || selectedInfo.controlIndex === 3) {
      axisToUse = yAxisDir
      if (cross < 0) {
        axisToUse = xAxisDir
      }
    } else {
      axisToUse = xAxisDir
      if (cross < 0) {
        axisToUse = yAxisDir
      }
    }
    let mindist = Vec2d.dot(deltaPos, axisToUse)
    mindist = Math.sign(mindist) * Math.sqrt(2 * mindist * mindist)
    Vec2d.scale(deltaPos, diagDir, mindist)
    Point2d.addVec2(worldPos, selectedInfo.startWorldPos, deltaPos)
  }

  // first convert world point to object space
  Point2d.copy(objPos, worldPos)
  Point2d.transformMat2d(objPos, objPos, selectedInfo.worldToObjectMatrix)

  // get the mouse delta in object space and multipy by the
  // scale of the selected object at the start of the transform
  // to get the scale delta in object space
  Vec2d.sub(deltaDims, objPos, selectedInfo.startObjectPos)

  Point2d.copy(pt, selectedInfo.startLocalPos)

  // now determine the transform direction depending
  // on which control vertex of the object-oriented bounds
  // was selected
  let xScale = 0
  let yScale = 0
  if (selectedInfo.controlIndex < 4) {
    // dragging a corner vertex
    xScale = (selectedInfo.controlIndex < 2 ? -1 : 1)
    yScale = (selectedInfo.controlIndex % 2 === 0 ? -1 : 1)

    // can translate based on the mouse delta in world space
    // This is done to offset the scale, which is done at
    // the shape's center. This ultimately acts as a pivot
    // for the transformation. Only do this if the alt key
    // isn't pressed
    if (!centerScale) {
      Point2d.addVec2(pt, pt, Vec2d.scale(deltaPos, deltaPos, 0.5))
    }

    parentShape.setPosition(pt)
  } else {
    // dragging a side vertex, which means we only scale in
    // one dimension, rather than 2. So we need to figure
    // out that direction based on the orientation of the
    // shape
    const idx = selectedInfo.controlIndex - 4
    const axisDir = [0, 0]
    if (idx % 2 === 0) {
      // scaling in the object's X direction
      Vec2d.set(axisDir, selectedInfo.objectToWorldMatrix[0], selectedInfo.objectToWorldMatrix[1])
      yScale = 0
      xScale = (idx < 2 ? -1 : 1)
      if (uniformScale) {
        yScale = xScale
        deltaDims[1] = deltaDims[0]
      }
    } else {
      // scaling in the object's Y direction
      Vec2d.set(axisDir, selectedInfo.objectToWorldMatrix[2], selectedInfo.objectToWorldMatrix[3])
      xScale = 0
      yScale = (idx < 2 ? -1 : 1)
      if (uniformScale) {
        xScale = yScale
        deltaDims[0] = deltaDims[1]
      }
    }

    // now find the pivot offset for the axis-aligned scale
    if (!centerScale) {
      Vec2d.normalize(axisDir, axisDir)
      Vec2d.scale(axisDir, axisDir, Vec2d.dot(deltaPos, axisDir))
      Point2d.addVec2(pt, pt, Vec2d.scale(axisDir, axisDir, 0.5))
    }

    parentShape.setPosition(pt)
  }

  if (centerScale) {
    xScale *= 2
    yScale *= 2
  }

  // perform the scale
  parentShape.setScale([selectedInfo.startLocalScale[0] * (1 + xScale * deltaDims[0] / selectedInfo.shapeWidth), selectedInfo.startLocalScale[1] * (1 + yScale * deltaDims[1] / selectedInfo.shapeHeight)])
}

export function translateShape(shape, selectedInfo, screenPos, worldPos, camera) {
  const diff = [0, 0]
  const pt = [0, 0]
  Mat2d.svd(pt, null, null, selectedInfo.objectToWorldMatrix)
  if (selectedInfo.keys.shiftKey) {
    Point2d.sub(diff, screenPos, selectedInfo.startPos)
    let angle = Math.atan2(diff[1], diff[0])
    angle = Math.round(angle / Math.QUATER_PI) * Math.QUATER_PI
    const transformDir = [Math.cos(angle), Math.sin(angle)]
    Vec2d.scale(diff, transformDir, Vec2d.dot(diff, transformDir))
    Vec2d.transformMat2(diff, diff, camera.screenToWorldMatrix)
  } else {
    Vec2d.sub(diff, worldPos, selectedInfo.startWorldPos)
  }
  Point2d.addVec2(pt, selectedInfo.startLocalPos, diff)

  shape.setPosition(pt)
}

export function translateVert(shape, selectedInfo, screenPos, worldPos) {
  const parentShape = shape.parent

  // get the position of the shape at start of transform
  // const pt = [0, 0]
  // Mat2d.svd(pt, null, null, selectedInfo.objectToWorldMatrix)

  // get the mouse delta in world space
  // Vec2d.sub(deltaPos, worldPos, selectedInfo.startWorldPos)

  // first convert world point to object space
  // Point2d.copy(objPos, worldPos)
  // Point2d.transformMat2d(objPos, objPos, selectedInfo.worldToObjectMatrix)

  // get the diff
  // const diff = objPos
  // Point2d.sub(diff, objPos, selectedInfo.startObjectPos)

  const numVerts = parentShape.numVerts
  if (selectedInfo.controlIndex >= numVerts) {
    const idx1 = Math.min(selectedInfo.controlIndex - numVerts, numVerts - 1)
    const idx2 = (idx1 === numVerts - 1 ? 0 : idx1 + 1)
    const pt = [0, 0]
    const pt1 = [0, 0]
    const pt2 = [0, 0]
    const vec = [0, 0]
    const verts = parentShape.vertsRef
    const xform = parentShape.globalXform
    Point2d.transformMat2d(pt1, verts[idx1], xform)
    Point2d.transformMat2d(pt2, verts[idx2], xform)
    Point2d.sub(vec, pt2, pt1)
    Vec2d.scale(vec, vec, 0.5)
    Point2d.addVec2(pt, pt1, vec)
    selectedInfo.controlIndex = parentShape.insertVert(idx1 + 1, pt)
  } else {
    parentShape.setVertPosition(selectedInfo.controlIndex, worldPos)
  }
}
