import GeneralConfig from "../models/generalConfig.model";

class GeneralConfigService {
  
  async getConfig() {
    let config = await GeneralConfig.findOne();

    if (!config) {
      config = await this.createDefaultConfig();
    }

    return config;
  }

  async createDefaultConfig() {
    const defaultConfig = await GeneralConfig.create({
      nombreSistema: "FitPlanner System",
      colorPrimario: "#1E90FF",
      colorSecundario: "#141414",
      limiteUsuarios: 100,
      modoMantenimiento: false,
      updatedBy: "system"
    });

    return defaultConfig;
  }

  async updateConfig(data: any, adminId: string) {
    const config = await GeneralConfig.findOne();

    if (!config) {
      throw new Error("No existe configuración base.");
    }

    config.nombreSistema = data.nombreSistema ?? config.nombreSistema;
    config.colorPrimario = data.colorPrimario ?? config.colorPrimario;
    config.colorSecundario = data.colorSecundario ?? config.colorSecundario;
    config.limiteUsuarios = data.limiteUsuarios ?? config.limiteUsuarios;
    config.modoMantenimiento = data.modoMantenimiento ?? config.modoMantenimiento;
    config.updatedBy = adminId;

    await config.save();

    return config;
  }
}

export default new GeneralConfigService();
