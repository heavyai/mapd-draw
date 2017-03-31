"use strict"

/**
 * Binds a this arg to a list of different function names.
 * This is most widely used to bind a this to member functions
 * that are used as callbacks in some fashion
 * @param  {string[]} funcNames array of member function names that are part of thisArg
 * @param  {Object} thisArg   object to bind
 */
export function bindAll(funcNames, thisArg) {
  funcNames.forEach(funcName => {
    if (!thisArg[funcName]) {
      return
    }
    thisArg[funcName] = thisArg[funcName].bind(thisArg)
  })
}
