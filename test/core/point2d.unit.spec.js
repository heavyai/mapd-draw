import chai, {expect} from 'chai'
import * as Point2D from '../../src/core/point2d.js'

describe("Point2D", () => {
  describe("set", () => {
    it("should be a function", () => {
      expect(typeof Point2D.set).to.equal("function")
    })
  })

  describe("create", () => {
    it("should be a function", () => {
      expect(typeof Point2D.create).to.equal("function")
    })
  })

  describe("clone", () => {
    it("should be a function", () => {
      expect(typeof Point2D.clone).to.equal("function")
    })
  })

  describe("copy", () => {
    it("should be a function", () => {
      expect(typeof Point2D.copy).to.equal("function")
    })
  })

  describe("initFromValues", () => {
    it("should be a function", () => {
      expect(typeof Point2D.initFromValues).to.equal("function")
    })
  })

  describe("addVec2", () => {
    it("should be a function", () => {
      expect(typeof Point2D.addVec2).to.equal("function")
    })
  })

  describe("sub", () => {
    it("should be a function", () => {
      expect(typeof Point2D.sub).to.equal("function")
    })
  })

  describe("transformMat2", () => {
    it("should be a function", () => {
      expect(typeof Point2D.transformMat2).to.equal("function")
    })
  })

  describe("str", () => {
    it("should be a function", () => {
      expect(typeof Point2D.str).to.equal("function")
    })
  })

  describe("distance", () => {
    it("should be a function", () => {
      expect(typeof Point2D.distance).to.equal("function")
    })
  })

  describe("squaredDistance", () => {
    it("should be a function", () => {
      expect(typeof Point2D.squaredDistance).to.equal("function")
    })
  })

  describe("linear interpolation", () => {
    it("should be a function", () => {
      expect(typeof Point2D.lerp).to.equal("function")
    })
  })

  describe("equals", () => {
    it("should be a function", () => {
      expect(typeof Point2D.equals).to.equal("function")
    })
  })

  describe("exactEquals", () => {
    it("should be a function", () => {
      expect(typeof Point2D.exactEquals).to.equal("function")
    })
  })
})
