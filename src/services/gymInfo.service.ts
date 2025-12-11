import GymInfo from "../models/gymInfo.model";

class GymInfoService {

  async getInfo() {
    const info = await GymInfo.findOne();
    return info || null;
  }

  async saveInfo(data: any) {
    let info = await GymInfo.findOne();

    if (!info) {
      info = new GymInfo(data);
    } else {
      Object.assign(info, data);
    }

    await info.save();
    return info;
  }

}

export default new GymInfoService();
