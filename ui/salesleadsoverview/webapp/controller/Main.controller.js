/* global xlsx:true */
/* global jszip:true */

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "slo/salesleadsoverview/libs/jszip",
    "slo/salesleadsoverview/libs/xlsx",
    'sap/m/Token'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, jszip, xlsx, Token) {
        "use strict";
        return Controller.extend("slo.salesleadsoverview.controller.Main", {
            onInit: function () {
                this.oMultiInput1 = this.getView().byId("multiInput1");
                // add validator
                var fnValidator = function (args) {
                    var text = args.text;
                    return new Token({ key: text, text: text });
                };

                this.oMultiInput1.addValidator(fnValidator);
            },


            handleConfgBtnPress: function (oEvent) {
                var oTokens = this.oMultiInput1.getTokens();
                var obj = {};
                var alltokens = [];
                for (var i = 0; i < oTokens.length; i++) {
                    obj.key = oTokens[i].getKey();
                    obj.value = oTokens[i].getText();
                    alltokens.push(obj);
                    obj = {};
                }

                var oModel = new JSONModel(alltokens);
                this.getOwnerComponent().setModel(oModel, "emailModel");

                var tok = {};
                var listToken = [];
                for (var i = 0; i < alltokens.length; i = i + 3) {
                    tok.email1 = alltokens[i].value;

                    if (alltokens[i + 1]) {
                        tok.email2 = alltokens[i + 1].value;
                    }
                    else {
                        tok.email2 = null;
                    }

                    if (alltokens[i + 2]) {
                        tok.email3 = alltokens[i + 2].value;
                    }
                    else {
                        tok.email3 = null;
                    }

                    listToken.push(tok);
                    tok = {};
                }

                var eTable = this.getView().byId("emailTokenTable");
                var eModel = new JSONModel(listToken);
                eTable.setModel(eModel, "emModel");

                var page1 = this.getView().byId("page-1");
                page1.setShowFooter(true);

            },

            handleUploadPress: function (oEvent) {
                //this.getOwnerComponent().getRouter().navTo("RouteDetail");

                if (this._file && window.FileReader) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var data = e.target.result;
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        });
                        workbook.SheetNames.forEach(function (sheetName) {
                            this.excelData = [];
                            // Here is your object for every sheet in workbook
                            var temp = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                            console.log(this.temp);
                            var emData = this.getOwnerComponent().getModel("emailModel").getData();
                            // this.excelData = temp.filter(function (temp_el) {
                            //     return emData.filter(function (emData_el) {
                            //         return emData_el.value == temp_el.email;
                            //     })
                            // });

                            for (var i = 0; i < temp.length; i++) {
                                for (var j = 0; j < emData.length; j++) {
                                    if (temp[i].email === emData[j].value) {
                                        this.excelData.push(temp[i]);
                                    }
                                }
                            }

                            console.log(this.excelData);
                        }.bind(this));

                        var url = "/un/predict";
                        let oPromise = this._doApiCallPost(url, this.excelData);
                        oPromise.then(function (value) {
                            if (value) {
                                var oModel = new JSONModel(value);
                                this.getOwnerComponent().setModel(oModel, "oObjectModel");
                                var page2 = this.getView().byId("page-2");
                                page2.setShowFooter(true);

                                var ind = this.getView().byId("il5");
                                ind.setVisible(true);
                                ind.setText("Leads generated successfully for " + this._file.name);
                            }
                        }.bind(this)).catch(
                            function (error) {
                            }.bind(this)
                        );

                    }.bind(this);
                    reader.onerror = function (err) {
                        console.log(err);
                    };
                    reader.readAsBinaryString(this._file);
                }
            },

            onPage1FooterBtnPress: function (oEvent) {
                this.byId("app").to(this.byId("app").getPages()[1].sId);
            },

            onPage2FooterBtnPress: function (oEvent) {
                this.getOwnerComponent().getRouter().navTo("RouteDetail");
            },

            onChange: function (oEvent) {
                this._file = oEvent.getParameter("files")[0];
                this._fileUploader = oEvent.getSource();
            },

            /*
                 onPress: function (oEvent) {
                     var email = this.getView().byId("input-c");
                     var title = this.getView().byId("input-d");
                     var content = this.getView().byId("input-b");
                     var url = "/un/predict";
                     var data = {};
                     data.email = email.getValue();
                     data.title = title.getValue();
                     data.content = content.getValue();
     
                     let oPromise = this._doApiCallPost(url, [data]);
                     oPromise.then(function (value) {
                         var ent = JSON.stringify(value[0].entity);
                         if (value) {
                             value[0].HTML = {
                                 HTML: ent
                             }
                             var oModel = new JSONModel(value);
                             this.getView().setModel(oModel, "oTableModel");
                         }
                     }.bind(this)).catch(
                         function (error) {
                         }.bind(this)
                     );
                 },
     
                 */

            _doApiCallPost: function (url, data) {
                return new Promise(function (resolve, reject) {
                    $.ajax({
                        url: url,
                        type: "POST",
                        async: false,
                        data: JSON.stringify(data),
                        dataType: "json",
                        contentType: 'application/json',
                        crossDomain: true,
                        success: function (response) {
                            resolve(response);
                        },
                        error: function (err) {
                            reject(err);
                        }
                    });
                });
            },


        });
    });
