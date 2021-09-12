import DateTimeValue from 'calendar-js/src/values/dateTimeValue.js'
import getTimezoneManager from '../../services/timezoneDataProviderService'

export default function(store) {
	return async function({ event, revert, draggedEl, view }) {
		const isAllDay = event.allDay
		const timezoneId = store.getters.getResolvedTimezone
		const timezone = getTimezoneManager().getTimezoneForId(
			isAllDay ? 'floating' : timezoneId
		)

		const start = event.start
		const end = event.end ?? new Date(start)

		const startDate = DateTimeValue.fromJSDate(start)
		startDate.replaceTimezone(timezone)
		const endDate = DateTimeValue.fromJSDate(end)
		endDate.replaceTimezone(timezone)

		if (isAllDay) {
			startDate.isDate = true
			endDate.isDate = true
		}

		const objectId = draggedEl.getAttribute('data-object-id')

		try {
			const { calendarObject, calendarObjectInstance } = await store.dispatch(
				'getCalendarObjectInstanceByObjectIdAndRecurrenceId', {
					objectId,
					recurrenceId: null,
				}
			)

			await store.dispatch('schedule', {
				calendarObject,
				calendarObjectInstance,
				startDate,
				endDate
			})

			store.commit('resetCalendarObjectInstanceObjectIdAndRecurrenceId')
			
		} catch (error) {
			console.debug(error)
			
		} finally {
			revert()
		}
	}
}
