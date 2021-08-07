<template>
	<div class="property-title-time-picker">
		<div v-if="!isReadOnly" class="property-title-time-picker__task">
			<input
				id="task"
				:checked="isTask"
				type="checkbox"
				class="checkbox"
				:disabled="!isNewEntry"
				@change="toggleTask">
			<label
				for="task">
				Task
			</label>
		</div>
    </div>
</template>

<script>
export default {
	name: 'PropertyTaskToggle',
    props: {
		isReadOnly: {
			type: Boolean,
			required: true,
		},
		isNewEntry: {
			type: Boolean,
			required: true,
		},
        isTask: {
            type: Boolean,
            required: true,
        }
    },
    data(){return {}},
    computed: {},
    methods: {
		/**
		 * Toggles task vs. event
		 */
		toggleTask() {
			if (this.isReadOnly) {
				return
			}
			this.$emit('toggleTask')
		},
    },
}
</script>
