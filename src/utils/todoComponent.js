import DurationValue from 'calendar-js/src/values/durationValue'
import ToDoComponent from 'calendar-js/src/components/root/toDoComponent.js'
import { getDateFromDateTimeValue } from './date.js'
import getTimezoneManager from '../services/timezoneDataProviderService'
import DateTimeValue from 'calendar-js/src/values/dateTimeValue'

const originalShiftByDuration = ToDoComponent.prototype.shiftByDuration

const ToDoMixin = {
	props: {
		startDate: {
			get: function() {
				return this.getFirstPropertyFirstValue('dtstart')
			},
			set: function(start) {
				const oldStartDate = this.startDate
				if (!start) { this.deleteAllProperties('dtstart') } else { this.updatePropertyWithValue('dtstart', start) }

				if (this.isMasterItem()) {
					if (!start) {
						this._recurrenceManager.clearAllRecurrenceRules()
						this._recurrenceManager.clearAllRecurrenceDates()
					} else if (oldStartDate) { this._recurrenceManager.updateStartDateOfMasterItem(start, oldStartDate) }
				}
			},
		},
		endDate: {
			get: function() {
				return this.getFirstPropertyFirstValue('due')
			},
			set: function(end) {
				this.deleteAllProperties('duration')
				if (!end) {
					this.deleteAllProperties('due')
				} else { this.updatePropertyWithValue('due', end) }
			},
		},
		isScheduled: {
			get: function() {
				const [std, end] = [this.startDate !== null, this.endDate !== null]
				if (!(std === end)) { console.debug('Inconsistent task state') }
				return std && end
			},
		},
		isComplete: {
			get: function() {
				return this.percent === 100
			},
		},
		durationAfterEnd: {
			get: function() {
				let value = this.getFirstPropertyFirstValue('X-DURATION-AFTER-END')

				if (!value) {
					value = this.durationAfterEndDefault()
					if (value) { this.updatePropertyWithValue('X-DURATION-AFTER-END', value) }
				}

				return value
			},
			set: function(value) {
				this._modify()

				if (value === null) {
					this.deleteAllProperties('X-DURATION-AFTER-END')
					return
				}

				this.updatePropertyWithValue('X-DURATION-AFTER-END', value)
			},
		},
		isTask: {
			get: function() {
				return true
			},
		},
	},
	funcs: {
		isAllDay: function() {
			return this.getFirstPropertyFirstValue('DUE')?.isDate ?? true
		},

		isOverdue: function(limit) {
			if (!this.isScheduled || this.isComplete) { return false }
			const dueDate = getDateFromDateTimeValue(this.endDate)
			return dueDate < (limit ?? new Date())
		},

		addDurationToStart: function(duration) {
			this.startDate.addDuration(duration)
		},

		addDurationToEnd: function(duration) {
			const endDate = this.endDate
			endDate.addDuration(duration)
			this.endDate = endDate
		},

		durationAfterEndDefault: function() {
			if (!this.endDate) { return null }
			return this.isAllDay() ? DurationValue.fromData({ days: 1 }) : DurationValue.fromData({ hours: 1 })
		},

		dueDateDurationEnd: function() {
			const dueDate = this.endDate?.clone()
			if (dueDate) {
				dueDate.addDuration(this.durationAfterEnd)
			}
			return dueDate
		},

		addDurationToEndDuration: function(duration) {
			this.durationAfterEnd.addDuration(duration)
		},

		shiftByDuration(delta, allDay, defaultTimezone, defaultAllDayDuration, defaultTimedDuration) {
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
				if (this.hasProperty('dtstart')) {
					this.startDate.replaceTimezone(floating)
				}

				if (this.hasProperty('due')) {
					this.endDate.replaceTimezone(floating)
				}
			}

			if (currentAllDay !== allDay) {
				this.durationAfterEnd = this.durationAfterEndDefault()
			}

		},

		check: function() {
			this.percent = 100
			this.status = 'COMPLETED'
			this.completedTime = DateTimeValue.fromJSDate(new Date())
		},

		uncheck: function() {
			this.percent = null
			this.status = null
			this.completedTime = null
		},
	},
}

for (const [name, func] of Object.entries(ToDoMixin.props)) {
	Object.defineProperty(ToDoComponent.prototype, name, func)
}

for (const [name, func] of Object.entries(ToDoMixin.funcs)) {
	ToDoComponent.prototype[name] = func
}

export default ToDoComponent
