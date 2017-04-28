import chai, {expect} from 'chai'
import * as AABox2d from '../../src/core/aabox2d.js'

describe("AABox2d", () => {
  describe("set", () => {
    it("should return a function", () => {
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
})
