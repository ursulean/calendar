## Requirements

- [x] Create new task from calendar
  - [x] Checkbox in edit to make event vs task
- [x] Mark off task from calendar
- [x] Automatic alarm (already implemented by NC)
- [x] ToDoComponent compatibility
- [ ] Task rollover
  - [ ] Easy fix: Push due date to sunday on week change
  - [ ] Harder: Reset due date, implement place to drag and drop unplanned tasks
    - [x] Fetching unscheduled tasks
    - [ ] Figure out whether it matters if unscheduled tasks are completed
    - [x] Additional component in sidebar to render them in
    - [x] Drag and drop into calendar
    - [x] Create new unscheduled tasks in sidebar
    - [ ] Drag from calendar into unscheduled, or make button to do it
    - [ ] Render sidebar tasks properly
- [ ] Recurrence for tasks
- [ ] Fix popover anchoring

### Low priority

- [x] Press enter to submit form
- [x] Automatically highlight textbox in editor
- [x] Esc to escape event
- [x] Change 'enter event', 'enter task' placeholder per checkbox
- [ ] Make bridging object between Event and Todo, convert in mapCDavObjectToCalendarObject


### Notes

* Opening new editor: EditorMixin.beforeRouteEnter
* Clicking another date while editor open: EditorMixin.beforeRouteUpdate
* On both: setCalendarObjectInstanceForNewEvent
* Popover is not attaching properly because FC event is being created twice
* Event sources: calendarObject.js getAllObjectsInTimeRange -> calendars.js getEventsFromCalendarInTimeRange