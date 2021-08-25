<template>
	<div style="margin-left: 18%; margin-right:7%;">
		<a
			ref="unscheduledEvent"
			class="fc-timegrid-event fc-v-event fc-event fc-event-start fc-event-end"
			:class="fcEvent.classNames"
			:data-object-id="calendarObject.id"
			:style="styleObject"
			@click="completeTask">

			<div
				class="fc-event-main"
				:style="innerStyleObject">

				<div class="fc-event-main-frame">

					<div
						class="fc-event-time">
						{{ dateText }}

						<span
							v-if="deleteTimeout !== null"
							style="position: absolute; right: 5%">

							Removing in {{ countdown }}
						</span>
					</div>

					<div class="fc-event-title-container">

						<div class="fc-event-title fc-sticky">
							{{ title }}
						</div>
					</div>

				</div>
			</div>
		</a>
	</div>
</template>

<script>
import eventDidMount from '../../../fullcalendar/rendering/eventDidMount'
import { vObjectSourceFunction } from '../../../fullcalendar/eventSources/eventSourceFunction'
import { isCheckboxClick, toggleCompleted } from '../../../fullcalendar/interaction/eventClick'
import getTimezoneManager from '../../../services/timezoneDataProviderService.js'
import { generateTextColorForHex, uidToHexColor } from '../../../utils/color.js'
import { mapGetters, mapState } from 'vuex'
import { showError } from '@nextcloud/dialogs'
// import FullCalendar from '@fullcalendar/core'
// import { StandardEvent } from '@fullcalendar/common'
export default {
	name: 'UnscheduledTask',
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
		dateText() {
			return this.fcEvent.start?.toLocaleString() ?? 'Unscheduled'
		},
		title() {
			return this.fcEvent.title
		},
	},
	mounted() {
		this.$nextTick(() => {
			eventDidMount({ event: this.fcEvent, el: this.$refs.unscheduledEvent })
		})
	},
	methods: {
		completeTask(jsEvent) {
			if (isCheckboxClick(jsEvent)) {
				this.toggleFrontEndComplete()
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
		toggleFrontEndComplete() {
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
						await toggleCompleted(this.fcEvent, this.$store)
					} catch (error) {
						showError(this.$t('calendar', 'An error occurred, complete the task'))
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
	},
}
</script>
