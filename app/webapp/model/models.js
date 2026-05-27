sap.ui.define([
  "neuroflow/model/ModelManager"
], function (ModelManager) {
  "use strict";

  /**
   * DEPRECATED: This file exists for backward compatibility only.
   * All model creation should use ModelManager.js directly.
   * This re-exports ModelManager methods for any legacy code.
   */
  return {
    createDeviceModel: function () {
      return ModelManager.createDeviceModel();
    },

    createAppModel: function () {
      return ModelManager.createAppModel();
    }
  };
});
