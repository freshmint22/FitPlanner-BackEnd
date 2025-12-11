import NotificationConfig from "../models/notificationConfig.model";

class NotificationService {

  async getConfig() {
    const config = await NotificationConfig.findOne();
    return config;
  }

  async saveConfig(data: any) {
    let config = await NotificationConfig.findOne();

    if (!config) {
      config = new NotificationConfig(data);
    } else {
      Object.assign(config, data);
    }

    await config.save();
    return config;
  }

  async sendTest() {
    const config = await NotificationConfig.findOne();

    if (!config) throw new Error("No hay configuración registrada");

    config.ultimoEnvioPrueba = new Date();
    await config.save();

    // Simulación del envío
    let respuesta = "";

    switch (config.tipo) {
      case "email":
        respuesta = "Simulación de envío de email exitosa";
        break;
      case "push":
        respuesta = "Simulación de notificación push exitosa";
        break;
      case "interna":
        respuesta = "Simulación de alerta interna exitosa";
        break;
    }

    return {
      mensaje: respuesta,
      fecha: config.ultimoEnvioPrueba,
    };
  }
}

export default new NotificationService();
