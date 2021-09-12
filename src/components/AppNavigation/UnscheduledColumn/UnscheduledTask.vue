<template>
	<div style="margin-left: 18%; margin-right:7%;">
		<div
			ref="unscheduledEvent"
			class="fc-timegrid-event fc-v-event fc-event fc-event-start fc-event-end fc-event-external"
			:class="fcEvent.classNames"
			:style="styleObject"
			@click="handleClick">

			<div
				class="fc-event-main"
				:style="innerStyleObject">

				<div class="fc-event-main-frame">

					<div class="fc-event-time" :style="dateStyle">

						<span class="fc-event-time-date">
							{{ dateText }}
						</span>

						<span
							v-if="deleteTimeout !== null"
							class="fc-event-time-countdown">

							Removing in {{ countdown }}
						</span>

						<span class="fc-event-external-delete">
							<Close 
								:size="12" />
						</span>
					</div>

					<div class="fc-event-title-container">

						<div class="fc-event-title fc-sticky">
							{{ title }}
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>
</template>

<script>
import eventDidMount from '../../../fullcalendar/rendering/eventDidMount'
import { vObjectSourceFunction } from '../../../fullcalendar/eventSources/eventSourceFunction'
import { isCheckboxClick, isElementClick, toggleCompleted } from '../../../fullcalendar/interaction/eventClick'
import getTimezoneManager from '../../../services/timezoneDataProviderService.js'
import { generateTextColorForHex, uidToHexColor } from '../../../utils/color.js'
import Close from 'vue-material-design-icons/Close'
import {
	getYYYYMMDDFromDate,
} from '../../../utils/date.js'
import { mapGetters, mapState } from 'vuex'
import { showError } from '@nextcloud/dialogs'

export default {
	name: 'UnscheduledTask',
	components: {
		Close,
	},
	props: {
		calendarObject: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			deleteInterval: null,
			deleteTimeout: null,
			deleteLabel: null,
			countdown: 5,
		}
	},
	computed: {
		...mapState({
			calendarsById: state => state.calendars.calendarsById,
		}),
		...mapGetters({
			timezoneId: 'getResolvedTimezone',
		}),
		calendar() {
			return this.calendarsById[this.calendarObject.calendarId]
		},
		vObject() {
			return this.calendarObject.calendarComponent.getVObjectIterator().next().value
		},
		fcEvent() {
			this.isScheduled
			const timezoneObject = getTimezoneManager().getTimezoneForId(this.timezoneId)
			return vObjectSourceFunction(this.calendarObject, this.vObject, this.calendar, timezoneObject)
		},
		color() {
			return this.vObject?.color ?? this.calendar.color ?? uidToHexColor(this.calendarObject.calendar.displayName)
		},
		styleObject() {
			return {
				borderColor: this.fcEvent?.borderColor ?? this.color,
				backgroundColor: this.fcEvent?.backgroundColor ?? this.color,
			}
		},
		innerStyleObject() {
			return {
				color: this.fcEvent?.textColor ?? generateTextColorForHex(this.color),
			}
		},
		isScheduled() {
			return this.calendarObject.isScheduled
		},
		isAllDay() {
			return this.vObject.isAllDay()
		},
		dateText() {
			if (!this.isScheduled) { return 'Unscheduled' }
			let dateStr = this.fcEvent.start.toLocaleDateString()
			if (!this.isAllDay) { dateStr += ' ' + this.fcEvent.start.toLocaleTimeString([], { hour: 'numeric' }) }
			return dateStr
		},
		dateStyle() {
			return {
				paddingLeft: "1%",
				paddingRight: "5%",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				backgroundColor: this.isScheduled ? '#ff000080' : '',
				borderRadius: '3px',
			}
		},
		title() {
			return this.fcEvent.title
		},
	},
	mounted() {
		this.$nextTick(() => {
			// This gives the data-object-id and data-recurrence-id element props
			eventDidMount({ event: this.fcEvent, el: this.$refs.unscheduledEvent })
		})
	},
	methods: {
		handleClick(jsEvent) {
			if (isCheckboxClick(jsEvent)) {
				this.toggleFrontEndComplete(toggleCompleted, this.fcEvent, this.$store)
			} else if (isElementClick(jsEvent, 'fc-event-time-date')) {
				this.navigateToDate()
			} else if (isElementClick(jsEvent, 'fc-event-external-delete', 4)) {
				this.toggleFrontEndComplete(this.deleteUnscheduled, this.fcEvent, true)
			}
		},
		isCompleteFrontEnd() {
			return this.$refs.unscheduledEvent.classList.contains('fc-event-nc-task-completed')
		},
		frontEndComplete() {
			if (this.isCompleteFrontEnd()) { return }
			const fcEl = this.$refs.unscheduledEvent
			const checkbox = fcEl.querySelector('.fc-event-title-checkbox')
			checkbox.classList.replace('calendar-grid-checkbox', 'calendar-grid-checkbox-checked')
			fcEl.classList.add('fc-event-nc-task-completed')
		},
		frontEndUncomplete() {
			if (!this.isCompleteFrontEnd()) { return }
			const fcEl = this.$refs.unscheduledEvent
			const checkbox = fcEl.querySelector('.fc-event-title-checkbox')
			checkbox.classList.replace('calendar-grid-checkbox-checked', 'calendar-grid-checkbox')
			fcEl.classList.remove('fc-event-nc-task-completed')
		},
		toggleFrontEndComplete(func, ...args) {
			if (!this.isCompleteFrontEnd()) {

				this.frontEndComplete()

				this.deleteInterval = setInterval(() => {
					this.countdown--

					if (this.countdown < 0) {
						this.countdown = 0
					}
				}, 1000)

				this.deleteTimeout = setTimeout(async() => {
					try {
						await func(...args)
					} catch (error) {
						showError(this.$t('calendar', 'An error occurred, Unable to complete the task'))
						console.error(error)
					} finally {
						clearInterval(this.deleteInterval)
						this.deleteTimeout = null
						this.deleteInterval = null
						this.countdown = 5
					}
				}, 5000)
			} else {
				clearTimeout(this.deleteTimeout)
				clearInterval(this.deleteInterval)
				this.deleteTimeout = null
				this.deleteInterval = null
				this.countdown = 5
				this.frontEndUncomplete()
			}
		},
		navigateToDate() {
			const date = this.fcEvent.start
			if (!date) { return }

			const name = this.$route.name
			const params = Object.assign({}, this.$route.params, {
				firstDay: getYYYYMMDDFromDate(date),
			})

			// Don't push new route when day didn't change
			if (this.$route.params.firstDay === getYYYYMMDDFromDate(date)) {
				return
			}

			this.$router.push({ name, params })
		},
		async deleteUnscheduled(fcEvent, thisAndAllFuture) {
			await this.$store.dispatch(
				'getCalendarObjectInstanceByObjectIdAndRecurrenceId',
				fcEvent.extendedProps
			)
			this.$store.dispatch('deleteCalendarObjectInstance', { thisAndAllFuture })
		},
	},
}
</script>

<style lang="scss">

.fc-event-external-delete {
	padding: 1%;
	border-radius: 50%;
}

.fc-event-external-delete:hover {
	background-color: rgba(255, 255, 255, 0.25);
}

</style>
