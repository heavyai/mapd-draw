"use strict"

/**
  @typedef EventObject
  @type {object}
  @property {string} type - the type of the event
  @property {string} target - the target object that fired the event
 /

/**
 * This callback is displayed as a global member.
 * @callback EventCallback
 * @param {EventObject} Event object describing the event being fired
 */

/**
 * Recursively fires hierarchical events from an handler's registered
 * event types. For example, if an event is registered as "changed:color",
 * both a "changed:color" and "changed" event is fired, so listeners who
 * only generically care if something changed on an object can be notified.
 * @param  {Map} currMap  map datastructure holding all hierarchical events and callbacks
 * @param  {string[]} subtypes the ":" separated list of the event
 * @param  {number} currIdx  the current index of subtypes being processed
 * @param  {Object} fireData the event object to fire
 * @return {number}          total number of listeners called
 * @private
 */
function recursiveFire(currMap, subtypes, currIdx, fireData) {
  if (currIdx >= subtypes.length) {
    return 0
  }

  let cnt = 0
  let data = null
  data = currMap.get(subtypes[currIdx])
  if (data) {
    cnt = recursiveFire(data[0], subtypes, currIdx + 1, fireData)
    data[1].forEach(listener => listener.call(this, fireData))
    cnt += data[1].length
  }
  return cnt
}

/**
 * Recursively deletes specific listeners from a handlers event
 * data structure. For instance, if the same callback is used for both
 * a "changed" and a "changed:color" event, and that callback is deleted
 * from the "changed" event, it is also deleted from the "changed:color" event
 * @param  {Object} currNode  Current node of the map data structure being processed
 * @param  {function[]} listeners Array of listeners to delete
 * @private
 */
function recursiveDelete(currNode, listeners) {
  let index = -1
  const subnodes = currNode[0]
  const nodelisteners = currNode[1]
  if (nodelisteners.length) {
    listeners.forEach(listener => {
      if ((index = nodelisteners.indexOf(listener)) >= 0) {
        nodelisteners.splice(index, 1)
      }
    })
  }
  subnodes.forEach((node) => {
    recursiveDelete(node, listeners)
  })
}

/**
 * Validates that an input is a string or an array of strings, and if the former
 * returns a 1-element string array
 * @param  {string|string[]} intype
 * @return {string[]}
 * @private
 */
function arrayify(intype) {
  let arrayToUse = intype
  if (typeof intype === "string") {
    arrayToUse = [intype]
  } else if (!Array.isArray(intype)) {
    throw new Error("Input must be an array of strings")
  }
  return arrayToUse
}

/** Class for managing events and listeners. Can be used as a base class or a mixin (using @see {@link aggregation}) */
export default class EventHandler {

  /**
   * Create a new event handler
   * @param  {string|string[]} eventsToRegister initial events to register
   */
  constructor(eventsToRegister) {
    this.initializer(eventsToRegister)
  }

  /**
   * Initializes an event handler object
   * @param  {string|string[]} eventsToRegister events to initialize event handler with
   * @see  {@link aggregation}
   */
  initializer(eventsToRegister) {
    this._listeners = new Map()
    this.registerEvents(eventsToRegister)
  }

  /**
   * Registers new events for the event handler
   * @param  {string|string[]} events new event(s) to register
   */
  registerEvents(events) {
    if (!events) {
      return
    }

    let eventsToUse = arrayify(events)
    if (typeof events === "string") {
      eventsToUse = [events]
    } else if (!Array.isArray(events)) {
      throw new Error("Events must be an array of strings")
    }

    eventsToUse.forEach(event => {
      const subevents = event.split(":")
      let currMap = this._listeners
      for (let i = 0; i < subevents.length; i += 1) {
        let data = currMap.get(subevents[i])
        if (!data) {
          data = [new Map(), []]
          currMap.set(subevents[i], data)
        }
        currMap = data[0]
      }
    })
  }

  /**
   * Adds a new listener to a specific event or list of different events
   * @param  {string|string[]} types    event(s) this listener is listening to
   * @param  {EventCallback} listener function to be called when events destribed by types is fired
   * @return {EventHandler}          this
   */
  on(types, listener) {
    const typesToUse = arrayify(types)
    typesToUse.forEach(type => {
      const subtypes = type.split(":")
      let currMap = this._listeners
      let data = null
      subtypes.forEach(subtype => {
        data = currMap.get(subtype)
        if (!data) {
          const keys = []
          currMap.forEach((val, key) => keys.push(key))
          throw new Error(`${type} is not a valid event type. The registered event types at this level are [${keys}]`)
        }
        currMap = data[0]
      })
      if (data[1].indexOf(listener) < 0) {
        data[1].push(listener)
      }
    })

    return this
  }

  /**
   * Removes a listener from specific events
   * @param  {string|string[]} types    event(s) the listener is being removed from
   * @param  {EventCallback} listener callback function to be cleared from the specified event types
   * @return {EventHandler}          this
   */
  off(types, listener) {
    const typesToUse = arrayify(types)
    let listeners = listener
    if (!Array.isArray(listeners)) {
      listeners = [listener]
    }
    typesToUse.forEach(type => {
      const subtypes = type.split(":")
      let currMap = this._listeners
      let data = null
      let i = 0
      for (i = 0; i < subtypes.length; i += 1) {
        data = currMap.get(subtypes[i])
        if (!data) {
          break
        }
        currMap = data[0]
      }
      if (data) {
        recursiveDelete(data, listeners)
      }
    })
    return this
  }

  /**
   * Sets up a lister callback to only be called once
   * @param  {string|string[]} types    event(s) the listener is listening to
   * @param  {EventCallback} listener callback function to be called with event(s) are fired
   * @return {EventHandler}          this
   */
  once(types, listener) {
    const wrapper = (data) => {
      this.off(types, wrapper)
      listener.call(this, data)
    }
    this.on(types, wrapper)
    return this
  }

  /**
   * Fires a specific event and calls any listeners of that event type.
   * @param  {string} type Event type to fire
   * @param  {Object} data Additional data to fire with the event
   * @return {EventHandler}      this
   */
  fire(type, data) {
    const subtypes = type.split(":")

    let fireData = {
      type,
      target: this
    }

    Object.assign(fireData, data)

    recursiveFire(this._listeners, subtypes, 0, fireData)

    // To ensure that no error events are dropped, print them to the
    // console if they have no listeners.
    // if (!numFires && endsWith(type, "error")) {
    //   console.error((data && data.error) || data || "Empty error event")
    // }

    if (this._eventParent) {
      fireData = {}
      Object.getOwnPropertyNames(data).forEach(key => {
        fireData[key] = data[key]
      })
      this._eventParent.fire(type, fireData)
    }

    return this
  }

  /**
   * Returns whether or not this event hander fires a specific event type
   * @param  {string} type Event type
   * @return {Boolean}
   */
  listens(type) {
    const subtypes = type.split(":")
    let currMap = this._listeners
    let data = null
    for (let i = 0; i < subtypes.length; i += 1) {
      data = currMap.get(subtypes[i])
      if (!data) {
        break
      }
      currMap = data[0]
    }
    return data || (this._eventParent && this._eventParent.listens(type))
  }

  /**
   * Sets a parent event handler
   * @param {EventHandler} parent
   * @param {object} data
   */
  setEventedParent(parent, data) {
    this._eventParent = parent
    this._eventParentData = data

    return this
  }
}
