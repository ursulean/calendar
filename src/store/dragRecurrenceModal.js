/**
 * @copyright Copyright (c) 2021 Richard Steinmetz <richard@steinmetz.cloud>
 * @author Richard Steinmetz <richard@steinmetz.cloud>
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const state = {
	show: null,
	resolve: null,
	reject: null,
}

const mutations = {
	showDragRecurrenceModal(state, { resolve, reject }) {
		state.show = true
		state.resolve = resolve
		state.reject = reject
	},

	hideDragRecurrenceModal(state) {
		state.show = false
	},
}

const getters = {}

const actions = {
	async showDragRecurrenceModal({ commit }) {
		try {
			return await new Promise((resolve, reject) => {
				commit('showDragRecurrenceModal', {
					resolve,
					reject,
				})
			})
		} finally {
			commit('hideDragRecurrenceModal')
		}
	},
}

export default { state, mutations, getters, actions }
