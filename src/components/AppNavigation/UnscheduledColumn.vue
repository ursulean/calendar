<template>
	<AppNavigationItem
		ref="unschedDraggable"
		title="Require action"
		:allow-collapse="true"
		:loading="!loadedOverdueTasks"
		:open="true">
		<template>
			<UnscheduledTask
				v-for="calendarObject in unscheduledObjects"
				:key="calendarObject.id"
				:calendar-object="calendarObject" />
		</template>

		<AppNavigationNewItem
			ref="newUnscheduledItem"
			v-shortkey="['c']"
			title="New Task"
			icon="icon-add"
			@shortkey.native="focusNewUnscheduledItem"
			@new-item="addUnscheduledTask" />
	</AppNavigationItem>
</template>

<script>
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import UnscheduledTask from './UnscheduledColumn/UnscheduledTask.vue'
import AppNavigationNewItem from '@nextcloud/vue/dist/Components/AppNavigationNewItem'
import FullCalendar from '@fullcalendar/vue' // eslint-disable-line no-unused-vars
import { Draggable } from '@fullcalendar/interaction'
import { createTaskPlus } from '../../utils/tasks'
import { mapCalendarJsToCalendarObject } from '../../models/calendarObject'
import { mapEventComponentToEventObject } from '../../models/event.js'
import { getUnixTimestampFromDate, getDateFromFirstdayParam, getDayStart } from '../../utils/date.js'
import { mapGetters, mapState } from 'vuex'

export default {
	name: 'UnscheduledColumn',
	components: {
		UnscheduledTask,
		AppNavigationItem,
		AppNavigationNewItem,
	},
	data() {
		return {
			loadedOverdueTasks: false,
		}
	},
	computed: {
		...mapState({
			calendars: state => state.calendars.calendars,
			calendarsById: state => state.calendars.calendarsById,
			calendarObjects: state => state.calendarObjects.calendarObjects,
			initialCalendarsLoaded: state => state.calendars.initialCalendarsLoaded,
			modificationCount: state => state.calendarObjects.modificationCount,
			view: state => state.route.params.view,
			firstDay: state => getDateFromFirstdayParam(state.route.params.firstDay),
			overdueEnd: state => {
				const end = getDayStart()
				switch (state.route.params.view) {
				case 'timeGridDay':
					break
				case 'timeGridWeek':
					end.setDate(end.getDate() - end.getDay())
					break
				case 'dayGridMonth':
				case 'listMonth':
					end.setDate(1)
					break
				}
				end.setSeconds(-1)
				return end
			},
			unscheduledObjects(state) {
				const modCount = state.calendarObjects.modificationCount // eslint-disable-line no-unused-vars
				return Object.values(state.calendarObjects.calendarObjects).filter(
					v => v.isTodo && this.isCalendarEnabled(v) && !this.isComplete(v) && (!this.isScheduled(v) || this.isOverdue(v))
				).sort(this.sortOrder)
			},
		}),
		...mapGetters({
			getCalendarObjects: 'getCalendarObjectsByTimeRangeId',
			getTimeRange: 'getTimeRangeForCalendarCoveringRange',
			timezoneId: 'getResolvedTimezone',
			sortedCalendars: 'sortedCalendars',
		}),
	},
	mounted() {
		this.$nextTick(() => {
			// eslint-disable-next-line no-new
			new Draggable(this.$refs.unschedDraggable.$el, {
				itemSelector: '.fc-event',
				eventData: function(eventEl) {
					return {
						title: eventEl.innerText,
					}
				},
			})
			this.fetchOverdue()
		})
	},
	methods: {
		async addUnscheduledTask(title) {
			const calendarId = this.sortedCalendars[0].id
			const thisAndAllFuture = false

			const calendarObject = mapCalendarJsToCalendarObject(createTaskPlus({ title }), calendarId)
			const calendarComponent = calendarObject.calendarComponent
			const eventComponent = calendarComponent.getVObjectIterator().next().value
		    const calendarObjectInstance = mapEventComponentToEventObject(eventComponent)

			this.$store.commit('setCalendarObjectInstanceForNewEvent', {
				calendarObject, calendarObjectInstance,
			})

			await this.$store.dispatch('saveCalendarObjectInstance', {
				thisAndAllFuture,
				calendarId,
			})
			this.$store.commit('resetCalendarObjectInstanceObjectIdAndRecurrenceId')
		},
		focusNewUnscheduledItem() {
			const item = this.$refs.newUnscheduledItem
			item.newItemValue = ''
			item.handleNewItem()
		},
		async fetchObjectsInTimeRange(start, end, calendar) {
			const timeRange = this.getTimeRange(
				calendar.id,
				getUnixTimestampFromDate(start),
				getUnixTimestampFromDate(end)
			)
			if (!timeRange) {
				try {
					const timeRangeId = await this.$store.dispatch(
						'getEventsFromCalendarInTimeRange',
						{ calendar, from: start, to: end }
					)
					return timeRangeId// this.getCalendarObjects(timeRangeId)

				} catch (error) { console.debug(error) }

			} else {
				console.debug('time range already in calendar')
			}
		},
		async fetchOverdue() {
			for (const calendar of this.calendars) {
				await this.fetchObjectsInTimeRange(
					this.overdueStart(),
					this.overdueEnd,
					calendar
				)
			}
			this.loadedOverdueTasks = true
		},
		isOverdue(calendarObject) {
			if (!calendarObject.isTodo) { return false }
			const todo = calendarObject.calendarComponent.getVObjectIterator().next().value
			return todo.isOverdue(this.overdueEnd)
		},
		isComplete(calendarObject) {
			if (!calendarObject.isTodo) { return false }
			const todoComponent = calendarObject.calendarComponent.getVObjectIterator().next().value
			return todoComponent.isComplete
		},
		isScheduled(calendarObject) {
			if (!calendarObject.isTodo) { return false }
			const todo = calendarObject.calendarComponent.getVObjectIterator().next().value
			return todo.isScheduled
		},
		isCalendarEnabled(calendarObject) {
			return this.calendarsById[calendarObject.calendarId].enabled
		},
		overdueStart() {
			const start = getDayStart()
			start.setDate(1)
			start.setMonth(start.getMonth() - 1)
			return start
		},
		calendarIndex(calendarObject) {
			// calendar.order is also stored in fcEvent
			return this.calendarsById[calendarObject.calendarId].order
		},
		sortOrder(a, b) {
			// fullcalendar/rendering/eventOrder.js implements a similar function
			const [aix, bix] = [this.calendarIndex(a), this.calendarIndex(b)]
			return b.isScheduled - a.isScheduled || aix - bix
		},
	},
}
</script>
