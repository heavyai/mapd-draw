import chai, {expect} from 'chai'
import * as MapdDraw from '../src/mapd-draw.js'

describe("Mapd Draw", () => {
  it("should export all drawing functionality", () => {
    expect(MapdDraw.AABox2d
      && MapdDraw.DrawEngine
      && MapdDraw.ShapeBuilder
      && MapdDraw.Mat2d
      && MapdDraw.Point2d
      && MapdDraw.Mat2
      && MapdDraw.BasicStyle
      && MapdDraw.Vec2d
      && MapdDraw.Circle
      && MapdDraw.Rect
      && MapdDraw.Poly
      && MapdDraw.PolyLine
      && MapdDraw.Point
      && MapdDraw.Math
      && MapdDraw.simpleHull_2D
  ).to.exist
  })
})
