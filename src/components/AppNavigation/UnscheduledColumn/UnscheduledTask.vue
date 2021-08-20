<template>
    <div class='fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event'>
        <div class='fc-event-main'>{{title}}</div>
    </div>
</template>

<script>
// import 

export default {
    name: 'UnscheduledTask',
    components: {},
    props: {
        title: {
            type: String,
            required: true,
        }
    },
    data() {
        return {}
    },
    computed: {},
    methods: {},
}
</script>