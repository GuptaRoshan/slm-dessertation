sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/ui/core/Fragment'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Fragment) {
        "use strict";

        return Controller.extend("slo.salesleadsoverview.controller.Detail", {
            onInit: function () {
                var oTable = this.getView().byId("leadTable");
                var oColumnToGroupBy = oTable.getColumns()[0];
                oTable.setGroupBy(oColumnToGroupBy);

                var objModel = this.getOwnerComponent().getModel("oObjectModel");
                if (objModel) {
                    var arr = objModel.getData();
                    var locations = [];

                    for (var i = 0; i < arr.length; i++) {
                        var lTemp = {};
                        if (arr[i].entity.GPE) {
                            var place = arr[i].entity.GPE;
                            var count = 0;
                            for (var j = i; j < arr.length; j++) {
                                if (arr[j].entity.GPE && place === arr[j].entity.GPE) {
                                    count = count + 1;
                                }
                            }
                            lTemp.location = arr[i].entity.GPE;
                            lTemp.count = count;
                            locations.push(lTemp);
                        }
                    }

                    var topLeads = [];
                    var len = (arr.length >= 10) ? 10 : arr.length;
                    for (var i = 0; i < len; i++) {
                        var lTemp = {};
                        if (arr[i].class && arr[i].class === "Hot Lead") {
                            var prob = arr[i].probability;
                            //var count = 0;

                            if (prob > 0) {
                                lTemp.email = arr[i].email;
                                lTemp.count = prob;
                                topLeads.push(lTemp);
                            }
                        }
                    }

                    var oModelChart = new sap.ui.model.json.JSONModel(
                        {
                            "d": {
                                "linedata": locations,
                                "piedata": topLeads
                            }
                        }
                    );
                    this.getView().setModel(oModelChart);

                    for (var i = 0; i < arr.length; i++) {
                        if (objModel.getData()[i].probability > 0 || objModel.getData()[i].probability < 0) {
                            objModel.getData()[i].probability = parseFloat(objModel.getData()[i].probability).toFixed(2);
                        }

                        if (objModel.getData()[i].class === "Hot Lead") {
                            objModel.getData()[i].srtnum = 1;
                        }

                        if (objModel.getData()[i].class === "Warm Lead") {
                            objModel.getData()[i].srtnum = 2;
                        }

                        if (objModel.getData()[i].class === "Cold Lead") {
                            objModel.getData()[i].srtnum = 3;
                        }

                    }
                }
            },

            onHandleClickOfEntity: function (oEvent) {
                var oButton = oEvent.getSource();
                var oView = this.getView();
                var oItem = oButton.getParent();
                var oCtxPath = oItem.getCells()[1].getText();
                var arr = this.getOwnerComponent().getModel("oObjectModel").getData();
                var data = arr.filter(element => element.email == oCtxPath);

                var oModel = new JSONModel({});
                oView.setModel(oModel, "oPopoverModel");
                oModel.setData(data);

                // create popover
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "slo.salesleadsoverview.fragment.entity",
                        controller: this
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });

            },

            onHandleClickOfEmail: function (oEvent) {
                var oButton = oEvent.getSource();
                var oItem = oButton.getParent();
                var targetEmail = oItem.getCells()[1].getText();
                var subject = "Business Value";
                var body = "Hi Colleague,\n\nIn working with other SAP Labs, one of the key issues they’re struggling with is managing business process. \n\nThis past year we helped numerous companies to manage the bussiness process, resulting in money saved, revenue added, productivity increased.\n\nIf this is something you’re challenged with too, let’s set up a quick call. I have some ideas that might help. \n\nAll the best, \nRoshan ";
                sap.m.URLHelper.triggerEmail(targetEmail, subject, body, "", "", false);
            }
        });
    });
