<template>
    <AppNavigationItem
        title="Unscheduled Tasks"
        :allowCollapse="true"
        :loading="!initialCalendarsLoaded"
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
            title="New Item"
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
import { mapState } from 'vuex'

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
    computed: {
        ...mapState({
            calendarObjects: state => state.calendarObjects.calendarObjects,
            initialCalendarsLoaded: state => state.calendars.initialCalendarsLoaded,
        }),
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
            alert(title)
        },
    },
}
</script>