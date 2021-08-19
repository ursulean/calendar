## Requirements

* ✔️ Create new todo from calendar
  * ✔️ Checkbox in edit to make event vs todo
* ✔️ Mark off todo from calendar
* ✔️ Automatic alarm (already implemented by NC)
* ✔️ ToDoComponent compatibility
* Recurrence for ToDos
* Task rollover
  * Easy fix: Push due date to sunday on week rollover
  * Harder: Reset due date, implement place to drag and drop unplanned todos

### Low priority

* Press enter to submit form
* Automatically highlight textbox in editor
* Change 'enter event', 'enter task' placeholder per checkbox
* Make bridging object between Event and Todo, convert in mapCDavObjectToCalendarObject


### Notes

* Opening new editor: EditorMixin.beforeRouteEnter
* Clicking another date while editor open: EditorMixin.beforeRouteUpdate
* On both: setCalendarObjectInstanceForNewEvent
* Popover is not attaching properly because FC event is being created twice