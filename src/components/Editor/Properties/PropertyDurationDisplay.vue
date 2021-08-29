<template>
    <div class="mx-datepicker">
        <vue-timepicker
            ref="durationPicker"
            lazy
            auto-scroll
            format="H:mm"
            hide-clear-button
            :placeholder="placeholder"
            :value="durationObject"
            :minute-interval="minuteInterval"
            :disabled="disabled"
            @input="inputHandler" />
    </div>
</template>

<script>

import VueTimepicker from 'vue2-timepicker'
import 'vue2-timepicker/dist/VueTimepicker.css'

export default {
	name: 'PropertyDurationDisplay',
    components: {
        VueTimepicker,
    },
	props: {
        duration: {
            type: Number,
            required: true,
        },
        slotDuration: {
            type: String,
            required: true,
        },
        isAllDay: {
            type: Boolean,
            required: true,
        },
	},
    computed: {
        durationObject() { return this.durationToObject(this.duration) },
        minuteInterval() {
            return this.slotToMinuteInterval(this.slotDuration)
        },
        isSynced() {
            return this.objectToDuration(this.durationObject) === this.duration
        },
        disabled() {
            return this.isAllDay || !this.isSynced 
        },
        placeholder() {
            return String(Math.floor(this.duration/(60*60*24))) + ' day(s)'
        }
    },
    methods: {
        durationToObject(duration) {
            let minutes = Math.floor(duration/60)
            let hours = Math.floor(minutes/60)
            const days = Math.floor(hours/24)

            minutes -= 60 * hours
            hours -= 24 * days

            return {
                D: String(days),
                H: days > 0 ? '' : String(hours),
                mm: days > 0 ? '' : (minutes < 10 ? '0' : '') + String(minutes),
            }
        },
        objectToDuration(object) {
            return (Number(object.H) * 60 + Number(object.mm)) * 60
        },
        slotToMinuteInterval(slotString) {
            const [hours, minutes] = slotString.split(':')
            return Number(hours) * 60 + Number(minutes)
        },
        resetValue(){
            this.durationObject = this.durationToObject(this.duration)
        },
        async inputHandler(event) {
            // this.$emit('change', this.objectToDuration(event))
            try{
                await this.$store.dispatch('changeDurationAfterEnd', {
                    calendarObjectInstance: this.$store.state.calendarObjectInstance.calendarObjectInstance,
                    totalSeconds: this.objectToDuration(event),
                })
            } catch(e) {
                this.resetValue()
                console.debug(e)
            }
        },
    }
}
</script>

<style lang="scss">

</style>