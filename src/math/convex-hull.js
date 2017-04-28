/* eslint-disable */
// Copyright 2001 softSurfer, 2012 Dan Sunday
// This code may be freely used and modified for any purpose
// providing that this copyright notice is included with it.
// SoftSurfer makes no warranty for this code, and cannot be held
// liable for any real or imagined damage resulting from its use.
// Users of this code must verify correctness for their application.

// from http://geomalgorithms.com/a12-_hull-3.html

"use strict"

const X = 0
const Y = 1


/**
 * Test if a point is Left|On|Right of an infinite line.
 * @param  {Point2d}  P0 [description]
 * @param  {Point2d}  P1 [description]
 * @param  {Point2d}  P2 [description]
 * @return {Boolean}  Returns > 0 if P2 is left of the line thru P0 & P1,
 *                    Returns < 0 if P2 is to the right
 *                    Returns 0 if P2 is on the line
 */
function isLeft(P0, P1, P2) {
  return (P1[X] - P0[X]) * (P2[Y] - P0[Y]) - (P2[X] - P0[X]) * (P1[Y] - P0[Y])
}

/**
 * Melkman's 2D simple polyline O(n) convex hull algorithm
 * @param  {Point2d[]} verts [description]
 * @return {number[]}       [description]
 */
export function simpleHull_2D(verts) {
  // initialize a deque D[] from bottom to top so that the
  // 1st three vertices of P[] are a ccw triangle
  const H = []
  const n = verts.length

  if (n < 3) {
    for (let i = 0; i < n; i += 1) {
      H[i] = i
    }
    return H
  }

  const D = new Array(2 * n + 1)
  D.fill(-1)
  let bot = n - 2
  let top = bot + 3 // initial bottom and top deque indices

  D[bot] = D[top] = 2 // 3rd vertex is at both bot and top
  if (isLeft(verts[0], verts[1], verts[2]) > 0) {
    D[bot + 1] = 0
    D[bot + 2] = 1 // ccw vertices are: 2,0,1,2
  } else {
    D[bot + 1] = 1
    D[bot + 2] = 0 // ccw vertices are: 2,1,0,2
  }

  // compute the hull on the deque D[]
  for (let i = 3; i < n; i += 1) { // process the rest of vertices
    // test if next vertex is outside the deque hull
    if ((isLeft(verts[D[bot]], verts[D[bot + 1]], verts[i]) <= 0) ||
      (isLeft(verts[D[top - 1]], verts[D[top]], verts[i]) <= 0)) {

      // incrementally add an exterior vertex to the deque hull
      // get the rightmost tangent at the deque bot
      while (D[bot] >= 0 && D[bot + 1] >= 0 && isLeft(verts[D[bot]], verts[D[bot + 1]], verts[i]) <= 0) {
        bot += 1 // remove bot of deque
      }
      bot -= 1
      D[bot] = i // insert verts[i] at bot of deque

      // get the leftmost tangent at the deque top
      while (D[top] >= 0 && D[top + 1] >= 0 && isLeft(verts[D[top - 1]], verts[D[top]], verts[i]) <= 0) {
        top -= 1 // pop top of deque
      }
      top += 1
      D[top] = i // push verts[i] onto top of deque
    }
  }

  // transcribe deque D[] to the output hull array H[]
  let h = 0
  for (h = 0; h <= (top - bot - 1); h += 1) {
    H[h] = D[bot + h]
  }

  if (D[bot + h] !== H[0]) {
    H[h] = D[bot + h]
  }

  return H
}
