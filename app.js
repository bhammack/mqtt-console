// uses mqttjs
// uses mqttWildcard
// uses jQuery

var vm = new Vue({
    el: '#app',
    data: {
        connection: {
            hostname: 'broker.mqttdashboard.com',
            port: 8000,
            clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
            username: '',
            password: ''
        },
        subscriptions: [],
        subscription: {
            topic: 'testtopic/#',
            qos: 2,
            color: '#ff0000'
        },
        publication: {
            topic: '',
            qos: 0,
            retain: false,
            message: ''
        },
        messages: [],
        client: {
            connected: false
        }
    },
    methods: {
        connect: function() {
            var domain = 'ws://' + this.connection.hostname + ':' + this.connection.port + '/mqtt';
            console.log(domain);
            this.client = mqtt.connect(domain, {
                reconnectPeriod: 10000
            });
            this.client.on('connect', function() {
                console.log('connected');
                $('#connectionModal').modal('hide');
            });
            this.client.on('message', function(topic, message, packet) {
                var payload = message.toString();
                vm.messages.push({
                    color: vm.getColorForTopic(topic),
                    isJSON: vm.isJSON(payload),
                    datetime: new Date().toLocaleString(),
                    topic: topic,
                    qos: packet.qos,
                    retain: packet.retain,
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
        disconnect: function() {
            this.client.end();
            this.subscriptions = [];
            this.messages = [];
        },
        publish: function() {
            this.client.publish(
                this.publication.topic, 
                this.publication.message, 
                {
                    qos: this.publication.qos, 
                    retain: this.publication.retain
                }, 
                function(err) {
                    if (err) {
                        alert(err);
                    } else {
                        vm.publication.message = '';
                    }
                }
            );

        },
        subscribe: function(event) {
            this.client.subscribe(
                this.subscription.topic, 
                {
                    qos: this.subscription.qos
                },
                function(err, granted) {
                    if (err) {
                        alert(err);
                    } else {
                        for (var i = 0; i < granted.length; i++) {
                            vm.subscriptions.push({
                                topic: granted[i].topic, 
                                qos: granted[i].qos,
                                color: vm.subscription.color
                            });
                        }
                        vm.subscription.topic = '';
                    }
            });
        },
        unsubscribe: function(subscription) {
            this.client.unsubscribe(subscription.topic, function(err) {
                if (err) {
                    alert(err);
                }
            });
            var index = this.subscriptions.indexOf(subscription);
            if (index > -1) {
                this.subscriptions.splice(index, 1);
            }
            // Also remove all messages that were generated as a result of that subscription.
            var i = this.messages.length;
            while (i--) {
                if (mqttWildcard(this.messages[i].topic, subscription.topic) != null) {
                    this.messages.splice(i, 1);
                }
            }
        },
        toggleRetain: function() {
            this.publication.retain = !this.publication.retain;
        },
        isJSON: function(str) {
            try {
                return (JSON.parse(str) && !!str);
            } catch (e) {
                return false;
            }
        },
        getColorForTopic: function(topic) {
            for (var i = 0; i < this.subscriptions.length; i++) {
                if (mqttWildcard(topic, this.subscriptions[i].topic) != null) {
                    console.log(this.subscriptions[i].color);
                    return this.subscriptions[i].color;
                }
            }
            return null;
        }
    }
})