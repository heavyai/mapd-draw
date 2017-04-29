import chai, {expect} from 'chai'
import * as AABox2d from '../../src/core/aabox2d.js'

describe("AABox2d", () => {
  describe("set", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.set).to.equal("function")
    })

    it("should set infinite bounds if no arguments supplied", () => {
      expect(AABox2d.set({})).to.deep.equal({
        0: Infinity,
        1: Infinity,
        2: -Infinity,
        3: -Infinity
      })
    })

    it("should set bounds if arguments supplied", () => {
      expect(AABox2d.set({}, 1, 1, 1, 1)).to.deep.equal({
        0: 1,
        1: 1,
        2: 1,
        3: 1
      })
    })
  })

  describe("create", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.create).to.equal("function")
    })
  })

  describe("clone", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.clone).to.equal("function")
    })
  })

  describe("copy", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.copy).to.equal("function")
    })
  })

  describe("initEmpty", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.initEmpty).to.equal("function")
    })
  })

  describe("initInfity", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.initInfinity).to.equal("function")
    })
  })

  describe("initSizeFromOrigin", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.initSizeFromOrigin).to.equal("function")
    })
  })

  describe("initSizeFromLocation", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.initSizeFromLocation).to.equal("function")
    })
  })

  describe("initCenterExtents", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.initCenterExtents).to.equal("function")
    })
  })

  describe("isEmpty", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.isEmpty).to.equal("function")
    })
  })

  describe("isInfinite", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.isInfinite).to.equal("function")
    })
  })

  describe("equals", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.equals).to.equal("function")
    })
  })

  describe("getSize", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.getSize).to.equal("function")
    })
  })

  describe("getExtents", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.getExtents).to.equal("function")
    })
  })

  describe("getCenter", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.getCenter).to.equal("function")
    })
  })

  describe("expand", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.expand).to.equal("function")
    })
  })

  describe("area", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.area).to.equal("function")
    })
  })

  describe("intersection", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.intersection).to.equal("function")
    })
  })

  describe("overlaps", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.overlaps).to.equal("function")
    })
  })

  describe("contains", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.contains).to.equal("function")
    })
  })

  describe("containsPt", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.containsPt).to.equal("function")
    })
  })

  describe("encapsulatePt", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.encapsulatePt).to.equal("function")
    })
  })

  describe("translate", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.translate).to.equal("function")
    })
  })

  describe("transformMat2", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.transformMat2).to.equal("function")
    })
  })

  describe("transformMat2d", () => {
    it("should be a function", () => {
      expect(typeof AABox2d.transformMat2d).to.equal("function")
    })
  })
})
