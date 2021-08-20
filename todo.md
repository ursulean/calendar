## Requirements

- [x] Create new todo from calendar
  - [x] Checkbox in edit to make event vs todo
- [x] Mark off todo from calendar
- [x] Automatic alarm (already implemented by NC)
- [x] ToDoComponent compatibility
- [ ] Recurrence for ToDos
- [ ] Task rollover
  - [ ] Easy fix: Push due date to sunday on week rollover
  - [ ] Harder: Reset due date, implement place to drag and drop unplanned todos

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