<template>
    <div class="mx-datepicker">

        <vue-timepicker
            lazy
            auto-scroll
            format=" H:mm"
            input-width="100%"
            hide-clear-button
            :placeholder="placeholder"
            :value="durationObject"
            :minute-interval="slotToMinuteInterval(slotDuration)"
            :disabled="isAllDay"
            @input="inputHandler" >

            <template v-slot:icon>
                &#9201;
            </template>

        </vue-timepicker>

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
        totalMinutes() { return Math.floor(this.duration/60) },
        totalHours() { return Math.floor(this.totalMinutes/60) },
        days() { return Math.floor(this.totalHours/24) },
        hours() { return this.totalHours - 24 * this.days },
        minutes() { return this.totalMinutes - 60 * this.totalHours },
        dStr() { return String(this.days) },
        hStr() { return this.days > 0 ? '' : String(this.hours) },
        mmStr() { return this.days > 0 ? '' : (this.minutes < 10 ? '0' : '') + String(this.minutes) },
        durationObject() { return { D: this.dStr, H: this.hStr, mm: this.mmStr } },
        placeholder() { return String(this.days) + ' day(s)' },
    },
    methods: {
        objectToDuration(object) {
            return ( ( Number(object?.D ?? 0) * 24 + Number(object.H) ) * 60 + Number(object.mm) ) * 60
        },
        slotToMinuteInterval(slotString) {
            const [hours, minutes] = slotString.split(':')
            return Number(hours) * 60 + Number(minutes)
        },
        async inputHandler(event) {
            this.$emit('change', this.objectToDuration(event))
        },
    }
}
</script>
