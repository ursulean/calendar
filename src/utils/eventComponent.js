import EventComponent from 'calendar-js/src/components/root/eventComponent.js'
import getTimezoneManager from '../services/timezoneDataProviderService'

const originalShiftByDuration = EventComponent.prototype.shiftByDuration

const EventMixin = {

	props: {
		isTask: {
			get: function() {
				return false
			},
		},
	},
	funcs: {
		shiftByDuration: function(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration) {
			const currentAllDay = this.isAllDay()

			originalShiftByDuration.call(
				this,
				delta,
				allDay,
				defaultTimezone,
				defaultAllDayDuration,
				defaultTimedDuration
			)

			if (!currentAllDay && allDay) {
				const floating = getTimezoneManager().getTimezoneForId('floating')
				this.startDate.replaceTimezone(floating)
				this.endDate.replaceTimezone(floating)
			}
		},
	},
}

for (const [name, func] of Object.entries(EventMixin.props)) {
	Object.defineProperty(EventComponent.prototype, name, func)
}

for (const [name, func] of Object.entries(EventMixin.funcs)) {
	EventComponent.prototype[name] = func
}

export default EventComponent
