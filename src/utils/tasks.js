import CalendarComponent from 'calendar-js/src/components/calendarComponent.js'
import { dateFactory } from 'calendar-js/src/factories/dateFactory.js'
import { v4 as uuid } from 'uuid'
import RecurrenceManager from 'calendar-js/src/recurrence/recurrenceManager.js'
import DateTimeValue from 'calendar-js/src/values/dateTimeValue'

import EventComponent from './eventComponent.js'
import ToDoComponent from './todoComponent.js'

import * as NS from 'cdav-library/src/utility/namespaceUtility.js'
import { mapCDavObjectToCalendarObject } from '../models/calendarObject'

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

function convertToToDo(calendarComponent) {
	const isEvent = isEventComponent(calendarComponent)
	let vObject = calendarComponent.getVObjectIterator().next().value

	let durationAfterEnd
	if (isEvent) { durationAfterEnd = vObject.endDate.subtractDateWithTimezone(vObject.startDate) }

	convert(calendarComponent, ToDoComponent, 'VTODO', event2todo)

	if (durationAfterEnd) {
		vObject = calendarComponent.getVObjectIterator().next().value
		vObject.endDate = vObject.startDate.clone()
		vObject.durationAfterEnd = durationAfterEnd
	}
}

function convertToEvent(calendarComponent) {
	const isTodo = isToDoComponent(calendarComponent)
	let vObject = calendarComponent.getVObjectIterator().next().value

	let durationAfterEnd
	if (isTodo) {
		durationAfterEnd = vObject.durationAfterEnd
		vObject.durationAfterEnd = null
	}

	convert(calendarComponent, EventComponent, 'VEVENT', todo2event)

	if (durationAfterEnd) {
		vObject = calendarComponent.getVObjectIterator().next().value
		vObject.addDurationToEnd(durationAfterEnd)
	}
}

function createTask({ startDate, endDate, title }) {
	const todoComponent = new ToDoComponent('VTODO')
	const stamp = DateTimeValue.fromJSDate(dateFactory(), true)

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
		todoComponent.updatePropertyWithValue('DUE', startDate.clone())
		todoComponent.durationAfterEnd = endDate.subtractDateWithTimezone(startDate)
	}

	todoComponent.recurrenceManager = new RecurrenceManager(todoComponent)

	const calendar = CalendarComponent.fromEmpty()
	calendar.addComponent(todoComponent)
	return calendar
}

function hardForkTask(todoComponent) {
	todoComponent = todoComponent.clone()
	todoComponent.updatePropertyWithValue('UID', uuid())
	todoComponent.undirtify()
	todoComponent.recurrenceManager = new RecurrenceManager(todoComponent)
	todoComponent.recurrenceManager.clearAllRecurrenceRules()
	todoComponent.recurrenceManager.clearAllRecurrenceDates()

	const calendar = CalendarComponent.fromEmpty()
	calendar.addComponent(todoComponent)
	return calendar
}

function hasOccurrenceBetween(calendarObject, from, to) {
	const vObject = calendarObject.calendarComponent.getVObjectIterator().next().value
	return !vObject.recurrenceManager.getAllOccurrencesBetweenIterator(from, to).next().done
}

async function findRecurringByType(calendar, type, from, to) {
	from = DateTimeValue.fromJSDate(from)
	to = DateTimeValue.fromJSDate(to)

	const response = await calendar.dav.calendarQuery([{
		name: [NS.IETF_CALDAV, 'comp-filter'],
		attributes: [
			['name', 'VCALENDAR'],
		],
		children: [{
			name: [NS.IETF_CALDAV, 'comp-filter'],
			attributes: [
				['name', type],
			],
			children: [{
				name: [NS.IETF_CALDAV, 'prop-filter'],
				attributes: [
					['name', 'RRULE'],
				],
			}],
		}],
	}])

	const calendarObjects = []

	for (const r of response) {
		try {
			const calendarObject = mapCDavObjectToCalendarObject(r, calendar.id)
			if (hasOccurrenceBetween(calendarObject, from, to)) {
				calendarObjects.push(calendarObject)
			}
		} catch (e) {
			console.error('could not convert calendar object', e)
		}
	}

	return calendarObjects
}

export {
	createTask,
	convertToToDo,
	isToDoComponent,
	convertToEvent,
	isEventComponent,
	hardForkTask,
	findRecurringByType,
}
