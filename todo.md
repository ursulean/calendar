## Requirements

- [x] Create new task from calendar
  - [x] Checkbox in edit to make event vs task
- [x] Mark off task from calendar
- [x] Automatic alarm (already implemented by NC)
- [x] ToDoComponent compatibility

- [x] Unscheduled/Overdue sidebar
    - [x] Fetching unscheduled tasks
    - [x] Fetching overdue tasks
    - [x] Figure out whether it matters if unscheduled tasks are completed
    - [x] Additional component in sidebar to render them in
    - [x] Drag and drop into calendar
    - [x] Create new unscheduled tasks in sidebar
    - [x] Drag from calendar into unscheduled, or make button to do it
    - [x] Render sidebar tasks properly
      - [x] Color by source calendar
      - [x] Softer corners
      - [x] Task checkbox
    - [x] 'C' shortkey -> unscheduled task
    - [ ] Calendar picker button

- [x] Separate unschedule, delete buttons for EditSimple
  
- [x] Task rollover
  - [x] Sidebar additionally shows overdue tasks from past month
    - [x] Overdue definition based on current view
    - [x] Update UnscheduledTasks based on modificationCount
  - [x] Render them with a special tag/color

- [ ] Recurrence for tasks
- [x] Fix popover anchoring

### Low priority

- [x] Press enter to submit form
- [x] Automatically highlight textbox in editor
- [x] Esc to escape event
- [x] Change 'enter event', 'enter task' placeholder per checkbox
- [ ] Sort out the ...-short display style for half hour tasks/events
- [ ] Make bridging object between Event and Todo, convert in mapCDavObjectToCalendarObject
- [ ] Additional activity buttons are offset in firefox for SimpleEditor
- [ ] Sort sidebar by overdue first

### Bugs

- [x] When switching from task to event, end date stays at start date
- [ ] "Will-change memory consumption is too high. Budget limit is the document surface area multiplied by 3 (1216990 px). Occurrences of will-change over the budget will be ignored." on toggleTask
- [x] Unscheduled -> Allday fails
  - [ ] Inconsistency between Unscheduled -> Allday and Scheduled -> Allday

### Notes

* Opening new editor: EditorMixin.beforeRouteEnter
* Clicking another date while editor open: EditorMixin.beforeRouteUpdate
* On both: setCalendarObjectInstanceForNewEvent
* Popover is not attaching properly because FC event is being created twice
* Event sources: calendarObject.js getAllObjectsInTimeRange -> calendars.js getEventsFromCalendarInTimeRange