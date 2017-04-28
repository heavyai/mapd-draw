import chai, {expect} from 'chai'
import DrawEngine from '../../src/engine/draw-engine.js'

describe("Draw Engine", () => {
  it("should return a function", () => {
    expect(typeof DrawEngine).to.equal("function")
  })
})
