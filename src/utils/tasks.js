import CalendarComponent from 'calendar-js/src/components/calendarComponent.js'
import ToDoComponent from 'calendar-js/src/components/root/toDoComponent.js'
import EventComponent from 'calendar-js/src/components/root/eventComponent.js'
import { dateFactory } from 'calendar-js/src/factories/dateFactory.js'
import { v4 as uuid } from 'uuid'
import RecurrenceManager from 'calendar-js/src/recurrence/recurrenceManager.js'
import DateTimeValue from 'calendar-js/src/values/dateTimeValue'
import DurationValue from 'calendar-js/src/values/durationValue'
import { getDateFromDateTimeValue } from './date.js'
import getTimezoneManager from '../services/timezoneDataProviderService'

class ToDoComponentPlus extends ToDoComponent {

	isAllDay() {
		return this.getFirstPropertyFirstValue('DUE')?.isDate ?? true
	}

	/**
	 * Gets the start date of the event
	 *
	 * @returns {DateTimeValue}
	 */
	get startDate() {
		return this.getFirstPropertyFirstValue('dtstart')
	}

	/**
	 * Sets the start date of the event
	 *
	 * @param {DateTimeValue} start The new start-date to set
	 */
	set startDate(start) {
		const oldStartDate = this.startDate
		if (!start) { this.deleteAllProperties('dtstart') } else { this.updatePropertyWithValue('dtstart', start) }

		if (this.isMasterItem()) {
			if (!start) {
				this._recurrenceManager.clearAllRecurrenceRules()
				this._recurrenceManager.clearAllRecurrenceDates()
			} else if (oldStartDate) { this._recurrenceManager.updateStartDateOfMasterItem(start, oldStartDate) }
		}
	}
	/**
	 * Gets the calculated end-date of the task
	 *
	 * If there is a due-date, we will just return that.
	 * If there is a start-date and a duration, we will
	 * calculate the end-date based on that.
	 *
	 * If there is neither a due-date nor a combination
	 * of start-date and duration, we just return null
	 *
	 * @returns {DateTimeValue|null}
	 */
	get endDate() {
		return this.getFirstPropertyFirstValue('due')
	}

	/**
	 * Sets the end time of the task
	 *
	 * @param {DateTimeValue} end The end of the task
	 */
	set endDate(end) {
		this.deleteAllProperties('duration')
		if (!end) {
			this.deleteAllProperties('due')
		} else { this.updatePropertyWithValue('due', end) }
	}

	get isScheduled() {
		const [std, end] = [this.startDate !== null, this.endDate !== null]
		if (!(std === end)) { console.debug('Inconsistent task state') }
		return std && end
	}

	get isComplete() {
		return this.percent === 100
	}

	isOverdue(limit) {
		if (!this.isScheduled || this.isComplete) { return false }
		const dueDate = getDateFromDateTimeValue(this.endDate)
		return dueDate < (limit ?? new Date())
	}

	addDurationToStart(duration) {
		this.startDate.addDuration(duration)
	}

	/**
	 * Adds a duration to the end of the event
	 *
	 * @param {DurationValue} duration The duration to add
	 */
	addDurationToEnd(duration) {
		const endDate = this.endDate
		endDate.addDuration(duration)

		this.endDate = endDate
	}

	shiftByDuration(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration) {
		const currentAllDay = this.isAllDay()
		super.shiftByDuration(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration)

		if (!currentAllDay && allDay) {
			const floating = getTimezoneManager().getTimezoneForId('floating')
			if (this.hasProperty('dtstart')) {
				this.startDate.replaceTimezone(floating)
			}

			if (this.hasProperty('due')) {
				this.endDate.replaceTimezone(floating)
			}
		}
	}

}

class EventComponentPlus extends EventComponent {

	shiftByDuration(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration) {
		const currentAllDay = this.isAllDay()
		super.shiftByDuration(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration)

		if (!currentAllDay && allDay) {
			const floating = getTimezoneManager().getTimezoneForId('floating')
			this.startDate.replaceTimezone(floating)
			this.endDate.replaceTimezone(floating)
		}
	}

}

