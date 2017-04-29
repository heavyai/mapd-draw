import chai, {expect} from 'chai'
import Vec2d from '../../src/core/vec2d.js'

describe("Vec2D", () => {
  describe("cross2d", () => {
    it("should be a function", () => {
      expect(typeof Vec2d.cross2d).to.equal("function")
    })
  })

  describe("angleFast", () => {
    it("should be a function", () => {
      expect(typeof Vec2d.angleFast).to.equal("function")
    })
  })

  describe("angle", () => {
    it("should be a function", () => {
      expect(typeof Vec2d.angle).to.equal("function")
    })
  })

  describe("anglePosX", () => {
    it("should be a function", () => {
      expect(typeof Vec2d.anglePosX).to.equal("function")
    })
  })
})
