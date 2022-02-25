import chai, {expect} from 'chai'
import * as Draw from '../src/draw.js'

describe("HEAVY.AI Draw", () => {
  it("should export all drawing functionality", () => {
    expect(Draw.AABox2d
      && Draw.DrawEngine
      && Draw.ShapeBuilder
      && Draw.Mat2d
      && Draw.Point2d
      && Draw.Mat2
      && Draw.BasicStyle
      && Draw.Vec2d
      && Draw.Circle
      && Draw.Rect
      && Draw.Poly
      && Draw.PolyLine
      && Draw.Point
      && Draw.Math
      && Draw.simpleHull_2D
  ).to.exist
  })
})