const event2todo = new Map([
	['DTEND', 'DUE'],
])

const todo2event = new Map([
	['DUE', 'DTEND'],
])

function convertVObject(vobj, ConvertedClass, newname, propMap) {
	const properties = []
	for (const property of vobj.getPropertyIterator()) {
		const newprop = property.clone()
		if (propMap.has(newprop.name)) {
			newprop._name = propMap.get(newprop.name)
		}
		properties.push(newprop)
	}

	const components = []
	for (const component of vobj.getComponentIterator()) {
		components.push(component.clone())
	}
	const component = new ConvertedClass(newname, properties, components, vobj.root, vobj.parent)
	component.resetDirty()
	component.recurrenceManager = new RecurrenceManager(component)
	return component
}

function isAllDayComponent(component) {
	if (component.name === 'VCALENDAR') {
		component = component.getVObjectIterator().next().value
	}
	return component.isAllDay()
}

function isToDoComponent(component) {
	if (component.name === 'VCALENDAR') {
		component = component.getVObjectIterator().next().value
	}
	return ToDoComponent.prototype.isPrototypeOf(component)
}

function isEventComponent(component) {
	if (component.name === 'VCALENDAR') {
		component = component.getVObjectIterator().next().value
	}
	return EventComponent.prototype.isPrototypeOf(component)
}

function convert(calendarComponent, newclass, newname, propMap) {

	const components = Array.from(calendarComponent.getVObjectIterator())

	for (const comp of components) {
		if (!newclass.prototype.isPrototypeOf(comp)) {
			calendarComponent.deleteComponent(comp)
			const converted = convertVObject(comp, newclass, newname, propMap)
			calendarComponent.addComponent(converted)
		}
	}
}

function convertToToDoPlus(calendarComponent) {
	const isEvent = isEventComponent(calendarComponent)
	const isAllDay = isAllDayComponent(calendarComponent)

	convert(calendarComponent, ToDoComponentPlus, 'VTODO', event2todo)

	if (isEvent && isAllDay) {
		const duration = DurationValue.fromData({ days: -1 })
		const vObject = calendarComponent.getVObjectIterator().next().value
		vObject.addDurationToEnd(duration)
	}
}

function convertToEventPlus(calendarComponent) {
	const isTodo = isToDoComponent(calendarComponent)
	const isAllDay = isAllDayComponent(calendarComponent)

	convert(calendarComponent, EventComponentPlus, 'VEVENT', todo2event)

	if (isTodo && isAllDay) {
		const duration = DurationValue.fromData({ days: 1 })
		const vObject = calendarComponent.getVObjectIterator().next().value
		vObject.addDurationToEnd(duration)
	}
}

function createTaskPlus({ startDate, endDate, title }) {
	const calendar = CalendarComponent.fromEmpty()
	const todoComponent = new ToDoComponentPlus('VTODO')
	const stamp = DateTimeValue.fromJSDate(dateFactory(), true)
	const isAllDay = startDate.isDate

	todoComponent.updatePropertyWithValue('CREATED', stamp.clone())
	todoComponent.updatePropertyWithValue('DTSTAMP', stamp.clone())
	todoComponent.updatePropertyWithValue('LAST-MODIFIED', stamp.clone())
	todoComponent.updatePropertyWithValue('SEQUENCE', 0)
	todoComponent.updatePropertyWithValue('UID', uuid())

	if (title) {
		todoComponent.updatePropertyWithValue('SUMMARY', title)
	}

	if (!!startDate !== !!endDate) {
		throw new Error('Must supply either both start and end date, or neither.')
	}

	if (startDate && endDate) {
		todoComponent.updatePropertyWithValue('DTSTART', startDate)
		todoComponent.updatePropertyWithValue('DUE', isAllDay ? startDate.clone() : endDate)
	}

	calendar.addComponent(todoComponent)
	todoComponent.recurrenceManager = new RecurrenceManager(todoComponent)

	return calendar
}

export {
	createTaskPlus,
	convertToToDoPlus,
	isToDoComponent,
	convertToEventPlus,
	isEventComponent,
}
