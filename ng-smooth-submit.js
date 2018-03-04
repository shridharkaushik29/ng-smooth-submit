angular.module('ngSmoothSubmit', ['ngCookies'])

        .provider('$smoothSubmit', function () {

            var set_csrf_callback = false;

            this.appendCsrfCallback = function (callback) {
                if (_.isFunction(callback)) {
                    set_csrf_callback = callback;
                }
            }

            this.$get = ['$rootScope', '$q', '$cookies', '$filter', function ($rootScope, $q, $cookies, $filter) {

                    var send = function (options) {

                        var dp = $q.defer();

                        var settings = {
                            xhrFields: {withCredentials: true},
                            success: function (data) {
                                $rootScope.$broadcast('$smoothSubmitSuccess', data);
                                try {
                                    var json = JSON.parse(data);
                                    dp.resolve(json);
                                } catch (e) {
                                    dp.resolve(data);
                                }
                            },
                            error: function (error) {
                                $rootScope.$broadcast('$smoothSubmitError', error);
                                dp.reject(error);
                            }
                        }


                        _.merge(settings, options);

                        if (options.type === 'POST' && set_csrf_callback) {
                            var cookies = $cookies.getAll();
                            set_csrf_callback(options.data, cookies);
                        }

                        dp.notify('$smoothSubmitSend');
                        $rootScope.$broadcast('$smoothSubmitSend');
                        $.ajax(settings);

                        return dp.promise;
                    }

                    var appendFormData = function (form_data, values, name) {
                        if ((values instanceof Object) && !(values instanceof File) && !(values instanceof Blob) && !(values instanceof Date)) {
                            for (key in values) {
                                if (values[key] instanceof Object)
                                    appendFormData(form_data, values[key], name + '[' + key + ']');
                                else {
                                    if (values[key] === null || values[key] === undefined) {
                                        values[key] = '';
                                    }
                                    form_data.append(name + '[' + key + ']', value);
                                }
                            }
                        } else {
                            if (values === null || values === undefined) {
                                values = '';
                            } else if (values instanceof Date) {
                                values = $filter('date')(values, "yyyy-MM-dd HH:mm:ss", "UTC");
                            }
                            form_data.append(name, values);
                        }
                    }

                    var service = {};

                    service.$post = function (url, data, options) {
                        var config = {};
                        config = _.merge(config, options);
                        config.type = "POST";
                        config.url = url;
                        config.cache = false;
                        config.processData = false;
                        config.contentType = false;
                        var formData;
                        if (data instanceof FormData) {
                            config.data = data;
                        } else {
                            formData = new FormData();
                            this.mergeFormData(formData, data);
                            config.data = formData;
                        }
                        return send(config);
                    }

                    service.$get = function (url, data, options) {
                        var config = {};
                        config = _.merge(config, options);
                        config.type = "GET";
                        config.url = url;
                        config.data = data;

                        return send(config);
                    }

                    service.mergeFormData = function (formData, object) {
                        angular.forEach(object, function (value, index) {
                            appendFormData(formData, value, index);
                        })
                    }

                    service.appendCsrfCallback = function (callback) {
                        if (_.isFunction(callback)) {
                            set_csrf_callback = callback;
                        }
                    }

                    return service;
                }
            ]
        })