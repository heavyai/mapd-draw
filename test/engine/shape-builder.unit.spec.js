import chai, {expect} from 'chai'
import ShapeBuilder from '../../src/engine/shape-builder.js'

describe("Shape Builder", () => {
  it("should be a function", () => {
    expect(typeof ShapeBuilder).to.equal("function")
  })
})
