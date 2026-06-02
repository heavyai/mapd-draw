// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import chai, {expect} from 'chai'
import DrawEngine from '../../src/engine/draw-engine.js'

describe("Draw Engine", () => {
  it("should be a function", () => {
    expect(typeof DrawEngine).to.equal("function")
  })
})
