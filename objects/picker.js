const ACTION      = require('constants/action')
const STATE       = require('constants/state')

let actions       = require('actions')
let reducers      = require('reducers')
let animationUtil = require('utils/animation')



////////////
// CREATE //
////////////



/**
 * Creates a picker.
 * @param  {Object} initialChangedState
 * @return {picker}
 */
function create(initialChangedState) {

  /**
   * The collection of state listeners.
   * @private
   * @type {Function[]}
   */
  let stateListeners = []

  /**
   * The state of the picker.
   * @type {Object}
   */
  let state = getInitialState(initialChangedState)

  /**
   * The animation frame for notifying the state listeners.
   * @private
   * @type {Number}
   */
  let animationFrame = null

  /**
   * Triggers the state listeners and then sets the state as the next one.
   * @private
   * @param  {Object} nextState
   */
  let triggerStateListeners = (nextState) => {
    animationFrame = animationUtil.getFrame(
      animationFrame,
      () => {
        stateListeners.forEach(listener => listener(nextState))
        state = nextState
      }
    )
  }

  /**
   * Adds a state listener.
   * @param  {Function} listener
   */
  let addStateListener = (listener) => {
    stateListeners.push(listener)
  }

  /**
   * Removes a state listener.
   * @param  {Function} listener
   */
  let removeStateListener = (listener) => {
    let indexOfListener = stateListeners.indexOf(listener)
    if (indexOfListener > -1) {
      stateListeners.splice(indexOfListener, 1)
    }
  }

  /**
   * Dispatches an action that updates the state.
   * @param  {Object} action
   *         {ACTION.TYPE} action.type
   *         {Object} [action.payload]
   */
  let dispatch = (action) => {
    let nextState = getNextState(state, action)
    triggerStateListeners(nextState)
  }

  // Create the picker api.
  let picker = {
    addStateListener,
    dispatch,
    removeStateListener,
    get state() {
      return state
    },
  }

  // Go through the actions and create a higher order function
  // for each that dispatches the action with the state and
  // any other arguments passed.
  Object.keys(actions).forEach(actionName => {
    /* istanbul ignore if: used as a debugging aid */
    if (picker[actionName]) {
      throw new Error(`The picker property "${actionName}" is already defined`)
    }
    picker[actionName] = (...args) => {
      dispatch(actions[actionName](state, ...args))
    }
  })

  // Return the final picker api
  return picker

}



/**
 * Gets the next state by passing a state through reducers
 * with a certain action.
 * @private
 * @param  {Object} state
 * @param  {Object} action
 * @return {Object}
 */
function getNextState(state, action) {
  return reducers.reduce(state, action)
}



/**
 * Gets the initial state with certain changes applied.
 * @private
 * @param  {Object} initialChangedState
 * @return {Object}
 */
function getInitialState(initialChangedState) {
  let state = { ...STATE.INITIAL, ...initialChangedState }
  let { template, value } = state
  return getNextState(state, {
    payload : { template, value },
    type    : ACTION.TYPE.INITIALIZE,
  })
}





/////////////
// EXPORTS //
/////////////



module.exports = {
  create,
}