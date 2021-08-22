import DateTimeValue from 'calendar-js/src/values/dateTimeValue.js'
import getTimezoneManager from '../../services/timezoneDataProviderService'
import { mapCDavObjectToCalendarObject } from '../../models/calendarObject'

export default function(store) {
	return async function({ event, revert, draggedEl, view }) {
		const isAllDay = event.allDay
		const start = event.start
		const timezoneId = store.getters.getResolvedTimezone
		const timezone = getTimezoneManager().getTimezoneForId(timezoneId)

		const startDate = DateTimeValue.fromJSDate(start)
		startDate.replaceTimezone(timezone)
		if (isAllDay) { startDate.isDate = true }

		const objectId = draggedEl.getAttribute('data-object-id')

		try {
			const { calendarObject } = await store.dispatch(
				'getCalendarObjectInstanceByObjectIdAndRecurrenceId', {
					objectId,
					recurrenceId: null,
				}
			)

			const calendarComponent = calendarObject.calendarComponent
			const eventComponent = calendarComponent.getVObjectIterator().next().value

			eventComponent.endDate = startDate
			eventComponent.startDate = startDate

			await store.dispatch('updateCalendarObject', {
				calendarObject,
			})

			const newCalendarObject = mapCDavObjectToCalendarObject(calendarObject.dav, calendarObject.calendarId)

			store.commit('deleteCalendarObject', {
				calendarObject,
			})

			store.commit('appendCalendarObject', {
				calendarObject: newCalendarObject,
			})

		} catch (error) {
			console.debug(error)
		} finally {
			revert()
		}
	}
}
