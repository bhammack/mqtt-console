var vm = new Vue({
    el: '#app',
    data: {
        subs: [],
        sub: {
            qos: 0
        },
        pub: {
            retain: false
        },
        messages: [],
        client: {}
    },
    methods: {
        connect: function() {
            var vu = this;
            this.client = mqtt.connect('ws://broker.mqttdashboard.com:8000/mqtt');
            this.client.on('connect', function() {
                console.log('connected');
            });
            this.client.on('message', function(topic, message, packet) {
                //console.log(topic, message.toString()); 
                var payload = message.toString();
                vu.messages.push({
                    isJSON: vm.isJSON(payload),
                    datetime: new Date().toLocaleString(),
                    topic: topic, 
                    payload: payload
                });
            });
            this.client.on('reconnect', function() {
                console.log('reconnect');
            });
            this.client.on('close', function() {
                console.log('close');
            });
            this.client.on('offline', function() {
                console.log('offline');
            });
            this.client.on('error', function(error) {
                console.log('error:', error);
            });
            this.client.on('end', function() {
                console.log('end');
            });
        },
        publish: function() {
            // publish pub.message on pub.topic with pub.qos and pub.retain...
            //client.publish
            this.client.publish(this.pub.topic, this.pub.message, {qos: this.pub.qos, retain: false}, function(err) {
                if (err) {
                    alert(err);
                }
            })
        },
        subscribe: function(event) {
            // subscribe to pub.topic with pub.qos
            // make sure to add to pubs list so we can color code messages as they arrive\
            this.client.subscribe(this.sub.topic, {}, function(err, granted) {
                if (err) {
                    alert(err);
                } else {
                    for (var i = 0; i < granted.length; i++) {
                        vm.subs.push({topic: granted[i].topic, qos: granted[i].qos});
                    }
                }
            });
        },
        unsubscribe: function(sub) {
            this.client.unsubscribe(sub.topic, function(err) {
                if (err) {
                    alert(err);
                }
            });
            var index = this.subs.indexOf(sub);
            if (index > -1) {
                this.subs.splice(index, 1);
            }
        },
        toggleRetain: function(event) {
            if (vm.pub.retain) {
                vm.pub.retain = false;
                event.target.innerHTML = '<i class="fas fa-square"></i>';
            }
            else
            {
                vm.pub.retain = true;
                event.target.innerHTML = '<i class="fas fa-check-square"></i>';
            }
        },
        isJSON: function(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }
    },
    mounted() {
        this.connect();
    }
})