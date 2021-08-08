import CalendarComponent from 'calendar-js/src/components/calendarComponent.js'
import ToDoComponent from 'calendar-js/src/components/root/toDoComponent.js'
import EventComponent from 'calendar-js/src/components/root/eventComponent.js'
import { dateFactory } from 'calendar-js/src/factories/dateFactory.js'
import { v4 as uuid } from 'uuid'
import RecurrenceManager from 'calendar-js/src/recurrence/recurrenceManager.js'
import DateTimeValue from 'calendar-js/src/values/dateTimeValue'


class ToDoComponentPlus extends ToDoComponent {
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
		if (this.hasProperty('due')) {
			return this.getFirstPropertyFirstValue('due')
		}

		if (!this.hasProperty('dtstart') || !this.hasProperty('duration')) {
			return null
		}

		const endDate = this.startDate.clone()
		endDate.addDuration(this.getFirstPropertyFirstValue('duration'))
		return endDate
	}

	/**
	 * Sets the end time of the task
	 *
	 * @param {DateTimeValue} end The end of the task
	 */
    set endDate(end) {
		this.deleteAllProperties('duration')
        if (end.isDate)
		this.updatePropertyWithValue('due', end)
	}
}
const event2todo = new Map([
	['DTEND', 'DUE'],
])

const todo2event = new Map([
	['DUE', 'DTEND'],
])

function convertVObject(vobj, newclass, newname, propMap) {
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
	const component = new newclass(newname, properties, components, vobj.root, vobj.parent)
	component.resetDirty()
	component.recurrenceManager = new RecurrenceManager(component)
	return component
}

function isToDoComponent(component) {
	if (component.name == "VCALENDAR") {
		component = component.getVObjectIterator().next().value
	}
	return ToDoComponent.prototype.isPrototypeOf(component)
}

function isEventComponent(component) {
	if (component.name == "VCALENDAR") {
		component = component.getVObjectIterator().next().value
	}
	return EventComponent.prototype.isPrototypeOf(component)
}

function convert(calendarComponent, newclass, newname, propMap){

	const components = Array.from(calendarComponent.getVObjectIterator())

	for (const comp of components) {
		console.log(comp)
		if (!newclass.prototype.isPrototypeOf(comp)) {
			calendarComponent.deleteComponent(comp)
			const converted = convertVObject(comp, newclass, newname, propMap)
			calendarComponent.addComponent(converted)
			console.log(converted)
		}
		console.log(' ')
	}
}

function convertToToDoPlus(calendarComponent) {
	convert(calendarComponent, ToDoComponentPlus, "VTODO", event2todo)
}

function convertToEvent(calendarComponent) {
	convert(calendarComponent, EventComponent, "VEVENT", todo2event)
}

function createTask(date) {
    const calendar = CalendarComponent.fromEmpty()
    const todoComponent = new ToDoComponentPlus('VTODO')
    
    todoComponent.updatePropertyWithValue('CREATED', DateTimeValue.fromJSDate(dateFactory(), true))
    todoComponent.updatePropertyWithValue('DTSTAMP', DateTimeValue.fromJSDate(dateFactory(), true))
    todoComponent.updatePropertyWithValue('LAST-MODIFIED', DateTimeValue.fromJSDate(dateFactory(), true))
    todoComponent.updatePropertyWithValue('SEQUENCE', 0)
    todoComponent.updatePropertyWithValue('UID', uuid())
    todoComponent.updatePropertyWithValue('DTSTART', date)
    todoComponent.updatePropertyWithValue('DUE', date)
    
    calendar.addComponent(todoComponent)
    todoComponent.recurrenceManager = new RecurrenceManager(todoComponent)
    
    return calendar
}

export {
	createTask,
	convertToToDoPlus,
	isToDoComponent,
	convertToEvent,
	isEventComponent,
}
