<template>
	<a
		class="fc-timegrid-event fc-v-event fc-timegrid-event-short fc-event fc-event-draggable fc-event-nc-task"
		style="border-color: rgb(121, 90, 171); background-color: rgb(121, 90, 171); margin-left:20%; margin-right:5%;"
		:data-object-id="calendarObject.id">

		<div class="fc-event-main" style="color: rgb(250, 250, 250);">{{ calendarObject.title }}</div>
	</a>
</template>

<script>
export default {
	name: 'UnscheduledTask',
	components: {},
	props: {
		calendarObject: {
			type: Object,
			required: true,
		},
	},
}
</script>
