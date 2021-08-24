<template>
	<div style="margin-left: 18%; margin-right:7%;">
		<a
			class="fc-timegrid-event fc-v-event fc-event fc-event-start fc-event-end"
			ref="unscheduledEvent"
			:class="fcEvent.classNames"
			:data-object-id="calendarObject.id"
			:style="styleObject">

			<div
				class="fc-event-main"
				:style="innerStyleObject">

				<div class="fc-event-main-frame">

					<div
						class="fc-event-time">
						{{ dateText }}
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
import getTimezoneManager from '../../../services/timezoneDataProviderService.js'
import { generateTextColorForHex, uidToHexColor } from '../../../utils/color.js'
import { mapGetters, mapState } from 'vuex'
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
	computed: {
		...mapState({
			calendarsById: state => state.calendars.calendarsById
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
				color: this.fcEvent?.textColor ?? generateTextColorForHex(this.color)
			}
		},
		dateText() {
			return this.fcEvent.start?.toLocaleString() ?? "Unscheduled"
		},
		title() {
			return this.fcEvent.title
		},
	},
	mounted() {
		this.$nextTick(() => {
			// console.log(this.calendar)
			eventDidMount({event: this.fcEvent, el: this.$refs.unscheduledEvent})
		})
	},
}
</script>
