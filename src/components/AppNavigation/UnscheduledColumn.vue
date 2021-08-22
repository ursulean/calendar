<template>
    <AppNavigationItem
        title="Unscheduled Tasks"
        :allowCollapse="true"
        :loading="!loadedOverdueTasks"
        v-show="!loadingCalendars"
        :open="true"
        ref="unschedDraggable">

        <template>
            <UnscheduledTask
                v-for="calendarObject in calendarObjects"
                :key="calendarObject.id"
                :calendarObject="calendarObject"/>
        </template>

        <AppNavigationNewItem
            title="New Task"
            icon="icon-add"
            @new-item="addUnscheduledTask" />

        <CalendarListItemLoadingPlaceholder
            v-if="loadingCalendars"
            #footer />
    </AppNavigationItem>
</template>

<script>
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import UnscheduledTask from './UnscheduledColumn/UnscheduledTask.vue'
import CalendarListItemLoadingPlaceholder from './CalendarList/CalendarListItemLoadingPlaceholder.vue'
import AppNavigationNewItem from '@nextcloud/vue/dist/Components/AppNavigationNewItem'
import FullCalendar from '@fullcalendar/vue'
import { Draggable } from '@fullcalendar/interaction'
import { createTask } from '../../utils/tasks'
import { mapCalendarJsToCalendarObject } from '../../models/calendarObject'
import { mapEventComponentToEventObject } from '../../models/event.js'
import { getUnixTimestampFromDate } from '../../utils/date.js'
import { mapGetters, mapState } from 'vuex'


export default {
    name: 'UnscheduledColumn',
    components: {
        UnscheduledTask,
        AppNavigationItem,
        CalendarListItemLoadingPlaceholder,
        AppNavigationNewItem,
    },
    props: {
		loadingCalendars: {
			type: Boolean,
			default: false,
		},
    },
    data() {
        return {
            loadedOverdueTasks: false,
        }
    },
    watch: {
        loadingCalendars: function(newValue, oldValue) {
            if (!newValue && !this.loadedOverdueTasks){
                const numCalendars = this.calendars.length
                let calendarsFetched = 0
                for (const calendar of this.calendars){
                    this.fetchObjectsInTimeRange(
                        this.oneMonthAgo,
                        this.lastWeekEnd,
                        calendar
                    ).then(calendarObjects => {
                        calendarsFetched++
                        if (calendarsFetched === numCalendars) {
                            this.loadedOverdueTasks = true
                        }
                    })
                }
            }
        }
    },
    computed: {
        ...mapState({
            calendars: state => state.calendars.calendars,
            calendarObjects: state => state.calendarObjects.calendarObjects,
            initialCalendarsLoaded: state => state.calendars.initialCalendarsLoaded,
        }),
        ...mapGetters({
            getCalendarObjects: 'getCalendarObjectsByTimeRangeId',
            getTimeRange: 'getTimeRangeForCalendarCoveringRange',
            timezoneId: 'getResolvedTimezone',
        }),
        thisWeekStart () {
            const now = new Date()
            now.setDate(now.getDate() - now.getDay())
            now.setHours(0)
            now.setMinutes(0)
            now.setSeconds(0)
            return now
        },
        lastWeekEnd () {
            const weekEnd = new Date(this.thisWeekStart)
            weekEnd.setSeconds(-1)
            return weekEnd
        },
        oneMonthAgo() {
            const monthAgo = new Date(this.thisWeekStart)
            monthAgo.setDate(monthAgo.getDate() - 28)
            return monthAgo
        }
    },
    mounted() {
        new Draggable(this.$refs.unschedDraggable.$el, {
            itemSelector: '.fc-event',
            eventData: function(eventEl) {
                return {
                    title: eventEl.innerText
                };
            }
        })
    },
    methods: {
        addUnscheduledTask(title) {
            const calendarId = this.calendars[0].id
            const thisAndAllFuture = false

            const calendarObject = mapCalendarJsToCalendarObject(createTask(null, title), calendarId)
            const calendarComponent = calendarObject.calendarComponent
            const eventComponent = calendarComponent.getVObjectIterator().next().value
		    const calendarObjectInstance = mapEventComponentToEventObject(eventComponent)

			this.$store.commit('setCalendarObjectInstanceForNewEvent', {
				calendarObject, calendarObjectInstance
			})

            this.$store.dispatch('saveCalendarObjectInstance', {
				thisAndAllFuture,
				calendarId,
			})
        },
        async fetchObjectsInTimeRange(start, end, calendar){
            const timeRange = this.getTimeRange(
                calendar.id,
                getUnixTimestampFromDate(start),
                getUnixTimestampFromDate(end)
            )
            if (!timeRange) {
                try{
                    const timeRangeId = await this.$store.dispatch(
                        'getEventsFromCalendarInTimeRange', 
                        { calendar, from: start, to: end }
                    )
                    return this.getCalendarObjects(timeRangeId)

                } catch (error) { console.debug(error) }

            } else {
                console.debug("time range already in calendar")
            }
        }
    },
}
</script>