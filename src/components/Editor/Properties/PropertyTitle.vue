<!--
  - @copyright Copyright (c) 2019 Georg Ehrke <oc.list@georgehrke.com>
  -
  - @author Georg Ehrke <oc.list@georgehrke.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div class="property-title">
		<div
			class="property-title__input"
			:class="{ 'property-title__input--readonly': isReadOnly }">
			<input
				v-if="!isReadOnly"
				ref="eventTitleTextBox"
				type="text"
				:placeholder="placeholder"
				:value="value"
				@input.prevent.stop="changeValue"
				@keyup.enter.stop="emitEnter"
				@keyup.esc.stop="emitEsc">
			<!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
			<div v-else>{{ value }}</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'PropertyTitle',
	props: {
		isReadOnly: {
			type: Boolean,
			required: true,
		},
		placeholder: {
			type: String,
			required: true,
		},
		value: {
			type: String,
			default: '',
		},
	},
	mounted() {
		this.$nextTick(function() {
			const titleBox = this.$refs.eventTitleTextBox
			// Ugly workaround due to v-if delaying input field render
			setTimeout(function() { titleBox.focus() }, 100)
		})
	},
	methods: {
		changeValue(event) {
			this.$emit('update:value', event.target.value)
		},
		emitEnter(event) {
			this.$emit('enterKeyPress')
		},
		emitEsc(event) {
			this.$emit('escKeyPress')
		},
	},
}
</script>
