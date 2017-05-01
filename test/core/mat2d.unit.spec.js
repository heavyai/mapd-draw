import chai, {expect} from 'chai'
import Mat2d from '../../src/core/mat2d.js'

describe("Mat2D", () => {
  describe("singular value decomposition", () => {
    it("should be a function", () => {
      expect(typeof Mat2d.svd).to.equal("function")
    })
  })
})
