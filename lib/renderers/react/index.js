// @flow

import type { DatePickerCoreApi, Weekdays } from 'pickadate/types'
import * as React from 'react'
import * as calendarUtil from 'pickadate/utils/calendarUtil'
import * as jsUtil from 'pickadate/utils/jsUtil'
import * as gridCellSelector from 'pickadate/selectors/gridCellSelector'
import createOnKeyDownCalendar from 'pickadate/renderers/dom/createOnKeyDownCalendar'
import { EVENT_NAME } from 'pickadate/constants'

type StyleName =
  | 'inputRoot'
  | 'root'
  | 'root__active'
  | 'header'
  | 'body'
  | 'footer'
  | 'monthAndYear'
  | 'monthAndYear_month'
  | 'monthAndYear_year'
  | 'button_previous'
  | 'button_today'
  | 'button_next'
  | 'button_meridiem'
  | 'button_clear'
  | 'grid'
  | 'grid__focused'
  | 'grid_row'
  | 'grid_row__label'
  | 'grid_label'
  | 'grid_cell'
  | 'grid_cell__today'
  | 'grid_cell__highlighted'
  | 'grid_cell__selected'
  | 'grid_cell__outOfView'
  | 'grid_cell__disabled'
  | 'time'
  | 'time_hours'
  | 'time_minutes'
  | 'time_separator'
  | 'time_input'
  | 'time_input__hours'
  | 'time_input__minutes'
  | 'time_counter'
  | 'time_counter__up'
  | 'time_counter__down'
  | void

type ViewProps = {
  children: React.Node,
  styleName?: StyleName | StyleName[],
  isHidden?: boolean,
  dataset?: Object,
}

type ButtonProps = {
  ...$Exact<ViewProps>,
  onPress: Function,
  onKeyDown?: Function,
  tabIndex?: number,
  picker: DatePickerCoreApi,
}

type InputProps = {
  ...$Diff<ViewProps, { children: any }>,
  value?: string,
  readOnly?: boolean,
}

let View = () => null
let Button = () => null
let Input = () => null

export const setComponents = ({
  ButtonComponent,
  ViewComponent,
  InputComponent,
}: {
  ButtonComponent: React.ComponentType<ButtonProps>,
  ViewComponent: React.ComponentType<ViewProps>,
  InputComponent: React.ComponentType<InputProps>,
}) => {
  Button = ButtonComponent
  View = ViewComponent
  Input = InputComponent
}

type BoxProps = {
  children: React.Node,
}

type RootBoxProps = {
  children: React.Node,
  picker: DatePickerCoreApi,
}

type RootBoxState = {
  isActive: boolean,
}

export class RootBox extends React.Component<RootBoxProps, RootBoxState> {
  state = {
    isActive: false,
  }

  unsubscribeActive = this.props.picker.addEventListener(
    EVENT_NAME.ACTIVE,
    () => this.setState({ isActive: true })
  )
  unsubscribeInactive = this.props.picker.addEventListener(
    EVENT_NAME.INACTIVE,
    () => this.setState({ isActive: false })
  )

  componentWillUnmount() {
    this.unsubscribeActive()
    this.unsubscribeInactive()
  }

  render() {
    const { children } = this.props
    const styleName = ['root']
    if (this.state.isActive) {
      styleName.push('root__active')
    }
    return <View styleName={styleName}>{children}</View>
  }
}

export const HeaderBox = ({ children }: BoxProps) => (
  <View styleName='header'>{children}</View>
)

export const BodyBox = ({ children }: BoxProps) => (
  <View styleName='body'>{children}</View>
)

export const FooterBox = ({ children }: BoxProps) => (
  <View styleName='footer'>{children}</View>
)

type MonthAndYearProps = {
  picker: DatePickerCoreApi,
}

export const MonthAndYearBox = ({ picker }: MonthAndYearProps) => {
  const state = picker.store.getState()
  return (
    <View styleName='monthAndYear'>
      <View styleName='monthAndYear_month'>
        {state.templateHookWords.MMMM[state.view.getMonth()]}
      </View>
      <View styleName='monthAndYear_year'>{state.view.getFullYear()}</View>
    </View>
  )
}

type TimeBoxProps = {
  children: React.Node,
  picker: DatePickerCoreApi,
}

export const TimeBox = ({ children, picker }: TimeBoxProps) => {
  const state = picker.store.getState()
  return (
    <View styleName='time' isHidden={!state.selected}>
      {children}
    </View>
  )
}

type NavigationButtonProps = {
  picker: DatePickerCoreApi,
  renderIcon: () => React.Node,
}

export const PreviousButton = ({
  picker,
  renderIcon,
}: NavigationButtonProps) => (
  <Button
    styleName='button_previous'
    onPress={() => picker.viewPrevious()}
    picker={picker}
  >
    {renderIcon()}
  </Button>
)

export const TodayButton = ({ picker, renderIcon }: NavigationButtonProps) => (
  <Button
    styleName='button_today'
    onPress={() => picker.viewToday()}
    picker={picker}
  >
    {renderIcon()}
  </Button>
)

export const NextButton = ({ picker, renderIcon }: NavigationButtonProps) => (
  <Button
    styleName='button_next'
    onPress={() => picker.viewNext()}
    picker={picker}
  >
    {renderIcon()}
  </Button>
)

type ClearButtonProps = {
  picker: DatePickerCoreApi,
}

export const ClearButton = ({ picker }: ClearButtonProps) => (
  <Button
    styleName='button_clear'
    onPress={() => picker.clear()}
    picker={picker}
  >
    Clear
  </Button>
)

type GridButtonProps = {
  picker: DatePickerCoreApi,
  weekdays: Weekdays,
  onPress: Function,
  renderCell: ({ dateObject: Date, children: React.Node }) => React.Node,
}

