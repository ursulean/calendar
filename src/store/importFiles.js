/**
 * @copyright Copyright (c) 2019 Team Popcorn <teampopcornberlin@gmail.com>
 * @copyright Copyright (c) 2020 Georg Ehrke
 * @author Team Popcorn <teampopcornberlin@gmail.com>
 * @author Georg Ehrke <oc.list@georgehrke.com>
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import Vue from 'vue'

const state = {
	lastFileInsertId: -1,
	importFiles: [],
	importFilesById: {},
	importCalendarRelation: {},
}

const mutations = {

	/**
	 * Adds a file to the state
	 *
	 * @param {object} state The vuex state
	 * @param {object} data The destructuring object
	 * @param {string} data.contents Contents of file
	 * @param {number} data.lastModified Timestamp of last modification
	 * @param {string} data.name Name of file
	 * @param {AbstractParser} data.parser The parser
	 * @param {number} data.size Size of file
	 * @param {string} data.type mime-type of file
	 */
	addFile(state, { contents, lastModified, name, parser, size, type }) {
		const file = {
			id: ++state.lastFileInsertId,
			contents,
			lastModified,
			name,
			parser,
			size,
			type,
		}

		state.importFiles.push(file)
		Vue.set(state.importFilesById, file.id, file)
	},

	/**
	 * Sets a calendar for the file
	 *
	 * @param {object} state The vuex state
	 * @param {object} data The destructuring object
	 * @param {number} data.fileId Id of file to select calendar for
	 * @param {string} data.calendarId Id of calendar to import file into
	 */
	setCalendarForFileId(state, { fileId, calendarId }) {
		Vue.set(state.importCalendarRelation, fileId, calendarId)
	},

	/**
	 * Removes all files from state
	 *
	 * @param {object} state The vuex state
	 */
	removeAllFiles(state) {
		Vue.set(state, 'importFiles', [])
		Vue.set(state, 'importFilesById', {})
		Vue.set(state, 'importCalendarRelation', {})
	},
}

const getters = {}

const actions = {}

export default { state, mutations, getters, actions }
