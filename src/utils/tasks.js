import CalendarComponent from 'calendar-js/src/components/calendarComponent.js'
import ToDoComponent from 'calendar-js/src/components/root/toDoComponent.js'
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

// export function setComplete(calendarObjectInstance) {

// }

export default function(date) {
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
