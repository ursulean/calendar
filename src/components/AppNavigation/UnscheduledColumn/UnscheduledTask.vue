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
						<span
							class="fc-event-time-date"
							:style="{cursor: isScheduled ? 'pointer' : 'inherit'}">

							{{ dateText }}
						</span>

						<span
							v-if="deleteTimeout !== null"
							class="fc-event-time-countdown">

							{{ deleteAction }} in {{ countdown }}
						</span>

						<div
							class="fc-event-external-delete-frame">
							<Close
								class="fc-event-external-delete" />
						</div>
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
import { isCheckboxClick, isElementClick, toggleCompleted, setFrontEndComplete } from '../../../fullcalendar/interaction/eventClick'
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
			const isScheduled = this.isScheduled // eslint-disable-line no-unused-vars
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
			if (!this.isAllDay) { dateStr += ' ' + this.fcEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
			return dateStr
		},
		dateStyle() {
			return {
				paddingLeft: '1%',
				paddingRight: '5%',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				backgroundColor: this.isScheduled ? '#ff000080' : '',
				borderRadius: '3px',
			}
		},
		title() {
			return this.fcEvent.title
		},
		deleteAction() {
			const label = this.deleteLabel
			return label[0].toUpperCase() + label.slice(1, -1) + 'ing'
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
				this.toggleFrontEndComplete({ label: 'complete' }, toggleCompleted, this.fcEvent, this.$store)
			} else if (isElementClick(jsEvent, 'fc-event-time-date')) {
				this.navigateToDate()
			} else if (isElementClick(jsEvent, 'fc-event-external-delete', 4)) {
				this.toggleFrontEndComplete({ label: 'delete', includeCheckbox: false }, this.deleteUnscheduled, this.fcEvent, true)
			}
		},
		toggleFrontEndComplete({ label, includeCheckbox = true }, func, ...args) {
			const fcEl = this.$refs.unscheduledEvent

			if (!fcEl.classList.contains('fc-event-nc-task-completed')) {

				setFrontEndComplete(fcEl, true, includeCheckbox)
				this.deleteLabel = label

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
						showError(this.$t('calendar', 'An error occurred, Unable to ' + label + ' the task'))
						console.error(error)
					} finally {
						clearInterval(this.deleteInterval)
						this.deleteTimeout = null
						this.deleteInterval = null
						this.deleteLabel = null
						this.countdown = 5
					}
				}, 5000)
			} else if (this.deleteLabel === label) {
				clearTimeout(this.deleteTimeout)
				clearInterval(this.deleteInterval)
				this.deleteTimeout = null
				this.deleteInterval = null
				this.deleteLabel = null
				this.countdown = 5
				setFrontEndComplete(fcEl, false, includeCheckbox)
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

.fc-event-external * {
	cursor: grab;
}

.fc-event-external-delete {
	display: flex;
	align-self: center;
	justify-self: center;
	align-items: center;
	justify-content: center;
	height: 1.5em;
	width: 1.5em;
	padding: 0.125em;
	border-radius: 50%;
}

.fc-event-external-delete > .material-design-icon__svg {
	fill: currentColor;
}

.fc-event-external-delete-frame *, .fc-event-title-checkbox, .fc-event-title-checkbox * {
	cursor: pointer;
}

</style>