type GridButtonState = {
  isFocused: boolean,
}

export class GridButton extends React.Component<
  GridButtonProps,
  GridButtonState
> {
  state = {
    isFocused: false,
  }

  onKeyDown = createOnKeyDownCalendar(this.props.picker)

  unsubscribeRemoteActive = this.props.picker.addEventListener(
    EVENT_NAME.GRID.REMOTE_ACTIVE,
    () => this.setState({ isFocused: true })
  )
  unsubscribeRemoteInactive = this.props.picker.addEventListener(
    EVENT_NAME.GRID.REMOTE_INACTIVE,
    () => this.setState({ isFocused: false })
  )

  componentWillUnmount() {
    this.unsubscribeRemoteActive()
    this.unsubscribeRemoteInactive()
  }

  render() {
    const { picker, weekdays, onPress, renderCell } = this.props

    const state = picker.store.getState()
    const datesInWeeks = calendarUtil.getDatesInWeeks(
      state.view,
      state.firstDayOfWeek
    )

    const styleName = ['grid']
    if (this.state.isFocused) {
      styleName.push('grid__focused')
    }

    return (
      <Button
        styleName={styleName}
        onPress={onPress}
        picker={picker}
        onKeyDown={this.onKeyDown}
      >
        <GridRow isLabel={true}>
          {calendarUtil
            .getWeekdayLabels(weekdays, state.firstDayOfWeek)
            .map(weekday => (
              <View styleName='grid_label' key={weekday}>
                {weekday}
              </View>
            ))}
        </GridRow>
        {datesInWeeks.map((datesInWeek, index) => (
          <GridRow key={index} isLabel={false}>
            {datesInWeek.map(dateObject => (
              <GridCell
                key={dateObject.getTime()}
                state={state}
                dateObject={dateObject}
                renderCell={renderCell}
              />
            ))}
          </GridRow>
        ))}
      </Button>
    )
  }
}

const GridRow = ({ children, isLabel }: *) => (
  <View styleName={['grid_row', isLabel ? 'grid_row__label' : undefined]}>
    {children}
  </View>
)

const GridCell = ({ children, state, dateObject, renderCell }: *) => {
  const cellInfo = gridCellSelector.computeInfo(state, dateObject)

  const styleName = ['grid_cell']
  if (cellInfo.isToday) {
    styleName.push('grid_cell__today')
  }
  if (cellInfo.isHighlighted) {
    styleName.push('grid_cell__highlighted')
  }
  if (cellInfo.isSelected) {
    styleName.push('grid_cell__selected')
  }
  if (!cellInfo.isSameMonth) {
    styleName.push('grid_cell__outOfView')
  }
  if (cellInfo.isDisabled) {
    styleName.push('grid_cell__disabled')
  }

  return (
    <View styleName={styleName} dataset={{ value: dateObject.getTime() }}>
      {renderCell({
        dateObject,
        children: <View>{dateObject.getDate()}</View>,
      })}
    </View>
  )
}

type TimeUnitInputProps = {
  picker: DatePickerCoreApi,
  renderIconUp: () => React.Node,
  renderIconDown: () => React.Node,
}

export const HourInput = ({
  picker,
  renderIconUp,
  renderIconDown,
}: TimeUnitInputProps) => {
  const state = picker.store.getState()
  const hours = state.selected
    ? jsUtil.padZero(state.selected.getHours() % 12 || 12, 2)
    : ''
  return (
    <View styleName='time_hours'>
      <Input
        styleName={['time_input', 'time_input__hours']}
        value={hours}
        readOnly={true}
      />
      <TimeCounters
        picker={picker}
        onPressUp={() => picker.cycleHourUp()}
        onPressDown={() => picker.cycleHourDown()}
        renderIconUp={renderIconUp}
        renderIconDown={renderIconDown}
      />
    </View>
  )
}

export const MinuteInput = ({
  picker,
  renderIconUp,
  renderIconDown,
}: TimeUnitInputProps) => {
  const state = picker.store.getState()
  const minutes = state.selected
    ? jsUtil.padZero(state.selected.getMinutes(), 2)
    : ''
  return (
    <View styleName='time_minutes'>
      <Input
        styleName={['time_input', 'time_input__minutes']}
        value={minutes}
        readOnly={true}
      />
      <TimeCounters
        picker={picker}
        onPressUp={() => picker.cycleMinuteUp()}
        onPressDown={() => picker.cycleMinuteDown()}
        renderIconUp={renderIconUp}
        renderIconDown={renderIconDown}
      />
    </View>
  )
}

const TimeCounters = ({
  picker,
  onPressUp,
  onPressDown,
  renderIconUp,
  renderIconDown,
}: *) => (
  <React.Fragment>
    <Button
      styleName={['time_counter', 'time_counter__up']}
      onPress={onPressUp}
      picker={picker}
      tabIndex={-1}
    >
      {renderIconUp()}
    </Button>
    <Button
      styleName={['time_counter', 'time_counter__down']}
      onPress={onPressDown}
      picker={picker}
      tabIndex={-1}
    >
      {renderIconDown()}
    </Button>
  </React.Fragment>
)

export const TimeSeparator = () => <View styleName='time_separator'>:</View>

type MeridiemButtonProps = {
  picker: DatePickerCoreApi,
}

export const MeridiemButton = ({ picker }: MeridiemButtonProps) => {
  const { selected } = picker.store.getState()
  return (
    <Button
      styleName='button_meridiem'
      onPress={() => picker.cycleMeridiem()}
      picker={picker}
    >
      {selected ? (selected.getHours() < 12 ? 'AM' : 'PM') : 'AM'}
    </Button>
  )
}