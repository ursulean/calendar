<template>
    <AppNavigationItem
        title="Unscheduled Tasks"
        :allowCollapse="true"
        :loading="!initialCalendarsLoaded"
        v-show="!loadingCalendars"
        :open="true">

        <template>
            <UnscheduledTask
                v-for="value in calendarObjects"
                :key="value.id"
                :title="value.title"/>
        </template>

        <CalendarListItemLoadingPlaceholder
            v-if="loadingCalendars"
            #footer />
    </AppNavigationItem>
</template>

<script>
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import UnscheduledTask from './UnscheduledColumn/UnscheduledTask.vue'
import CalendarListItemLoadingPlaceholder from './CalendarList/CalendarListItemLoadingPlaceholder.vue'

import {
	mapGetters,
	mapState,
} from 'vuex'

//

export default {
    name: 'UnscheduledColumn',
    components: {
        UnscheduledTask,
        AppNavigationItem,
        CalendarListItemLoadingPlaceholder,
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
        console.log("FOO")
        console.log(this.calendarObjects)
    },
    methods: {},
}
</script>