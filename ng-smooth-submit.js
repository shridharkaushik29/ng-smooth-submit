angular.module('ngSmoothSubmit', [])

        .service('$smoothSubmit', ['$rootScope', '$q', function ($rootScope, $q) {

                var send = function (options) {
                    return $q(function (resolve, reject) {

                        var settings = {
                            success: function (data) {
                                $rootScope.$broadcast('$smoothSubmitSuccess', data);
                                try {
                                    var json = JSON.parse(data);
                                    resolve(json);
                                } catch (e) {
                                    resolve(data);
                                }
                            },
                            error: function (error) {
                                $rootScope.$broadcast('$smoothSubmitError', error);
                                reject(error);
                            }
                        }
                        settings = $.extend(settings, options);

                        $rootScope.$broadcast('$smoothSubmitSend');

                        $.ajax(settings);
                    })
                }

                var appendFormData = function (form_data, values, name) {
                    if ((values instanceof Object) && !(values instanceof File) && !(values instanceof Blob)) {
                        for (key in values) {
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
                        }
                        form_data.append(name, values);
                    }
                }

                return {
                    $post: function (url, data, options) {
                        var config = {};
                        config = $.extend(config, options);
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
                    },
                    $get: function (url, data) {
                        var config = {
                            type: "GET",
                            url: url,
                            data: data,
                        }
                        return send(config);
                    },
                    mergeFormData: function (formData, object) {
                        angular.forEach(object, function (value, index) {
                            appendFormData(formData, value, index);
                        })
                    }
                }
            }
        ])