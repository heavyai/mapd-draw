// SPDX-FileCopyrightText: Copyright (c) 2026, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import chai, {expect} from 'chai'
import ShapeBuilder from '../../src/engine/shape-builder.js'

describe("Shape Builder", () => {
  it("should be a function", () => {
    expect(typeof ShapeBuilder).to.equal("function")
  })
})
