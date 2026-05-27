sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "neuroflow/model/models"
], function (UIComponent, JSONModel, models) {
  "use strict";

  return UIComponent.extend("neuroflow.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      // Create and set models BEFORE parent init to ensure they're available for rootView
      const appModel = models.createAppModel();
      const deviceModel = models.createDeviceModel();
      
      this.setModel(appModel, "app");
      this.setModel(deviceModel, "device");
      
      // Now call parent init which will create the rootView
      UIComponent.prototype.init.apply(this, arguments);
    }
  });
});
