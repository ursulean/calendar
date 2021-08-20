/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <oc.list@georgehrke.com>
 *
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
 *
 */
import { getPrefixedRoute } from '../../utils/router'
import { getObjectAtRecurrenceId } from '../../utils/calendarObject.js'
import DateTimeValue from 'calendar-js/src/values/dateTimeValue.js'

/**
 * Returns a function for click action on event. This will open the editor.
 * Either the popover or the sidebar, based on the user's preference.
 *
 * @param {Object} store The Vuex store
 * @param {Object} router The Vue router
 * @param {Object} route The current Vue route
 * @param {Window} window The window object
 * @returns {Function}
 */
export default function(store, router, route, window) {
	return function({ event, jsEvent }) {
		switch (event.extendedProps.objectType) {
		case 'VEVENT':
			handleEventClick(event, store, router, route, window)
			break

		case 'VTODO':
			isCheckboxClick(jsEvent) ? toggleCompleted(event, store) : handleEventClick(event, store, router, route, window)
			break
		}
	}
}

/**
 * Handle eventClick for VEVENT
 *
 * @param {EventDef} event FullCalendar event
 * @param {Object} store The Vuex store
 * @param {Object} router The Vue router
 * @param {Object} route The current Vue route
 * @param {Window} window The window object
 */
function handleEventClick(event, store, router, route, window) {
	let desiredRoute = store.state.settings.skipPopover
		? 'EditSidebarView'
		: 'EditPopoverView'

	if (window.innerWidth <= 768 && desiredRoute === 'EditPopoverView') {
		desiredRoute = 'EditSidebarView'
	}

	const name = getPrefixedRoute(route.name, desiredRoute)
	const params = Object.assign({}, route.params, {
		object: event.extendedProps.objectId,
		recurrenceId: String(event.extendedProps.recurrenceId),
	})

	// Don't push new route when day didn't change
	if ((getPrefixedRoute(route.name, 'EditPopoverView') === route.name || getPrefixedRoute(route.name, 'EditSidebarView') === route.name)
		&& params.object === route.params.object
		&& params.recurrenceId === route.params.recurrenceId) {
		return
	}

	router.push({ name, params })
}

function isCheckboxClick(jsEvent){
	return jsEvent.path[0].className.indexOf('checkbox') != -1
}

function toggleCompleted(event, store) {
	getComponent(event, store).then(({calendarObject, todo}) => {
		
		todo.percent == 100 ? uncheck(todo) : check(todo)

		store.dispatch('updateCalendarObject', {
			calendarObject,
		}).catch(e => { console.debug(e) })

	}).catch(e => { console.debug(e) })
}

async function getComponent(event, store) {
	const objectId = event.extendedProps.objectId
	let calendarObject
	try {
		calendarObject = await store.dispatch('getEventByObjectId', { objectId })
	} catch (error) {
		console.debug(error)
		return
	}
	
	const recurrenceId = event.extendedProps.recurrenceId
	const recurrenceIdDate = recurrenceId ? new Date(recurrenceId * 1000) : null
	// console.log(event, recurrenceId, recurrenceIdDate)

	// calendarObject = store.state.calendarObjects.calendarObjects[event.extendedProps.objectId]

	const calendarComponent = getObjectAtRecurrenceId(calendarObject, recurrenceIdDate)
	if (!calendarComponent) {
		console.debug('Recurrence-id not found')
		return
	}
	return Promise.resolve({
		calendarObject: calendarObject,
		todo: calendarComponent,
	})
}

function check(todo) {
	todo.percent = 100
	todo.status = "COMPLETED"
	todo.completedTime = DateTimeValue.fromJSDate(new Date())
}

function uncheck(todo) {
	todo.percent = null
	todo.status = null
	todo.completedTime = null
}
