import module from "./module";

module

        .provider('$smoothSubmit', function () {

            var config = {};

            this.$get = ['$rootScope', '$q', '$filter', function ($rootScope, $q, $filter) {

                    var appendFormData = function (form_data, values, name) {
                        if ((values instanceof Object) && !(values instanceof File) && !(values instanceof Blob) && !(values instanceof Date)) {
                            for (var key in values) {
                                if (values[key] instanceof Object)
                                    appendFormData(form_data, values[key], name + '[' + key + ']');
                                else {
                                    if (values[key] === null || values[key] === undefined) {
                                        values[key] = '';
                                    }
                                    form_data.append(name + '[' + key + ']', values[key]);
                                }
                            }
                        } else {
                            if (values === null || values === undefined) {
                                values = '';
                            } else if (values instanceof Date) {
                                values = $filter('date')(values, "yyyy-MM-dd HH:mm:ss");
                            }
                            form_data.append(name, values);
                        }
                    }

                    var mergeFormData = (formData, object) => {
                        angular.forEach(object, function (value, index) {
                            appendFormData(formData, value, index);
                        })
                    }

                    var service = {};

                    service.$post = function (url, data, options) {

                        var config = {}
                        
                        _.merge(config, options);

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
                            mergeFormData(formData, data);
                            config.data = formData;
                        }

                        return this.send(config);
                    }

                    service.$get = function (url, data, options) {
                        var config = {}

                        _.merge(config, options);

                        config.type = "GET";
                        config.url = url;
                        config.data = data;

                        return this.send(config);
                    }

                    service.$delete = function (url, data, options) {
                        var config = {}

                        _.merge(config, options);

                        config.type = "DELETE";
                        config.url = url;
                        config.data = data;

                        return this.send(config);
                    }

                    service.send = function (options) {

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

                        dp.notify('$smoothSubmitSend');

                        $rootScope.$broadcast('$smoothSubmitSend');

                        $.ajax(settings);

                        return dp.promise;
                    };

                    return service;
                }
            ]
        })