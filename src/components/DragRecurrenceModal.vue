<template>
	<Modal v-if="showModal" @close="onClose">
		<div class="drag-recurrence-modal__content">
			<SaveButtons
				:can-create-recurrence-exception="canCreateRecurrenceException"
				:force-this-and-all-future="forceThisAndAllFuture"
				:is-new="false"
				class="drag-recurrence-modal__content__buttons"
				@saveThisOnly="saveAndLeave(false)"
				@saveThisAndAllFuture="saveAndLeave(true)" />
		</div>
	</Modal>
</template>

<script>
import Modal from '@nextcloud/vue/dist/Components/Modal'
import SaveButtons from './Editor/SaveButtons'
import { mapState } from 'vuex'

export default {
	name: 'DragRecurrenceModal',
	components: {
		Modal,
		SaveButtons,
	},
	data() {
		return {
			isLoading: false,
		}
	},
	computed: {
		...mapState({
			shouldShowModal: state => state.dragRecurrenceModal.show,
			resolve: state => state.dragRecurrenceModal.resolve,
			reject: state => state.dragRecurrenceModal.reject,
			eventComponent: state => state.calendarObjectInstance.calendarObjectInstance.eventComponent,
		}),
		/**
		 * @return {boolean}
		 */
		showModal() {
			return this.shouldShowModal
		},
		/**
		 * @return {boolean}
		 */
		canCreateRecurrenceException() {
			if (!this.eventComponent) {
				return false
			}

			return this.eventComponent.canCreateRecurrenceExceptions()
		},
		/**
		 * @return {boolean}
		 */
		forceThisAndAllFuture() {
			if (!this.eventComponent) {
				return false
			}

			return this.eventComponent.isMasterItem() || this.eventComponent.isExactForkOfPrimary
		},
	},
	methods: {
		onClose() {
			this.reject('closedByUser')
		},
		/**
		 * @param {boolean} thisAndAllFuture Also update all future instances
		 */
		async saveAndLeave(thisAndAllFuture) {
			this.resolve(thisAndAllFuture || this.forceThisAndAllFuture)
		},
	},
}
</script>
