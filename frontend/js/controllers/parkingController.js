const ParkingController = (function (model, view) {
  async function init() {
    try {
      const data = await model.getStatus();
      view.renderStatus(data);
    } catch (err) {
      view.renderError(err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init };
})(ParkingModel, ParkingView);
