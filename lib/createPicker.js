// @flow

import type {
  DatePickerState,
  DatePickerPartialState,
  DatePickerCoreApi,
  TranslationShape,
} from 'pickadate/types'
import * as dateUtil from 'pickadate/utils/dateUtil'
import * as calendarUtil from 'pickadate/utils/calendarUtil'
import { TEMPLATE_HOOK_WORDS } from 'pickadate/defaults'
import createStore from 'pickadate/createStore'
import setStateActor from 'pickadate/actors/setStateActor'
import setSelectedActor from 'pickadate/actors/setSelectedActor'
import setHighlightedActor from 'pickadate/actors/setHighlightedActor'
import setMinimumActor from 'pickadate/actors/setMinimumActor'
import setMaximumActor from 'pickadate/actors/setMaximumActor'
import setDisabledActor from 'pickadate/actors/setDisabledActor'
import setTimeActor from 'pickadate/actors/setTimeActor'
import setTemplateActor from 'pickadate/actors/setTemplateActor'
import setTemplateHookWordsActor from 'pickadate/actors/setTemplateHookWordsActor'
import setFirstDayOfWeekActor from 'pickadate/actors/setFirstDayOfWeekActor'
import clearActor from 'pickadate/actors/clearActor'
import viewPreviousActor from 'pickadate/actors/viewPreviousActor'
import viewNextActor from 'pickadate/actors/viewNextActor'
import viewTodayActor from 'pickadate/actors/viewTodayActor'
import cycleHourUpActor from 'pickadate/actors/cycleHourUpActor'
import cycleHourDownActor from 'pickadate/actors/cycleHourDownActor'
import cycleMinuteUpActor from 'pickadate/actors/cycleMinuteUpActor'
import cycleMinuteDownActor from 'pickadate/actors/cycleMinuteDownActor'
import cycleMeridiemActor from 'pickadate/actors/cycleMeridiemActor'

const getTranslatedPartialState = (
  partialState,
  partialTranslation
): DatePickerPartialState => {
  if (!partialTranslation) {
    return partialState
  }
  return {
    ...partialState,

    firstDayOfWeek:
      partialState.firstDayOfWeek != null
        ? partialState.firstDayOfWeek
        : partialTranslation.firstDayOfWeek,

    template:
      partialState.template != null
        ? partialState.template
        : partialTranslation.template,

    templateHookWords: {
      ...partialTranslation.templateHookWords,
      ...partialState.templateHookWords,
    },
  }
}

const getInitialState = (): DatePickerState => {
  const view = calendarUtil.getStartDateOfMonth(new Date())
  return {
    firstDayOfWeek: 0,
    selected: null,
    highlighted: view,
    view,
    minimum: null,
    maximum: null,
    disabled: [],
    template: 'D MMMM, YYYY',
    templateHookWords: TEMPLATE_HOOK_WORDS,
  }
}

const createGetValue = store => () => {
  const { selected, template, templateHookWords } = store.getState()
  return selected ? dateUtil.format(selected, template, templateHookWords) : ''
}

export default function createPicker(
  partialState: DatePickerPartialState = {},
  partialTranslation: ?TranslationShape
): DatePickerCoreApi {
  const initialState = getInitialState()
  const store = createStore(initialState)

  const setState = store.addActor(setStateActor)
  setState(getTranslatedPartialState(partialState, partialTranslation))

  const getValue = createGetValue(store)
  let currentValue = getValue()
  const subscribeToValue = listener =>
    store.subscribe(() => {
      const formattedValue = getValue()
      if (formattedValue !== currentValue) {
        listener(formattedValue)
        currentValue = formattedValue
      }
    })

  return {
    store,
    getValue,
    subscribeToValue,
    setState,
    setFirstDayOfWeek: store.addActor(setFirstDayOfWeekActor),
    setSelected: store.addActor(setSelectedActor),
    setHighlighted: store.addActor(setHighlightedActor),
    setMinimum: store.addActor(setMinimumActor),
    setMaximum: store.addActor(setMaximumActor),
    setDisabled: store.addActor(setDisabledActor),
    setTime: store.addActor(setTimeActor),
    setTemplate: store.addActor(setTemplateActor),
    setTemplateHookWords: store.addActor(setTemplateHookWordsActor),
    clear: store.addActor(clearActor),
    viewPrevious: store.addActor(viewPreviousActor),
    viewNext: store.addActor(viewNextActor),
    viewToday: store.addActor(viewTodayActor),
    cycleHourUp: store.addActor(cycleHourUpActor),
    cycleHourDown: store.addActor(cycleHourDownActor),
    cycleMinuteUp: store.addActor(cycleMinuteUpActor),
    cycleMinuteDown: store.addActor(cycleMinuteDownActor),
    cycleMeridiem: store.addActor(cycleMeridiemActor),
  }
}